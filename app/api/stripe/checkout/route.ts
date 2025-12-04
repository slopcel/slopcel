import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  });
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
    const { priceId, tier } = await request.json();

    if (!priceId && !tier) {
      return NextResponse.json(
        { error: 'Price ID or tier is required' },
        { status: 400 }
      );
    }

    // Get the current user (optional - allow guest checkout)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine amount based on tier
    let amount = 7500; // $75 default (positions 12-100)
    let tierName = 'Hall of Famer';
    let tierDescription = '1 app deployment with Hall of Fame placement';
    
    if (tier === 'premium') {
      amount = 30000; // $300 (position 1)
      tierName = 'Premium Hall of Famer';
      tierDescription = '1 app deployment with #1 Hall of Fame placement';
    } else if (tier === 'standard') {
      amount = 15000; // $150 (positions 2-11)
      tierName = 'Standard Hall of Famer';
      tierDescription = '1 app deployment with Hall of Fame placement (positions 2-11)';
    } else if (tier === 'hall_of_fame') {
      amount = 7500; // $75 (positions 12-100)
      tierName = 'Hall of Famer';
      tierDescription = '1 app deployment with Hall of Fame placement (positions 12-100)';
    } else if (tier === 'bare_minimum') {
      amount = 5000; // $50 (no hall of fame)
      tierName = 'The Bare Minimum';
      tierDescription = '1 app deployment';
    }

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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierName,
              description: tierDescription,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/#pricing`,
      customer_email: user?.email || undefined, // Pre-fill email if logged in
      client_reference_id: user?.id || undefined,
      metadata: {
        user_id: user?.id || 'guest',
        tier: tier || 'bare_minimum',
        create_account: user ? 'false' : 'true', // Flag to create account after payment
      },
    });

    // Create order record in database (only if user is logged in)
    // For guest checkout, order will be created in webhook after account creation
    if (user) {
      await supabase.from('orders').insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amount,
        status: 'pending',
      });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

