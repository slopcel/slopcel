// Dodo Payments helper functions
import DodoPayments from 'dodopayments';

// Product IDs from Dodo Payments dashboard
// You need to create these products in your Dodo dashboard first
export const DODO_PRODUCT_IDS = {
  premium: process.env.DODO_PRODUCT_PREMIUM || '', // $300 - Position #1
  standard: process.env.DODO_PRODUCT_STANDARD || '', // $150 - Positions 2-10
  hall_of_fame: process.env.DODO_PRODUCT_HALL_OF_FAME || '', // $75 - Positions 11-100
  bare_minimum: process.env.DODO_PRODUCT_BARE_MINIMUM || '', // $50 - No Hall of Fame
};

// Tier amounts in cents
export const TIER_AMOUNTS = {
  premium: 30000, // $300
  standard: 15000, // $150
  hall_of_fame: 7500, // $75
  bare_minimum: 5000, // $50
};

export type TierType = 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum';

// Create Dodo Payments client
// Uses DODO_PAYMENTS_API_KEY environment variable by default
export function getDodoClient() {
  const isTestMode = process.env.DODO_PAYMENTS_MODE !== 'live';
  
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || null,
    environment: isTestMode ? 'test_mode' : 'live_mode',
  });
}

export interface CreateCheckoutParams {
  tier: TierType;
  userId?: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  sessionId: string;
  checkoutUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const { tier, userId, returnUrl, metadata = {} } = params;
  
  const productId = DODO_PRODUCT_IDS[tier];
  
  if (!productId) {
    throw new Error(`Product ID not configured for tier: ${tier}. Please set DODO_PRODUCT_${tier.toUpperCase()} in your environment variables.`);
  }

  const client = getDodoClient();
  
  // Build metadata with all required fields
  const sessionMetadata: Record<string, string> = {
    user_id: userId || 'guest',
    tier: tier,
    ...metadata,
  };

  console.log('Creating checkout session:', {
    tier,
    productId,
    userId: userId || 'guest',
    returnUrl,
  });
  
  let response;
  try {
    response = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: returnUrl,
      metadata: sessionMetadata,
      customization: {
        theme: 'dark',
      },
    });
  } catch (err: any) {
    console.error('Dodo checkoutSessions.create error:', err);
    // Re-throw a clean error message for the API layer
    const message = err?.message || 'Failed to create Dodo checkout session';
    const code = err?.code || err?.name || 'DODO_CHECKOUT_ERROR';
    const details = typeof err === 'string' ? err : JSON.stringify(err, null, 2);
    throw new Error(`${code}: ${message} ${details}`);
  }

  console.log('Checkout session created:', {
    sessionId: response.session_id,
    checkoutUrl: response.checkout_url,
  });

  return {
    sessionId: response.session_id,
    checkoutUrl: response.checkout_url,
  };
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const client = getDodoClient();
  return client.checkoutSessions.retrieve(sessionId);
}

export async function getPayment(paymentId: string) {
  const client = getDodoClient();
  return client.payments.retrieve(paymentId);
}

// Verify and parse webhook payload
// Returns the parsed webhook event if valid, throws if invalid
export function verifyAndParseWebhook(
  payload: string,
  headers: Record<string, string>,
  webhookKey?: string
) {
  const client = getDodoClient();
  
  // The SDK uses standardwebhooks to verify the signature
  return client.webhooks.unwrap(payload, {
    headers,
    key: webhookKey,
  });
}

// Unsafe version that skips signature verification (use only in development)
export function parseWebhookUnsafe(payload: string) {
  const client = getDodoClient();
  return client.webhooks.unsafeUnwrap(payload);
}

// Get tier info
export function getTierInfo(tier: TierType) {
  const info = {
    premium: {
      name: 'Premium Hall of Famer',
      description: '1 app deployment with #1 Hall of Fame placement',
      amount: TIER_AMOUNTS.premium,
    },
    standard: {
      name: 'Standard Hall of Famer',
      description: '1 app deployment with Hall of Fame placement (positions 2-10)',
      amount: TIER_AMOUNTS.standard,
    },
    hall_of_fame: {
      name: 'Hall of Famer',
      description: '1 app deployment with Hall of Fame placement (positions 11-100)',
      amount: TIER_AMOUNTS.hall_of_fame,
    },
    bare_minimum: {
      name: 'The Bare Minimum',
      description: '1 app deployment',
      amount: TIER_AMOUNTS.bare_minimum,
    },
  };
  
  return info[tier];
}

