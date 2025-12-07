import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createCheckoutSession, getTierInfo, TIER_AMOUNTS, TierType } from '@/lib/dodo';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

// Error codes for client-side handling
export type CheckoutErrorCode = 
  | 'RATE_LIMITED'
  | 'INVALID_TIER'
  | 'MISSING_API_KEY'
  | 'MISSING_PRODUCT_ID'
  | 'AVAILABILITY_CHECK_FAILED'
  | 'TIER_SOLD_OUT'
  | 'DODO_API_ERROR'
  | 'ORDER_CREATION_FAILED'
  | 'INTERNAL_ERROR';

interface CheckoutErrorResponse {
  error: string;
  code: CheckoutErrorCode;
  details?: string;
  tier?: string;
}

function errorResponse(
  error: string, 
  code: CheckoutErrorCode, 
  status: number, 
  details?: string,
  tier?: string,
  headers?: HeadersInit
): NextResponse<CheckoutErrorResponse> {
  console.error(`[Checkout Error] ${code}: ${error}`, details ? `Details: ${details}` : '');
  return NextResponse.json(
    { error, code, details, tier },
    { status, headers }
  );
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute for checkout
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`checkout:${ip}`, rateLimitConfigs.strict);
  
  if (!rateLimitResult.success) {
    return errorResponse(
      'Too many requests. Please wait a moment and try again.',
      'RATE_LIMITED',
      429,
      `Rate limit exceeded for IP`,
      undefined,
      rateLimitHeaders(rateLimitResult)
    );
  }

  let tier: string | undefined;
  
  try {
    const body = await request.json();
    tier = body.tier;
  } catch (e) {
    return errorResponse(
      'Invalid request body',
      'INVALID_TIER',
      400,
      'Could not parse JSON body'
    );
  }

  if (!tier || !['premium', 'standard', 'hall_of_fame', 'bare_minimum'].includes(tier)) {
    return errorResponse(
      'Please select a valid pricing tier',
      'INVALID_TIER',
      400,
      `Received tier: ${tier}`
    );
  }

  try {
    // Ensure required env vars
    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return errorResponse(
        'Payment system is not configured. Please contact support.',
        'MISSING_API_KEY',
        500,
        'DODO_PAYMENTS_API_KEY environment variable is missing'
      );
    }

    // Fail fast if product IDs are missing
    const productEnv: Record<string, string | undefined> = {
      premium: process.env.DODO_PRODUCT_PREMIUM,
      standard: process.env.DODO_PRODUCT_STANDARD,
      hall_of_fame: process.env.DODO_PRODUCT_HALL_OF_FAME,
      bare_minimum: process.env.DODO_PRODUCT_BARE_MINIMUM,
    };
    
    if (!productEnv[tier]) {
      const tierNames: Record<string, string> = {
        premium: 'Premium ($300)',
        standard: 'Standard ($150)',
        hall_of_fame: 'Hall of Fame ($75)',
        bare_minimum: 'Bare Minimum ($50)',
      };
      return errorResponse(
        `The ${tierNames[tier] || tier} tier is not available. Please contact support.`,
        'MISSING_PRODUCT_ID',
        500,
        `Product ID not configured for tier: ${tier}`,
        tier
      );
    }

    // Get the current user (optional - allow guest checkout)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('create-checkout user:', user ? { id: user.id, email: user.email } : null);
    // Use service role for inserts to avoid RLS issues for guests
    const supabaseAdmin = await createServiceRoleClient();

    const tierType = tier as TierType;
    const tierInfo = getTierInfo(tierType);
    const amount = TIER_AMOUNTS[tierType];

    // Check hall of fame availability for hall of fame tiers
    if (tier === 'premium' || tier === 'standard' || tier === 'hall_of_fame') {
      const { data: isAvailable, error: availabilityError } = await supabase
        .rpc('check_tier_availability', { amount_cents: amount });
      
      if (availabilityError) {
        return errorResponse(
          'Unable to check tier availability. Please try again.',
          'AVAILABILITY_CHECK_FAILED',
          500,
          availabilityError.message,
          tier
        );
      }
      
      if (!isAvailable) {
        const tierLabel = tier === 'premium' ? 'Premium ($300)' : tier === 'standard' ? 'Standard ($150)' : 'Hall of Fame ($75)';
        return errorResponse(
          `All spots for the ${tierLabel} tier are currently taken. Please choose a different tier.`,
          'TIER_SOLD_OUT',
          400,
          `No positions available for tier: ${tier}`,
          tier
        );
      }
    }

    // Create Dodo Payments checkout session
    const origin = request.nextUrl.origin;
    console.log('Creating Dodo checkout session for tier:', tier, 'origin:', origin);
    
    let checkoutResult;
    try {
      checkoutResult = await createCheckoutSession({
        tier: tierType,
        userId: user?.id,
        // Dodo will redirect back with payment_id and status params
        returnUrl: `${origin}/payment-success`,
        metadata: {
          tier_name: tierInfo.name,
          tier_description: tierInfo.description,
        },
      });
    } catch (err: any) {
      console.error('createCheckoutSession failed:', err);
      
      // Parse Dodo API error for more helpful message
      let userMessage = 'Unable to initialize payment. Please try again.';
      let errorDetails = err?.message || String(err);
      
      // Check for common Dodo errors
      if (errorDetails.includes('401') || errorDetails.includes('Unauthorized')) {
        userMessage = 'Payment authentication failed. Please contact support.';
      } else if (errorDetails.includes('404') || errorDetails.includes('not found')) {
        userMessage = 'Payment product not found. Please contact support.';
      } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
        userMessage = 'Unable to connect to payment service. Please check your connection and try again.';
      } else if (errorDetails.includes('timeout')) {
        userMessage = 'Payment service is taking too long. Please try again.';
      }
      
      return errorResponse(
        userMessage,
        'DODO_API_ERROR',
        500,
        errorDetails,
        tier
      );
    }

    // Create order record in database for both logged-in and guest users
    // This ensures we can track the order even if webhook fails
    const { data: newOrder, error: insertError } = await (supabaseAdmin.from('orders') as any)
      .insert({
        user_id: user?.id || null,
        dodo_session_id: checkoutResult.sessionId,
        amount: amount,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating initial order:', insertError);
      // Log but don't fail - checkout session is created, webhook/fallback will handle order
    } else {
      console.log('Initial order created:', newOrder?.id);
    }

    console.log('Checkout session created successfully:', {
      sessionId: checkoutResult.sessionId,
      tier,
    });

    return NextResponse.json({ 
      success: true,
      sessionId: checkoutResult.sessionId, 
      checkoutUrl: checkoutResult.checkoutUrl,
    });
  } catch (error: any) {
    console.error('Unexpected checkout error:', error);
    
    return errorResponse(
      'An unexpected error occurred. Please try again or contact support.',
      'INTERNAL_ERROR',
      500,
      error?.message || String(error),
      tier
    );
  }
}

