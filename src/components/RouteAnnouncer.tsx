'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function RouteAnnouncer() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const page = document.title || pathname || 'Page loaded';
    ref.current.textContent = page;
  }, [pathname]);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}