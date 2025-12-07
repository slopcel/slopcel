'use client';

import { useEffect } from 'react';

export default function PlausibleProvider() {
  useEffect(() => {
    // Dynamically import to ensure it only runs on client
    import('@/lib/plausible').then(() => {
      console.log('Plausible analytics initialized');
    });
  }, []);

  return null;
}

