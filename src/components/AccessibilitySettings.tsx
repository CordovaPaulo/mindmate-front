'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function AccessibilitySettings() {
  const { settings, setSettings } = useAccessibility();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl+Alt+A toggles panel
      if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setOpen((s) => !s);
      }
      // Ctrl+= increase text; Ctrl+- decrease text
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setSettings((prev) => ({
          ...prev,
          textSize: prev.textSize === 'normal' ? 'large' : 'xlarge',
        }));
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setSettings((prev) => ({
          ...prev,
          textSize: prev.textSize === 'xlarge' ? 'large' : 'normal',
        }));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setSettings]);

  // Close on Escape, focus management
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const toggle = (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((prev) => ({ ...prev, [key]: e.target.checked }));

  const setText = (size: typeof settings.textSize) =>
    setSettings((prev) => ({ ...prev, textSize: size }));

  return (
    <>
      <button
        className="a11y-fab"
        aria-label="Open accessibility settings"
        onClick={() => setOpen(true)}
        title="Accessibility settings (Ctrl+Alt+A)"
      >
        ♿
      </button>

      {open && (
        <div
          className="a11y-modal-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="a11y-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onClick={(e) => e.stopPropagation()}
            ref={dialogRef}
          >
            <div className="a11y-modal-header">
              <h2 id={titleId}>Accessibility settings</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close accessibility settings"
              >
                ×
              </button>
            </div>
            <p id={descId} className="a11y-modal-desc">
              Customize contrast, text size, motion, focus outlines, and font.
            </p>

            <div className="a11y-controls">
              <fieldset>
                <legend>Contrast</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.highContrast}
                    onChange={toggle('highContrast')}
                  />
                  High contrast
                </label>
              </fieldset>

              <fieldset>
                <legend>Text size</legend>
                <div className="a11y-textsize-group" role="group" aria-label="Text size">
                  <button
                    className={settings.textSize === 'normal' ? 'selected' : ''}
                    onClick={() => setText('normal')}
                    aria-pressed={settings.textSize === 'normal'}
                  >
                    Normal
                  </button>
                  <button
                    className={settings.textSize === 'large' ? 'selected' : ''}
                    onClick={() => setText('large')}
                    aria-pressed={settings.textSize === 'large'}
                  >
                    Large
                  </button>
                  <button
                    className={settings.textSize === 'xlarge' ? 'selected' : ''}
                    onClick={() => setText('xlarge')}
                    aria-pressed={settings.textSize === 'xlarge'}
                  >
                    X-Large
                  </button>
                </div>
              </fieldset>

              <fieldset>
                <legend>Motion and focus</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={toggle('reduceMotion')}
                  />
                  Reduce motion
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.focusVisible}
                    onChange={toggle('focusVisible')}
                  />
                  Always show focus outline
                </label>
              </fieldset>

              <fieldset>
                <legend>Font and navigation aid</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.dyslexicFont}
                    onChange={toggle('dyslexicFont')}
                  />
                  Dyslexia-friendly font
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.navPad}
                    onChange={toggle('navPad')}
                  />
                  Show navigation pad
                </label>
              </fieldset>
            </div>
          </div>
        </div>
      )}
    </>
  );
}