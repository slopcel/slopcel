import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAndParseWebhook, parseWebhookUnsafe, TIER_AMOUNTS, TierType } from '@/lib/dodo';

// Note: Edge runtime might have issues with webhook verification
// If webhook verification fails, we'll use unsafe parsing in development
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const headers: Record<string, string> = {};
    
    // Collect all headers
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    console.log('Webhook received - Headers:', Object.keys(headers));
    console.log('Webhook received - Payload length:', payload.length);

    let event;
    
    // Try to verify signature, fall back to unsafe parsing in dev
    try {
      event = await verifyAndParseWebhook(payload, headers);
      console.log('Webhook signature verified successfully');
    } catch (signatureError) {
      console.warn('Webhook signature verification failed:', signatureError);
      
      // In development, allow unsigned webhooks
      if (process.env.NODE_ENV === 'development' || !process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
        console.warn('Using unsafe webhook parsing (dev mode or no webhook key)');
        event = await parseWebhookUnsafe(payload);
      } else {
        console.error('Webhook signature verification failed in production');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    console.log('Received Dodo webhook event:', event.type);
    console.log('Event data:', JSON.stringify(event, null, 2));

    const supabase = await createServiceRoleClient();

    // Helper: resolve user ID from email (case-insensitive)
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

    switch (event.type) {
      case 'payment.succeeded': {
        const payment = event.data;
        console.log('Payment data:', JSON.stringify(payment, null, 2));
        
        const metadata = payment.metadata || {};
        const userIdFromMetadata = metadata.user_id;
        const tier = metadata.tier as TierType;
        const emailFromPayment = payment.customer?.email;
        // checkout_session_id is available on Payment type
        const checkoutSessionId = payment.checkout_session_id;
        
        console.log('User resolution inputs:', {
          userIdFromMetadata,
          emailFromPayment,
          checkoutSessionId,
        });
        const resolvedUserId = userIdFromMetadata && userIdFromMetadata !== 'guest'
          ? userIdFromMetadata
          : await resolveUserIdFromEmail(emailFromPayment);
        
        // Get the amount from tier (or from payment if available)
        // payment.total_amount is in cents
        const amount = tier ? TIER_AMOUNTS[tier] : (payment.total_amount || 0);
        
        console.log('Processing payment:', {
          payment_id: payment.payment_id,
          checkout_session_id: checkoutSessionId,
          userIdFromMetadata,
          resolvedUserId,
          tier,
          amount,
          email: payment.customer?.email,
        });
        
        // First, try to find existing order by payment_id
        const { data: existingOrderByPayment } = await (supabase
          .from('orders') as any)
          .select('*')
          .eq('dodo_payment_id', payment.payment_id)
          .maybeSingle();

        // Also try to find by session_id from the payment's checkout_session_id
        let existingOrder: any = existingOrderByPayment;
        
        if (!existingOrder && checkoutSessionId) {
          console.log('Looking up order by checkout_session_id:', checkoutSessionId);
          const { data: existingOrderBySession } = await (supabase
            .from('orders') as any)
            .select('*')
            .eq('dodo_session_id', checkoutSessionId)
            .maybeSingle();
          
          if (existingOrderBySession) {
            existingOrder = existingOrderBySession;
            console.log('Found existing order by session_id:', existingOrderBySession.id);
          }
        }

        if (existingOrder?.id) {
          // Update existing order to completed
          console.log('Updating existing order:', existingOrder.id);
          
          // Build update data - only update hall_of_fame_position if not already set
          const updateData: any = {
            dodo_payment_id: payment.payment_id,
            status: 'completed',
            payer_email: payment.customer?.email || existingOrder.payer_email || null,
            // Link the order to the user if we have a valid userId and it's not already set
            user_id: existingOrder.user_id || resolvedUserId || null,
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
          } else {
            console.log('Order updated successfully');
          }
        } else {
          // Create new order for guest checkout or if order wasn't pre-created
          console.log('Creating new order (no existing order found)');
          const orderData: any = {
            dodo_payment_id: payment.payment_id,
            dodo_session_id: checkoutSessionId || null,
            amount: amount,
            status: 'completed',
            payer_email: payment.customer?.email,
            user_id: resolvedUserId || null,
          };

          // Assign hall of fame position for paid tiers
          if (tier && tier !== 'bare_minimum') {
            // Get the next available position for this tier
            const { data: nextPosition, error: positionError } = await (supabase as any)
              .rpc('get_next_hall_of_fame_position', { amount_cents: amount });

            if (positionError) {
              console.error('Error getting next position:', positionError);
            } else if (nextPosition) {
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
          } else {
            console.log('Order created successfully:', newOrder.id);
          }
        }

        break;
      }

      case 'payment.failed': {
        const payment = event.data;
        
        // Update order status to failed
        await (supabase
          .from('orders') as any)
          .update({ status: 'failed' })
          .eq('dodo_payment_id', payment.payment_id);

        break;
      }

      case 'payment.cancelled': {
        const payment = event.data;
        
        // Update order status to failed (cancelled)
        await (supabase
          .from('orders') as any)
          .update({ status: 'failed' })
          .eq('dodo_payment_id', payment.payment_id);

        break;
      }

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

