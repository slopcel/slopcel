import { init, track } from '@plausible-analytics/tracker';

// Flag to track initialization status
let isInitialized = false;

// Initialize Plausible tracker
export function initPlausible() {
  if (isInitialized) return;
  
  init({
    domain: 'slopcel.com',
    // Uncomment below if you're using a custom endpoint
    // endpoint: 'https://your-plausible-instance.com/api/event',
    autoCapturePageviews: true,
    captureOnLocalhost: false,
  });
  
  isInitialized = true;
  console.log('Plausible analytics initialized');
}

// Helper function for tracking custom events
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
) {
  // Convert number/boolean values to strings for Plausible
  const stringProps: Record<string, string> | undefined = props
    ? Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key, String(value)])
      )
    : undefined;

  track(eventName, { props: stringProps });
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
