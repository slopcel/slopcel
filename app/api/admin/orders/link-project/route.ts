import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute for admin actions
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`admin-link:${ip}`, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // First, verify the user is authenticated and is admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email !== adminEmail) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { orderId, projectId } = body;

    if (!orderId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId and projectId' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS and update the order
    const serviceClient = await createServiceRoleClient();
    const { data, error } = await serviceClient
      .from('orders')
      .update({ project_id: projectId })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error linking project to order:', error);
      return NextResponse.json(
        { error: 'Failed to link project to order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error('Error in link-project route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

