import { NextRequest, NextResponse } from 'next/server';
import { getPayPalOrder } from '@/lib/paypal';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await getPayPalOrder(orderId);
    
    // Get email from payer info
    const email = order.payer?.email_address || null;
    
    // Get amount from purchase units
    const amountStr = order.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const amount = amountStr ? Math.round(parseFloat(amountStr) * 100) : null;

    return NextResponse.json({
      email,
      status: order.status,
      amount,
    });
  } catch (error: any) {
    console.error('Error retrieving PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order info' },
      { status: 500 }
    );
  }
}

