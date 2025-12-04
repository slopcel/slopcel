import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayPalOrder, getPayPalClientId } from '@/lib/paypal';
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

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier is required' },
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

    // Create PayPal Order
    // Note: PayPal automatically appends ?token=ORDER_ID&PayerID=PAYER_ID to the return URL
    const origin = request.nextUrl.origin;
    const paypalOrder = await createPayPalOrder({
      amount,
      tierName,
      tierDescription,
      userId: user?.id,
      tier,
      returnUrl: `${origin}/payment-success`,
      cancelUrl: `${origin}/#pricing`,
    });

    // Find the approval URL
    const approvalUrl = paypalOrder.links.find(link => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new Error('No approval URL in PayPal response');
    }

    // Create order record in database (only if user is logged in)
    // For guest checkout, order will be created after capture
    if (user) {
      await (supabase.from('orders') as any).insert({
        user_id: user.id,
        paypal_order_id: paypalOrder.id,
        amount: amount,
        status: 'pending',
      });
    }

    return NextResponse.json({ 
      orderId: paypalOrder.id, 
      approvalUrl,
      clientId: getPayPalClientId(),
    });
  } catch (error: any) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

