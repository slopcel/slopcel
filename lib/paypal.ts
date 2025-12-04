// PayPal API helper functions

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  // Use btoa for Edge runtime compatibility (Buffer is not available)
  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal auth error:', error);
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export interface PayPalOrderRequest {
  amount: number; // in cents
  tierName: string;
  tierDescription: string;
  userId?: string;
  tier: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export async function createPayPalOrder(request: PayPalOrderRequest): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken();
  const amountInDollars = (request.amount / 100).toFixed(2);

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amountInDollars,
        },
        description: request.tierDescription,
        custom_id: JSON.stringify({
          user_id: request.userId || 'guest',
          tier: request.tier,
        }),
      }],
      application_context: {
        brand_name: 'Slopcel',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal create order error:', error);
    throw new Error('Failed to create PayPal order');
  }

  return response.json();
}

export interface PayPalCaptureResult {
  id: string;
  status: string;
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
    custom_id?: string;
  }>;
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal capture error:', error);
    throw new Error('Failed to capture PayPal order');
  }

  return response.json();
}

export async function getPayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal get order error:', error);
    throw new Error('Failed to get PayPal order');
  }

  return response.json();
}

export function getPayPalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID || '';
}

