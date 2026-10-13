import { NextResponse } from 'next/server';

// A Server Component notFound() may be streamed with HTTP 200. The lab must
// return a real 404 before rendering in every non-local profile.
export function proxy() {
  if (process.env.NODE_ENV === 'production' || process.env.JDQ_ECONOMY_LAB !== 'true' ||
      process.env.API_PROXY_TARGET !== 'http://127.0.0.1:4300') {
    return new Response('Not found', { status: 404, headers: {
      'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
    } });
  }
  return NextResponse.next();
}

export const config = { matcher: '/economy-lab/:path*' };
