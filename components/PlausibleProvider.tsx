'use client';

import { useEffect } from 'react';
import { initPlausible } from '@/lib/plausible';

export default function PlausibleProvider() {
  useEffect(() => {
    initPlausible();
  }, []);

  return null;
}

