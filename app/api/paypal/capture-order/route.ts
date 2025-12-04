import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`capture:${ip}`, rateLimitConfigs.strict);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const captureResult = await capturePayPalOrder(orderId);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment was not completed' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const serviceClient = await createServiceRoleClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Extract payment info
    const payerEmail = captureResult.payer?.email_address;
    const customId = captureResult.purchase_units?.[0]?.custom_id;
    let metadata: { user_id?: string; tier?: string } = {};
    
    try {
      if (customId) {
        metadata = JSON.parse(customId);
      }
    } catch {
      console.error('Failed to parse custom_id');
    }

    // Get the amount from the capture
    const capturedAmount = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    const amount = capturedAmount ? Math.round(parseFloat(capturedAmount.value) * 100) : 0;

    console.log(`PayPal capture completed: Order ${orderId}, Amount: ${amount}, Email: ${payerEmail}`);

    // Check if order already exists
    const { data: existingOrder } = await (serviceClient
      .from('orders') as any)
      .select('id, user_id, status')
      .eq('paypal_order_id', orderId)
      .maybeSingle();

    let dbOrderId: string | null = existingOrder?.id || null;
    let userId: string | null = user?.id || (metadata.user_id !== 'guest' ? metadata.user_id : null) || null;

    // If no order exists, create one
    if (!existingOrder) {
      // Try to find existing user by email
      if (!userId && payerEmail) {
        const { data: usersList } = await serviceClient.auth.admin.listUsers();
        const existingUser = usersList?.users?.find(u => u.email === payerEmail);
        
        if (existingUser) {
          userId = existingUser.id;
          console.log(`Found existing user ${userId} for email ${payerEmail}`);
        }
      }

      // Always create the order - store payer_email for guest orders to link later
      const { data: newOrder, error: insertError } = await (serviceClient
        .from('orders') as any)
        .insert({
          user_id: userId || null, // Can be null for guest checkout
          paypal_order_id: orderId,
          payer_email: payerEmail || null, // Store email for later linking
          amount: amount,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating order:', insertError);
      } else {
        dbOrderId = newOrder?.id || null;
        console.log(`Created order ${dbOrderId} for ${userId ? `user ${userId}` : `guest (${payerEmail})`}`);
      }
    } else {
      userId = existingOrder.user_id || userId;
      
      // Update user_id if needed
      if (userId && !existingOrder.user_id) {
        await (serviceClient
          .from('orders') as any)
          .update({ user_id: userId })
          .eq('id', dbOrderId);
      }
    }

    // Assign hall of fame position
    let hallOfFamePosition: number | null = null;
    
    if (amount === 30000 || amount === 15000 || amount === 7500) {
      const { data: position, error: positionError } = await serviceClient
        .rpc('get_next_hall_of_fame_position', { amount_cents: amount } as any);
      
      if (!positionError && position !== null && position !== undefined) {
        hallOfFamePosition = position as number;
        console.log(`Assigned HOF position ${hallOfFamePosition}`);
      }
    }

    // Update order status
    if (dbOrderId) {
      await (serviceClient
        .from('orders') as any)
        .update({
          status: 'completed',
          hall_of_fame_position: hallOfFamePosition,
        })
        .eq('id', dbOrderId);
    }

    console.log(`Payment complete: Order ${dbOrderId}, Position: ${hallOfFamePosition || 'N/A'}`);

    return NextResponse.json({ 
      success: true,
      email: payerEmail,
      amount,
    });
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture payment' },
      { status: 500 }
    );
  }
}

