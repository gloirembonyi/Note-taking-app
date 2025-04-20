import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that allows all requests in development
export function middleware(request: NextRequest) {
  // In development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: bypassing authentication');
    return NextResponse.next();
  }

  // In production, implement the auth check here if needed
  // For now, just allow all requests in production too
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)'],
}; 