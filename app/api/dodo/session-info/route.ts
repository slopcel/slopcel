import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSessionStatus, getPayment } from '@/lib/dodo';
import { rateLimit, getClientIP, rateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Rate limit: 30 requests per minute
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`session-info:${ip}`, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get checkout session status
    const session = await getCheckoutSessionStatus(sessionId);
    
    // If there's a payment ID, get payment details
    let paymentDetails = null;
    if (session.payment_id) {
      try {
        paymentDetails = await getPayment(session.payment_id);
      } catch (e) {
        console.error('Error fetching payment details:', e);
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.payment_status,
      paymentId: session.payment_id,
      customerEmail: session.customer_email,
      customerName: session.customer_name,
      createdAt: session.created_at,
      paymentDetails,
    });
  } catch (error: any) {
    console.error('Dodo session info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get session info' },
      { status: 500 }
    );
  }
}

