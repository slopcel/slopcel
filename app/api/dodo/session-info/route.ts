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
    
    console.log('Session info response:', JSON.stringify(session, null, 2));
    
    // If there's a payment ID, get payment details
    let paymentDetails = null;
    if (session.payment_id) {
      try {
        paymentDetails = await getPayment(session.payment_id);
      } catch (e) {
        console.error('Error fetching payment details:', e);
      }
    }

    // Map payment_status to a simpler status for the frontend
    // CheckoutSessionStatus.payment_status uses IntentStatus enum
    const paymentStatus = session.payment_status;
    let status: string;
    
    // Normalize status for frontend
    if (paymentStatus === 'succeeded') {
      status = 'succeeded';
    } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      status = paymentStatus;
    } else if (paymentStatus === 'processing' || paymentStatus === 'requires_capture') {
      status = 'processing';
    } else if (paymentStatus === null || paymentStatus === undefined) {
      // No payment yet - session is still collecting details
      status = 'pending';
    } else {
      status = paymentStatus;
    }

    return NextResponse.json({
      sessionId: session.id,
      status: status,
      paymentStatus: session.payment_status, // Raw status for debugging
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

