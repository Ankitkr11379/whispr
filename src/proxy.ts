import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Cannot use '@/config/env' in proxy (edge) — read process.env directly.
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? '');

// ─── Token Payload ────────────────────────────────────────────────────────────
interface JWTClaims {
  userId: string;
  role: string;
  sessionId: string;
  provider: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  onboardingCompleted: boolean;
}

async function getTokenClaims(request: NextRequest): Promise<JWTClaims | null> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as JWTClaims;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url));
}

function isVerified(claims: JWTClaims): boolean {
  if (claims.provider === 'GOOGLE') return claims.isEmailVerified;
  if (claims.provider === 'PHONE') return claims.isPhoneVerified;
  return false;
}

// ─── Proxy ────────────────────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const claims = await getTokenClaims(request);
  const isAuthenticated = claims !== null;

  // ── /login: redirect authenticated users forward ─────────────────────────────
  if (pathname === '/login') {
    if (isAuthenticated) {
      if (!isVerified(claims)) {
        const dest = claims.provider === 'GOOGLE' ? '/verify-email-notice' : '/verify-phone-notice';
        return redirectTo(dest, request);
      }
      if (!claims.onboardingCompleted) return redirectTo('/onboarding', request);
      return redirectTo('/dashboard', request);
    }
    return NextResponse.next();
  }

  // ── /complete-profile: only for brand-new users with no session yet ──────────
  // ✅ FIX: Do NOT redirect away just because a cookie exists.
  // The login flow calls /api/auth/logout before sending new users here,
  // so a stale cookie should never be present. But as a safety net:
  // only redirect if the user is fully authenticated AND onboarding is done.
  // If onboardingCompleted is false, the user may have just registered —
  // let them through so they can complete their profile normally.
  if (pathname === '/complete-profile') {
    if (isAuthenticated && isVerified(claims) && claims.onboardingCompleted) {
      // Fully set-up user has no business here → send to dashboard
      return redirectTo('/dashboard', request);
    }
    // Not authenticated, or authenticated but not fully set up → allow
    return NextResponse.next();
  }

  // ── Verification notice pages: require auth; skip if already verified ────────
  if (pathname === '/verify-email-notice' || pathname === '/verify-phone-notice') {
    if (!isAuthenticated) return redirectTo('/login', request);
    if (isVerified(claims)) {
      if (!claims.onboardingCompleted) return redirectTo('/onboarding', request);
      return redirectTo('/dashboard', request);
    }
    return NextResponse.next();
  }

  // ── Onboarding: require auth + verification ──────────────────────────────────
  if (pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) return redirectTo('/login', request);
    if (!isVerified(claims)) {
      const dest = claims.provider === 'GOOGLE' ? '/verify-email-notice' : '/verify-phone-notice';
      return redirectTo(dest, request);
    }
    if (claims.onboardingCompleted) return redirectTo('/dashboard', request);
    return NextResponse.next();
  }

  // ── Dashboard: require auth + verification + onboarding completed ────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) return redirectTo('/login', request);
    if (!isVerified(claims)) {
      const dest = claims.provider === 'GOOGLE' ? '/verify-email-notice' : '/verify-phone-notice';
      return redirectTo(dest, request);
    }
    if (!claims.onboardingCompleted) return redirectTo('/onboarding', request);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (API routes — protected per-route)
     * - /_next/static, /_next/image (Next.js internals)
     * - /favicon.ico
     * - /verify-email (token-link, not session-based)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|verify-email).*)',
  ],
};
