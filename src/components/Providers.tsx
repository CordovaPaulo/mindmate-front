'use client';
import React from 'react';
// import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import AccessibilitySettings from '@/components/AccessibilitySettings';
import RouteAnnouncer from '@/components/RouteAnnouncer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // <AuthProvider>
      <AccessibilityProvider>
        {/* Screen-reader announcements for route changes */}
        <RouteAnnouncer />
        {children}
        {/* Floating accessibility button + settings dialog */}
        {/* <AccessibilitySettings /> */}
      </AccessibilityProvider>
    // </AuthProvider>
  );
}