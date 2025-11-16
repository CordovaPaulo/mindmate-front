'use client';

import { useEffect } from 'react';

export default function BotpressChat() {
  useEffect(() => {
    // Create and inject the Botpress webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v2/inject.js';
    script.async = true;
    document.body.appendChild(script);

    // Create and inject the configuration script
    const configScript = document.createElement('script');
    configScript.src = `https://files.bpcontent.cloud/2024/11/17/18/20241117181906-103B0783-0914-498A-AD3E-57EB419E0C04.js`;
    configScript.async = true;
    
    script.onload = () => {
      // Add config script after main script loads
      document.body.appendChild(configScript);
    };

    return () => {
      // Cleanup scripts on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (configScript.parentNode) {
        configScript.parentNode.removeChild(configScript);
      }
    };
  }, []);

  return null;
}
