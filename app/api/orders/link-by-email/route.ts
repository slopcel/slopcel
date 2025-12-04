import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// This endpoint links any orders made with the same email to the current user
// This handles the case where a user makes a guest purchase, then creates/logs into their account
export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`link-email:${ip}`, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User has no email' },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceRoleClient();
    let linkedCount = 0;
    let createdCount = 0;

    // 1. Link orders from other accounts with same email
    const { data: usersList } = await serviceClient.auth.admin.listUsers();
    const usersWithEmail = usersList?.users?.filter(u => u.email === user.email) || [];
    const otherUserIds = usersWithEmail.map(u => u.id).filter(id => id !== user.id);
    
    if (otherUserIds.length > 0) {
      const { data: updatedOrders, error: updateError } = await (serviceClient
        .from('orders') as any)
        .update({ user_id: user.id })
        .in('user_id', otherUserIds)
        .select();

      if (!updateError && updatedOrders) {
        linkedCount = updatedOrders.length;
      }
    }

    // 2. Check for recent Stripe sessions with this email that don't have orders
    try {
      // Get recent checkout sessions (last 24 hours) for this email
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
        customer_details: { email: user.email },
      });

      for (const session of sessions.data) {
        // Only process completed sessions
        if (session.payment_status !== 'paid') continue;
        
        // Check if order exists for this session
        const { data: existingOrder } = await (serviceClient
          .from('orders') as any)
          .select('id')
          .eq('stripe_session_id', session.id)
          .maybeSingle();

        if (!existingOrder && session.amount_total) {
          // Create the order
          let hallOfFamePosition: number | null = null;
          const amount = session.amount_total;

          // Get HOF position if applicable
          if (amount === 30000 || amount === 15000 || amount === 7500) {
            const { data: position } = await serviceClient
              .rpc('get_next_hall_of_fame_position', { amount_cents: amount } as any);
            if (position !== null && position !== undefined) {
              hallOfFamePosition = position as number;
            }
          }

          const { error: insertError } = await (serviceClient
            .from('orders') as any)
            .insert({
              user_id: user.id,
              stripe_session_id: session.id,
              amount: amount,
              status: 'completed',
              hall_of_fame_position: hallOfFamePosition,
            });

          if (!insertError) {
            createdCount++;
            console.log(`Created order for session ${session.id}, user ${user.id}`);
          } else {
            console.error('Error creating order from session:', insertError);
          }
        }
      }
    } catch (stripeError) {
      console.error('Error checking Stripe sessions:', stripeError);
      // Don't fail the whole request if Stripe check fails
    }

    const totalLinked = linkedCount + createdCount;
    
    if (totalLinked > 0) {
      console.log(`Linked/created ${totalLinked} orders for user ${user.id} (${user.email})`);
    }

    return NextResponse.json({ 
      linked: totalLinked,
      message: totalLinked > 0 
        ? `Successfully linked ${totalLinked} order(s) to your account!` 
        : 'No orders to link'
    });
  } catch (error) {
    console.error('Error in link-by-email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

