import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { getCheckoutSessionStatus, getPayment, TIER_AMOUNTS, TierType } from '@/lib/dodo';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

// This endpoint creates an order from a checkout session if it doesn't exist
// Used as a fallback when webhook hasn't processed the payment yet
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`create-order:${ip}`, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();
    // Try to identify the currently logged-in user (if any) to link the order
    const supabaseAuth = await createClient();
    const { data: authUserData } = await supabaseAuth.auth.getUser();
    const loggedInUserId = authUserData?.user?.id || null;

    // Helper: resolve user ID from email
    const resolveUserIdFromEmail = async (email?: string | null) => {
      if (!email) return null;
      try {
        const { data, error } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 200,
          email,
        } as any);
        if (error) {
          console.error('listUsers error:', error);
          return null;
        }
        const match = data?.users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        return match?.id || null;
      } catch (e) {
        console.error('Error resolving user by email:', e);
        return null;
      }
    };

    // Check if order already exists
    const { data: existingOrder } = await (supabase
      .from('orders') as any)
      .select('*')
      .eq('dodo_session_id', sessionId)
      .maybeSingle();

    if (existingOrder) {
      // Order already exists, check if it needs updating
      if (existingOrder.status === 'pending' && existingOrder.dodo_payment_id) {
        // Try to get payment status
        try {
          const payment = await getPayment(existingOrder.dodo_payment_id);
          if (payment.status === 'succeeded') {
            await (supabase
              .from('orders') as any)
              .update({ status: 'completed' })
              .eq('id', existingOrder.id);
          }
        } catch (e) {
          console.error('Error checking payment status:', e);
        }
      }
      // If order exists but has no user and we have a logged-in user, link it
      if (!existingOrder.user_id && loggedInUserId) {
        await (supabase.from('orders') as any)
          .update({ user_id: loggedInUserId })
          .eq('id', existingOrder.id);
      }

      return NextResponse.json({ 
        success: true, 
        order: existingOrder,
        message: 'Order already exists' 
      });
    }

    // Get checkout session status
    const session = await getCheckoutSessionStatus(sessionId);
    
    if (!session.payment_id) {
      return NextResponse.json(
        { error: 'Payment not completed yet' },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await getPayment(session.payment_id);
    
    if (payment.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not succeeded' },
        { status: 400 }
      );
    }

    // Extract metadata
    const metadata = payment.metadata || {};
    const emailFromPayment = payment.customer?.email || session.customer_email;
    console.log('create-order-from-session user resolution inputs:', {
      loggedInUserId,
      metadataUserId: metadata.user_id,
      emailFromPayment,
    });
    // Priority for user linking:
    // 1. Currently logged-in user
    // 2. Metadata user_id (set during checkout)
    // 3. User resolved by payment email
    const resolvedUserIdFromEmail = await resolveUserIdFromEmail(emailFromPayment);
    const userId = loggedInUserId || (metadata.user_id && metadata.user_id !== 'guest' ? metadata.user_id : null) || resolvedUserIdFromEmail;
    const tier = metadata.tier as TierType;
    const amount = tier ? TIER_AMOUNTS[tier] : payment.total_amount || 0;

    // Create order
    const orderData: any = {
      dodo_payment_id: payment.payment_id,
      dodo_session_id: sessionId,
      amount: amount,
      status: 'completed',
      payer_email: payment.customer?.email || session.customer_email,
      user_id: userId && userId !== 'guest' ? userId : null,
    };

    // Assign hall of fame position for paid tiers
    if (tier && tier !== 'bare_minimum') {
      const { data: nextPosition, error: positionError } = await (supabase as any)
        .rpc('get_next_hall_of_fame_position', { amount_cents: amount });

      if (!positionError && nextPosition) {
        orderData.hall_of_fame_position = nextPosition;
      }
    }

    const { data: newOrder, error: insertError } = await (supabase
      .from('orders') as any)
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating order:', insertError);
      return NextResponse.json(
        { error: 'Failed to create order', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      order: newOrder,
      message: 'Order created successfully' 
    });
  } catch (error: any) {
    console.error('Create order from session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

