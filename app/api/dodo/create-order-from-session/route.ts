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

    // Get checkout session status first to get payment info
    let session;
    try {
      session = await getCheckoutSessionStatus(sessionId);
      console.log('Session status:', JSON.stringify(session, null, 2));
    } catch (e) {
      console.error('Error fetching session status:', e);
      // If we have an existing order, return it even if we can't get session status
      if (existingOrder) {
        return NextResponse.json({ 
          success: true, 
          order: existingOrder,
          message: 'Order exists, could not verify session' 
        });
      }
      return NextResponse.json(
        { error: 'Could not verify payment session' },
        { status: 400 }
      );
    }

    if (existingOrder) {
      // Order already exists, check if it needs updating
      const needsUpdate = existingOrder.status === 'pending';
      
      if (needsUpdate) {
        // Try to get payment status from session or payment_id
        const paymentId = session?.payment_id || existingOrder.dodo_payment_id;
        if (paymentId) {
          try {
            const payment = await getPayment(paymentId);
            console.log('Payment status check:', payment.status);
            
            if (payment.status === 'succeeded') {
              // Get metadata for tier
              const metadata = payment.metadata || {};
              const tier = metadata.tier as TierType;
              const amount = tier ? TIER_AMOUNTS[tier] : payment.total_amount || 0;
              
              const updateData: any = { 
                status: 'completed',
                dodo_payment_id: paymentId,
                payer_email: payment.customer?.email || existingOrder.payer_email,
              };
              
              // Assign hall of fame position if not already assigned
              if (!existingOrder.hall_of_fame_position && tier && tier !== 'bare_minimum') {
                const { data: nextPosition, error: positionError } = await (supabase as any)
                  .rpc('get_next_hall_of_fame_position', { amount_cents: amount });

                if (!positionError && nextPosition) {
                  updateData.hall_of_fame_position = nextPosition;
                }
              }
              
              // Link to user if not already linked
              if (!existingOrder.user_id && loggedInUserId) {
                updateData.user_id = loggedInUserId;
              }
              
              await (supabase
                .from('orders') as any)
                .update(updateData)
                .eq('id', existingOrder.id);
                
              console.log('Updated existing order to completed:', existingOrder.id);
            }
          } catch (e) {
            console.error('Error checking payment status:', e);
          }
        }
      } else if (!existingOrder.user_id && loggedInUserId) {
        // Just link the user if needed
        await (supabase.from('orders') as any)
          .update({ user_id: loggedInUserId })
          .eq('id', existingOrder.id);
      }

      // Refetch to get updated data
      const { data: updatedOrder } = await (supabase
        .from('orders') as any)
        .select('*')
        .eq('id', existingOrder.id)
        .single();

      return NextResponse.json({ 
        success: true, 
        order: updatedOrder || existingOrder,
        message: 'Order already exists' 
      });
    }

    // No existing order - check if payment is complete
    if (!session.payment_id) {
      // Session exists but payment not started yet
      console.log('No payment_id in session yet');
      return NextResponse.json(
        { error: 'Payment not completed yet', sessionStatus: session.payment_status },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await getPayment(session.payment_id);
    console.log('Payment details:', JSON.stringify(payment, null, 2));
    
    if (payment.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not succeeded', paymentStatus: payment.status },
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

