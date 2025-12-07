import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { getPayment, TIER_AMOUNTS, TierType } from '@/lib/dodo';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

// This endpoint completes an order using the payment_id from Dodo redirect
// Dodo redirects to: /payment-success?payment_id=xxx&status=succeeded
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`complete-order:${ip}`, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('Completing order for payment_id:', paymentId);

    const supabase = await createServiceRoleClient();
    // Try to identify the currently logged-in user (if any) to link the order
    const supabaseAuth = await createClient();
    const { data: authUserData } = await supabaseAuth.auth.getUser();
    const loggedInUserId = authUserData?.user?.id || null;
    const loggedInUserEmail = authUserData?.user?.email || null;

    console.log('Logged in user:', loggedInUserId, loggedInUserEmail);

    // Helper: resolve user ID from email
    const resolveUserIdFromEmail = async (email?: string | null) => {
      if (!email) return null;
      try {
        const { data, error } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
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

    // Get payment details from Dodo
    let payment;
    try {
      payment = await getPayment(paymentId);
      console.log('Payment details:', JSON.stringify(payment, null, 2));
    } catch (e) {
      console.error('Error fetching payment:', e);
      return NextResponse.json(
        { error: 'Could not retrieve payment details' },
        { status: 400 }
      );
    }

    // Check payment status
    if (payment.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not succeeded', paymentStatus: payment.status },
        { status: 400 }
      );
    }

    // Extract metadata and customer info
    const metadata = payment.metadata || {};
    const tier = metadata.tier as TierType;
    const amount = tier ? TIER_AMOUNTS[tier] : payment.total_amount || 0;
    const payerEmail = payment.customer?.email;
    const checkoutSessionId = payment.checkout_session_id;

    console.log('Payment info:', {
      tier,
      amount,
      payerEmail,
      checkoutSessionId,
      metadataUserId: metadata.user_id,
    });

    // Priority for user linking:
    // 1. Currently logged-in user
    // 2. Metadata user_id (set during checkout)
    // 3. User resolved by payment email
    const resolvedUserIdFromEmail = await resolveUserIdFromEmail(payerEmail);
    const userId = loggedInUserId || 
      (metadata.user_id && metadata.user_id !== 'guest' ? metadata.user_id : null) || 
      resolvedUserIdFromEmail;

    console.log('Resolved userId:', userId);

    // First, check if order already exists by payment_id
    const { data: existingOrderByPayment } = await (supabase
      .from('orders') as any)
      .select('*')
      .eq('dodo_payment_id', paymentId)
      .maybeSingle();

    if (existingOrderByPayment) {
      console.log('Order already exists with payment_id:', existingOrderByPayment.id);
      
      // Update if needed (link user, add missing data)
      const needsUpdate = !existingOrderByPayment.user_id || 
        !existingOrderByPayment.payer_email ||
        !existingOrderByPayment.hall_of_fame_position;
      
      if (needsUpdate) {
        const updateData: any = {};
        
        if (!existingOrderByPayment.user_id && userId) {
          updateData.user_id = userId;
        }
        if (!existingOrderByPayment.payer_email && payerEmail) {
          updateData.payer_email = payerEmail;
        }
        if (!existingOrderByPayment.hall_of_fame_position && tier && tier !== 'bare_minimum') {
          const { data: nextPosition, error: positionError } = await (supabase as any)
            .rpc('get_next_hall_of_fame_position', { amount_cents: amount });
          if (!positionError && nextPosition) {
            updateData.hall_of_fame_position = nextPosition;
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          await (supabase.from('orders') as any)
            .update(updateData)
            .eq('id', existingOrderByPayment.id);
          console.log('Updated existing order:', updateData);
        }
      }
      
      // Refetch updated order
      const { data: updatedOrder } = await (supabase
        .from('orders') as any)
        .select('*')
        .eq('id', existingOrderByPayment.id)
        .single();

      return NextResponse.json({ 
        success: true, 
        order: updatedOrder || existingOrderByPayment,
        message: 'Order already exists' 
      });
    }

    // Check if order exists by session_id
    let existingOrder = null;
    if (checkoutSessionId) {
      const { data: existingOrderBySession } = await (supabase
        .from('orders') as any)
        .select('*')
        .eq('dodo_session_id', checkoutSessionId)
        .maybeSingle();
      
      if (existingOrderBySession) {
        existingOrder = existingOrderBySession;
        console.log('Found order by session_id:', existingOrder.id);
      }
    }

    if (existingOrder) {
      // Update the existing order with all the info
      const updateData: any = {
        dodo_payment_id: paymentId,
        status: 'completed',
        payer_email: payerEmail || existingOrder.payer_email,
        user_id: existingOrder.user_id || userId || null,
      };

      // Assign hall of fame position if not already assigned
      if (!existingOrder.hall_of_fame_position && tier && tier !== 'bare_minimum') {
        const { data: nextPosition, error: positionError } = await (supabase as any)
          .rpc('get_next_hall_of_fame_position', { amount_cents: amount });

        if (positionError) {
          console.error('Error getting next position:', positionError);
        } else if (nextPosition) {
          updateData.hall_of_fame_position = nextPosition;
          console.log('Assigned hall of fame position:', nextPosition);
        }
      }

      const { error: updateError } = await (supabase
        .from('orders') as any)
        .update(updateData)
        .eq('id', existingOrder.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('Order updated successfully:', existingOrder.id);

      // Refetch updated order
      const { data: updatedOrder } = await (supabase
        .from('orders') as any)
        .select('*')
        .eq('id', existingOrder.id)
        .single();

      return NextResponse.json({ 
        success: true, 
        order: updatedOrder,
        message: 'Order updated successfully' 
      });
    }

    // No existing order found - create a new one
    console.log('Creating new order from payment');
    const orderData: any = {
      dodo_payment_id: paymentId,
      dodo_session_id: checkoutSessionId || null,
      amount: amount,
      status: 'completed',
      payer_email: payerEmail,
      user_id: userId || null,
    };

    // Assign hall of fame position for paid tiers
    if (tier && tier !== 'bare_minimum') {
      const { data: nextPosition, error: positionError } = await (supabase as any)
        .rpc('get_next_hall_of_fame_position', { amount_cents: amount });

      if (!positionError && nextPosition) {
        orderData.hall_of_fame_position = nextPosition;
        console.log('Assigned hall of fame position:', nextPosition);
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

    console.log('Order created successfully:', newOrder.id);

    return NextResponse.json({ 
      success: true, 
      order: newOrder,
      message: 'Order created successfully' 
    });
  } catch (error: any) {
    console.error('Complete order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    );
  }
}

