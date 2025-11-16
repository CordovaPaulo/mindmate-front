'use client';

import { useEffect } from 'react';

export default function BotpressInit() {
  useEffect(() => {
    // Function to get auth token from cookies
    const getAuthToken = () => {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      return tokenCookie ? tokenCookie.split('=')[1] : null;
    };

    // Wait for Botpress to load, then configure it with auth token
    const initBotpress = () => {
      if (typeof window !== 'undefined' && (window as any).botpressWebChat) {
        const token = getAuthToken();
        
        if (token) {
          // Store the token in Botpress user data
          (window as any).botpressWebChat.sendEvent({
            type: 'proactiveMessage',
            payload: {
              authToken: token
            }
          });

          // Also set it in the user data
          (window as any).botpressWebChat.configure({
            userData: {
              authToken: token
            }
          });
        }
      }
    };

    // Try to initialize after a short delay to ensure Botpress is loaded
    const timer = setTimeout(initBotpress, 1000);

    // Also listen for when webchat is ready
    if (typeof window !== 'undefined') {
      (window as any).addEventListener('webchatReady', initBotpress);
    }

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        (window as any).removeEventListener('webchatReady', initBotpress);
      }
    };
  }, []);

  return null;
}
