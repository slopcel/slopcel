import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

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

    // 2. Link guest orders by payer_email (orders without user_id)
    // Use ilike for case-insensitive email matching
    const { data: guestOrders, error: guestError } = await (serviceClient
      .from('orders') as any)
      .update({ user_id: user.id })
      .ilike('payer_email', user.email)
      .is('user_id', null)
      .select();

    if (!guestError && guestOrders && guestOrders.length > 0) {
      linkedCount += guestOrders.length;
      console.log(`Linked ${guestOrders.length} guest orders for user ${user.id} (${user.email})`);
    }
    
    if (linkedCount > 0) {
      console.log(`Total linked: ${linkedCount} orders for user ${user.id} (${user.email})`);
    }

    return NextResponse.json({ 
      linked: linkedCount,
      message: linkedCount > 0 
        ? `Successfully linked ${linkedCount} order(s) to your account!` 
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
