/**
 * Simple in-memory rate limiter
 * For production with multiple server instances, consider using Upstash Redis
 * 
 * NOTE: No setInterval at global scope - Cloudflare Workers don't allow it
 * Cleanup happens during rate limit checks instead
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup = 0;

// Clean up expired entries (called during rate limit checks, not at global scope)
function cleanupExpiredEntries() {
  const now = Date.now();
  // Only cleanup once per minute
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowInSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if the request is allowed
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Cleanup expired entries periodically (inside handler, not global scope)
  cleanupExpiredEntries();
  
  const now = Date.now();
  const windowMs = config.windowInSeconds * 1000;
  const key = identifier;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  if (entry.count >= config.limit) {
    // Rate limited
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(entry.resetTime / 1000),
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: Math.ceil(entry.resetTime / 1000),
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimitConfigs = {
  // Strict: 5 requests per minute (for sensitive operations like checkout)
  strict: { limit: 5, windowInSeconds: 60 },
  // Standard: 30 requests per minute (for general API calls)
  standard: { limit: 30, windowInSeconds: 60 },
  // Relaxed: 100 requests per minute (for read-heavy endpoints)
  relaxed: { limit: 100, windowInSeconds: 60 },
};
