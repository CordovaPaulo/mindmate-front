// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'MindMates - Peer Tutoring Platform',
  description: 'Connect with peer tutors at your institution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </head>
      <body suppressHydrationWarning /* optional: disable Grammarly */ data-gramm="false">
        {/* Skip link for keyboard users */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {/* Ensure a single main landmark exists */}
        <main id="main-content" role="main">
          {/* Providers should already wrap within layout or pages */}
          <Providers>
            {children}
          </Providers>
          <ToastContainer />
        </main>
        <ChatbotWidget />
      </body>
    </html>
  );
}