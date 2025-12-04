import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;


export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = await createServiceRoleClient();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email || session.customer_details?.email;
      const existingUserId = session.metadata?.user_id;
      
      console.log(`Processing checkout.session.completed for session ${session.id}`);
      console.log(`Customer email: ${customerEmail}, Existing user ID: ${existingUserId}`);
      
      // Get order amount from session
      let amount = 0;
      
      // Retrieve full session to get line items and amount
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
      });
      
      if (fullSession.amount_total) {
        amount = fullSession.amount_total;
      } else if (session.metadata?.amount) {
        amount = parseInt(session.metadata.amount);
      }
      
      console.log(`Order amount: ${amount}`);
      
      // Ensure we have an amount
      if (!amount || amount <= 0) {
        console.error(`Invalid amount for session ${session.id}: ${amount}`);
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      }
      
      // Check if order already exists (created during checkout for logged-in users)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, amount, user_id, status')
        .eq('stripe_session_id', session.id)
        .maybeSingle();
      
      console.log(`Existing order: ${existingOrder ? JSON.stringify(existingOrder) : 'none'}`);
      
      let orderId: string | null = existingOrder ? (existingOrder as any).id : null;
      let userId: string | null = existingUserId && existingUserId !== 'guest' ? existingUserId : null;
      
      // If order doesn't exist, we need to create it
      // This happens for guest checkout - the user will link it when they sign up
      if (!existingOrder) {
        // Try to find or create user
        if (!userId && customerEmail) {
          // Check if user exists with this email
          const { data: usersList } = await supabase.auth.admin.listUsers();
          const existingUser = usersList?.users?.find(u => u.email === customerEmail);
          
          if (existingUser) {
            userId = existingUser.id;
            console.log(`Found existing user ${userId} for email ${customerEmail}`);
          } else {
            // Create a placeholder user account - they'll set password when signing up
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
            
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: customerEmail,
              password: randomPassword,
              email_confirm: true,
            });
            
            if (createError) {
              console.error('Error creating user account:', createError);
              // Don't fail - user can sign up later and orders will be linked
            } else if (newUser?.user) {
              userId = newUser.user.id;
              console.log(`Created new user ${userId} for email ${customerEmail}`);
            }
          }
        }
        
        // Create the order if we have a user ID
        if (userId) {
          const { data: newOrder, error: insertError } = await supabase
            .from('orders')
            .insert({
              user_id: userId,
              stripe_session_id: session.id,
              amount: amount,
              status: 'pending',
            })
            .select('id')
            .single();
          
          if (insertError) {
            console.error('Error creating order:', insertError);
            // Don't return error - order can be created later when user signs up
          } else {
            orderId = newOrder?.id || null;
            console.log(`Created order ${orderId} for user ${userId}`);
          }
        } else {
          console.log(`No user ID available for session ${session.id} - order will be created when user signs up`);
          // Store session info for later linking (we'll return success so Stripe knows we processed it)
        }
      } else {
        // Order exists, make sure it has the correct user_id
        userId = (existingOrder as any).user_id || userId;
        
        // Update user_id if we have one and the order doesn't
        if (userId && !(existingOrder as any).user_id) {
          await supabase
            .from('orders')
            .update({ user_id: userId })
            .eq('id', orderId);
        }
      }
      
      // Assign hall of fame position based on amount
      let hallOfFamePosition: number | null = null;
      
      // Only assign position for hall of fame tiers ($300, $150, $75)
      if (amount === 30000 || amount === 15000 || amount === 7500) {
        const { data: position, error: positionError } = await supabase
          .rpc('get_next_hall_of_fame_position', { amount_cents: amount } as any);
        
        if (positionError) {
          console.error('Error getting position:', positionError);
        } else if (position !== null && position !== undefined) {
          hallOfFamePosition = position as number;
          console.log(`Assigned HOF position ${hallOfFamePosition}`);
        }
      }
      
      // Update order status and position if we have an order
      if (orderId) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            hall_of_fame_position: hallOfFamePosition,
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
        } else {
          console.log(`Updated order ${orderId}: status=completed, position=${hallOfFamePosition || 'N/A'}`);
        }
      }
      
      console.log(`Payment successful for session: ${session.id}, User: ${userId || 'N/A'}, Order: ${orderId || 'pending'}, Position: ${hallOfFamePosition || 'N/A'}`);
      break;
    }

    case 'checkout.session.async_payment_failed':
    case 'payment_intent.payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Update order status to failed
      const { error: updateError } = await (supabase
        .from('orders') as any)
        .update({
          status: 'failed',
        })
        .eq('stripe_session_id', session.id);

      if (updateError) {
        console.error('Error updating order status to failed:', updateError);
      } else {
        console.log('Payment failed for session:', session.id);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

