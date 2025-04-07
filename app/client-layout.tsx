'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useEffect } from 'react';

// Environment variable debug component
function EnvironmentDebug() {
  if (process.env.NODE_ENV !== 'development') return null;
  
  // Log environment variables to console for debugging in development
  useEffect(() => {
    console.log('NEXT_PUBLIC_LIVEKIT_URL:', process.env.NEXT_PUBLIC_LIVEKIT_URL);
    console.log('GOOGLE_GENERATIVE_AI_KEY status:', process.env.GOOGLE_GENERATIVE_AI_KEY ? 'Set' : 'Not set');
    console.log('NEXT_PUBLIC_DEEPGRAM_API_KEY status:', process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ? 'Set' : 'Not set');
  }, []);
  
  return null;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <EnvironmentDebug />
      {children}
    </ClerkProvider>
  );
} 