'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type TextSize = 'normal' | 'large' | 'xlarge';

export interface AccessibilitySettingsState {
  highContrast: boolean;
  textSize: TextSize;
  reduceMotion: boolean;
  focusVisible: boolean;
  dyslexicFont: boolean;
  navPad: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettingsState;
  setSettings: React.Dispatch<React.SetStateAction<AccessibilitySettingsState>>;
}

const defaultSettings: AccessibilitySettingsState = {
  highContrast: false,
  textSize: 'normal',
  reduceMotion: false,
  focusVisible: true,
  dyslexicFont: false,
  navPad: false,
};

const STORAGE_KEY = 'a11y:settings';

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Reflect settings via data attributes on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-a11y-contrast', settings.highContrast ? 'high' : 'normal');
    root.setAttribute('data-a11y-text', settings.textSize);
    root.setAttribute('data-a11y-motion', settings.reduceMotion ? 'reduced' : 'normal');
    root.setAttribute('data-a11y-focus', settings.focusVisible ? 'always' : 'auto');
    root.setAttribute('data-a11y-font', settings.dyslexicFont ? 'dyslexic' : 'default');
  }, [settings]);

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}