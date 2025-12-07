import Plausible from '@plausible-analytics/tracker';

// Initialize Plausible tracker
// Replace 'slopcel.com' with your actual domain if different
const plausible = Plausible({
  domain: 'slopcel.com',
  // Uncomment below if you're using a self-hosted Plausible instance
  // apiHost: 'https://your-plausible-instance.com',
});

// Enable automatic page view tracking
plausible.enableAutoPageviews();

// Export for custom event tracking
export { plausible };

// Helper function for tracking custom events
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
) {
  plausible.trackEvent(eventName, { props });
}

// Common event helpers
export const PlausibleEvents = {
  // Checkout events
  checkoutStarted: (tier: string) => trackEvent('Checkout Started', { tier }),
  checkoutCompleted: (tier: string, amount: number) => 
    trackEvent('Checkout Completed', { tier, amount }),
  
  // User events
  signUp: () => trackEvent('Sign Up'),
  signIn: () => trackEvent('Sign In'),
  
  // Project events
  projectViewed: (projectName: string) => trackEvent('Project Viewed', { project: projectName }),
  
  // Hall of Fame events
  hallOfFameViewed: () => trackEvent('Hall of Fame Viewed'),
  
  // CTA clicks
  ctaClicked: (ctaName: string) => trackEvent('CTA Clicked', { cta: ctaName }),
};

