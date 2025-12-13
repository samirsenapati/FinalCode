import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Ensure every response includes the COOP/COEP headers WebContainers require.
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return response;
}

export const config = {
  matcher: '/:path*',
};
