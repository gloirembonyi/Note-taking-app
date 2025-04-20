"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect } from "react";

// Environment variable debug component
function EnvironmentDebug() {
  if (process.env.NODE_ENV !== "development") return null;

  // Log environment variables to console for debugging in development
  useEffect(() => {
    console.log(
      "NEXT_PUBLIC_LIVEKIT_URL:",
      process.env.NEXT_PUBLIC_LIVEKIT_URL
    );
    console.log(
      "GOOGLE_GENERATIVE_AI_KEY status:",
      process.env.GOOGLE_GENERATIVE_AI_KEY ? "Set" : "Not set"
    );
    console.log(
      "NEXT_PUBLIC_DEEPGRAM_API_KEY status:",
      process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ? "Set" : "Not set"
    );
    console.log(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY status:",
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Set" : "Not set"
    );
    console.log(
      "NEXT_PUBLIC_CLERK_DEVELOPMENT_DOMAIN status:",
      process.env.NEXT_PUBLIC_CLERK_DEVELOPMENT_DOMAIN ? "Set" : "Not set"
    );
  }, []);

  return null;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <EnvironmentDebug />
      {children}
    </ClerkProvider>
  );
}
