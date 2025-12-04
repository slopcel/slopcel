import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    // Use service role client to fetch user info
    const serviceClient = await createServiceRoleClient();
    const { data: userData, error } = await serviceClient.auth.admin.getUserById(userId);

    if (error || !userData?.user) {
      return NextResponse.json({ email: null });
    }

    return NextResponse.json({ email: userData.user.email });
  } catch (error) {
    console.error('Error fetching user email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

