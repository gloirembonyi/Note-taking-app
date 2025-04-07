// This file is usually named next.config.js

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   appDir: true,
  // },
  env: {
    GOOGLE_GENERATIVE_AI_KEY: process.env.GOOGLE_GENERATIVE_AI_KEY,
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    NEXT_PUBLIC_DEEPGRAM_API_KEY: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*', // Normally you would redirect to a different destination
      },
    ];
  },
}

export default nextConfig;
