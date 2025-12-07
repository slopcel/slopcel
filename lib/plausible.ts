// Flag to track initialization status
let isInitialized = false;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize Plausible tracker (only runs in browser)
export function initPlausible() {
  if (!isBrowser || isInitialized) return;
  
  // Dynamic import to avoid SSR issues
  import('@plausible-analytics/tracker').then(({ init }) => {
    init({
      domain: 'slopcel.com',
      // Uncomment below if you're using a custom endpoint
      // endpoint: 'https://your-plausible-instance.com/api/event',
      autoCapturePageviews: true,
      captureOnLocalhost: false,
    });
    
    isInitialized = true;
    console.log('Plausible analytics initialized');
  }).catch((err) => {
    console.error('Failed to initialize Plausible:', err);
  });
}

// Helper function for tracking custom events (only runs in browser)
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
) {
  if (!isBrowser) return;
  
  // Convert number/boolean values to strings for Plausible
  const stringProps: Record<string, string> | undefined = props
    ? Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key, String(value)])
      )
    : undefined;

  // Dynamic import to avoid SSR issues
  import('@plausible-analytics/tracker').then(({ track }) => {
    track(eventName, { props: stringProps });
  }).catch((err) => {
    console.error('Failed to track event:', err);
  });
}

// Common event helpers
export const PlausibleEvents = {
  // Checkout events
  checkoutStarted: (tier: string) => trackEvent('Checkout Started', { tier }),
  checkoutCompleted: (tier: string, amount: number) => 
    trackEvent('Checkout Completed', { tier, amount }),
  
  // User events
  signUp: () => trackEvent('Sign Up', {}),
  signIn: () => trackEvent('Sign In', {}),
  
  // Project events
  projectViewed: (projectName: string) => trackEvent('Project Viewed', { project: projectName }),
  
  // Hall of Fame events
  hallOfFameViewed: () => trackEvent('Hall of Fame Viewed', {}),
  
  // CTA clicks
  ctaClicked: (ctaName: string) => trackEvent('CTA Clicked', { cta: ctaName }),
};
