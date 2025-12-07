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
  console.log('[Checkout] Request received');
  
  // Wrap everything in try-catch to catch any unexpected errors
  try {
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
      console.log('[Checkout] Parsed tier:', tier);
    } catch (e: any) {
      return errorResponse(
        'Invalid request body',
        'INVALID_TIER',
        400,
        `Could not parse JSON body: ${e?.message}`
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

    // Check env vars early
    console.log('[Checkout] Checking env vars...');
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return errorResponse(
        'Payment system is not configured. Please contact support.',
        'MISSING_API_KEY',
        500,
        'DODO_PAYMENTS_API_KEY environment variable is missing'
      );
    }
    console.log('[Checkout] API key present:', apiKey.substring(0, 8) + '...');

    // Fail fast if product IDs are missing
    const productEnv: Record<string, string | undefined> = {
      premium: process.env.DODO_PRODUCT_PREMIUM,
      standard: process.env.DODO_PRODUCT_STANDARD,
      hall_of_fame: process.env.DODO_PRODUCT_HALL_OF_FAME,
      bare_minimum: process.env.DODO_PRODUCT_BARE_MINIMUM,
    };
    
    console.log('[Checkout] Product IDs:', {
      premium: productEnv.premium ? 'set' : 'MISSING',
      standard: productEnv.standard ? 'set' : 'MISSING',
      hall_of_fame: productEnv.hall_of_fame ? 'set' : 'MISSING',
      bare_minimum: productEnv.bare_minimum ? 'set' : 'MISSING',
    });
    
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
    console.log('[Checkout] Creating Supabase client...');
    let supabase;
    try {
      supabase = await createClient();
    } catch (e: any) {
      return errorResponse(
        'Database connection failed. Please try again.',
        'INTERNAL_ERROR',
        500,
        `Supabase client error: ${e?.message}`
      );
    }
    
    console.log('[Checkout] Getting user...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[Checkout] User:', user ? { id: user.id, email: user.email } : 'guest');
    
    // Use service role for inserts to avoid RLS issues for guests
    console.log('[Checkout] Creating admin client...');
    let supabaseAdmin;
    try {
      supabaseAdmin = await createServiceRoleClient();
    } catch (e: any) {
      return errorResponse(
        'Database admin connection failed. Please try again.',
        'INTERNAL_ERROR',
        500,
        `Supabase admin client error: ${e?.message}`
      );
    }

    const tierType = tier as TierType;
    const tierInfo = getTierInfo(tierType);
    const amount = TIER_AMOUNTS[tierType];
    console.log('[Checkout] Tier info:', { tierType, amount });

    // Check hall of fame availability for hall of fame tiers
    console.log('[Checkout] Checking availability for tier:', tier);
    if (tier === 'premium' || tier === 'standard' || tier === 'hall_of_fame') {
      try {
        const { data: isAvailable, error: availabilityError } = await supabase
          .rpc('check_tier_availability', { amount_cents: amount });
        
        console.log('[Checkout] Availability check result:', { isAvailable, error: availabilityError });
        
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
      } catch (e: any) {
        return errorResponse(
          'Unable to check tier availability. Please try again.',
          'AVAILABILITY_CHECK_FAILED',
          500,
          `RPC error: ${e?.message}`,
          tier
        );
      }
    }

    // Create Dodo Payments checkout session
    const origin = request.nextUrl.origin;
    console.log('[Checkout] Creating Dodo session, origin:', origin);
    
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
      console.log('[Checkout] Dodo session created:', checkoutResult.sessionId);
    } catch (err: any) {
      console.error('[Checkout] createCheckoutSession failed:', err);
      
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
    console.log('[Checkout] Creating initial order...');
    try {
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
        console.error('[Checkout] Order insert error:', insertError);
        // Log but don't fail - checkout session is created, webhook/fallback will handle order
      } else {
        console.log('[Checkout] Order created:', newOrder?.id);
      }
    } catch (e: any) {
      console.error('[Checkout] Order creation exception:', e);
      // Don't fail the checkout
    }

    console.log('[Checkout] Success! Returning checkout URL');
    return NextResponse.json({ 
      success: true,
      sessionId: checkoutResult.sessionId, 
      checkoutUrl: checkoutResult.checkoutUrl,
    });
    
  } catch (error: any) {
    console.error('[Checkout] FATAL ERROR:', error);
    console.error('[Checkout] Error stack:', error?.stack);
    
    return errorResponse(
      'An unexpected error occurred. Please try again or contact support.',
      'INTERNAL_ERROR',
      500,
      `${error?.name}: ${error?.message}`,
      undefined
    );
  }
}

