import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Cannot use '@/config/env' if it relies on process.cwd() or Node.js only APIs, but jose works in edge.
// We'll read directly from process.env for edge safety.
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || '');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/onboarding', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(accessToken, ACCESS_SECRET);
      return NextResponse.next();
    } catch (error) {
      // Token is invalid or expired. The client should hit /api/auth/refresh and retry,
      // but if they hit a page directly, we redirect to login (or an interstitial refresh page).
      return NextResponse.redirect(new URL('/login?session_expired=true', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/onboarding/:path*', '/dashboard/:path*'],
};
