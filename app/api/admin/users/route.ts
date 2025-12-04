import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limit: 30 requests per minute for admin actions
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`admin-users:${ip}`, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // Verify admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role to access auth.users
    const serviceClient = await createServiceRoleClient();
    
    // Get all users from auth
    const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get order counts per user
    const { data: ordersData } = await serviceClient
      .from('orders')
      .select('user_id');

    const orderCounts = ordersData?.reduce((acc, order) => {
      if (order.user_id) {
        acc[order.user_id] = (acc[order.user_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Get profiles for users
    const userIds = authUsers.users.map(u => u.id);
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    const profilesMap = profiles?.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>) || {};

    // Combine the data
    const users = authUsers.users.map(u => ({
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      order_count: orderCounts[u.id] || 0,
      profile: profilesMap[u.id] || null,
    }));

    // Sort by created_at descending
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

