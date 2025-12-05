import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createCheckoutSession, getTierInfo, TIER_AMOUNTS, TierType } from '@/lib/dodo';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute for checkout
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`checkout:${ip}`, rateLimitConfigs.strict);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { tier } = await request.json();

    if (!tier || !['premium', 'standard', 'hall_of_fame', 'bare_minimum'].includes(tier)) {
      return NextResponse.json(
        { error: 'Valid tier is required' },
        { status: 400 }
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
        console.error('Error checking availability:', availabilityError);
        return NextResponse.json(
          { error: 'Failed to check availability' },
          { status: 500 }
        );
      }
      
      if (!isAvailable) {
        const tierLabel = tier === 'premium' ? '$300 tier' : tier === 'standard' ? '$150 tier' : '$75 tier';
        return NextResponse.json(
          { error: `All spots for the ${tierLabel} are currently taken. Please choose a different tier.` },
          { status: 400 }
        );
      }
    }

    // Create Dodo Payments checkout session
    const origin = request.nextUrl.origin;
    const checkoutResult = await createCheckoutSession({
      tier: tierType,
      userId: user?.id,
      // Dodo will append session_id as a query parameter automatically
      returnUrl: `${origin}/payment-success`,
      metadata: {
        tier_name: tierInfo.name,
        tier_description: tierInfo.description,
      },
    });

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
      // Don't fail the checkout if order creation fails - webhook/fallback will handle it
    } else {
      console.log('Initial order created:', newOrder?.id);
    }

    return NextResponse.json({ 
      sessionId: checkoutResult.sessionId, 
      checkoutUrl: checkoutResult.checkoutUrl,
    });
  } catch (error: any) {
    console.error('Dodo create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

