// Dodo Payments helper functions
// NOTE: We use dynamic import to avoid Cloudflare Workers "global scope" errors
// The SDK must not be imported at module level as it does async operations on load

// Tier amounts in cents (static data, safe at module level)
export const TIER_AMOUNTS = {
  premium: 30000, // $300
  standard: 15000, // $150
  hall_of_fame: 7500, // $75
  bare_minimum: 5000, // $50
};

export type TierType = 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum';

// Get product IDs from environment (called inside handlers, not at module scope)
export function getProductIds() {
  return {
    premium: process.env.DODO_PRODUCT_PREMIUM || '',
    standard: process.env.DODO_PRODUCT_STANDARD || '',
    hall_of_fame: process.env.DODO_PRODUCT_HALL_OF_FAME || '',
    bare_minimum: process.env.DODO_PRODUCT_BARE_MINIMUM || '',
  };
}

// For backwards compatibility
export const DODO_PRODUCT_IDS = {
  get premium() { return process.env.DODO_PRODUCT_PREMIUM || ''; },
  get standard() { return process.env.DODO_PRODUCT_STANDARD || ''; },
  get hall_of_fame() { return process.env.DODO_PRODUCT_HALL_OF_FAME || ''; },
  get bare_minimum() { return process.env.DODO_PRODUCT_BARE_MINIMUM || ''; },
};

// Create Dodo Payments client - uses dynamic import to avoid global scope issues
// Uses DODO_PAYMENTS_API_KEY environment variable by default
export async function getDodoClient() {
  // Dynamic import - only loads the SDK when this function is called inside a handler
  const { default: DodoPayments } = await import('dodopayments');
  
  const isTestMode = process.env.DODO_PAYMENTS_MODE !== 'live';
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  
  console.log('Dodo client config:', {
    mode: isTestMode ? 'test_mode' : 'live_mode',
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
    DODO_PAYMENTS_MODE: process.env.DODO_PAYMENTS_MODE || 'not set (defaults to test)',
  });
  
  if (!apiKey) {
    throw new Error('DODO_PAYMENTS_API_KEY is not configured');
  }
  
  return new DodoPayments({
    bearerToken: apiKey,
    // webhookKey must be undefined (not null) if not set
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || undefined,
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
  
  const productIds = getProductIds();
  const productId = productIds[tier];
  
  if (!productId) {
    throw new Error(`Product ID not configured for tier: ${tier}. Please set DODO_PRODUCT_${tier.toUpperCase()} in your environment variables.`);
  }

  const client = await getDodoClient();
  
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
  const client = await getDodoClient();
  return client.checkoutSessions.retrieve(sessionId);
}

export async function getPayment(paymentId: string) {
  const client = await getDodoClient();
  return client.payments.retrieve(paymentId);
}

// Verify and parse webhook payload
// Returns the parsed webhook event if valid, throws if invalid
export async function verifyAndParseWebhook(
  payload: string,
  headers: Record<string, string>,
  webhookKey?: string
) {
  const client = await getDodoClient();
  
  // The SDK uses standardwebhooks to verify the signature
  return client.webhooks.unwrap(payload, {
    headers,
    key: webhookKey,
  });
}

// Unsafe version that skips signature verification (use only in development)
export async function parseWebhookUnsafe(payload: string) {
  const client = await getDodoClient();
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

