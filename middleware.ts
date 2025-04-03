import { clerkMiddleware } from '@clerk/nextjs/server';

// Use the clerkMiddleware to protect routes
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
}; 