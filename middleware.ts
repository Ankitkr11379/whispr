import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ── Route groups ──────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ['/', '/login', '/complete-profile'];
const AUTH_ROUTES = ['/verify-email', '/verify-phone-notice', '/verify-email-notice'];
const ONBOARDING = '/onboarding';
const DASHBOARD = '/dashboard';

// ── Secret (must match jwt.ts) ────────────────────────────────────────────────
// We re-encode here instead of importing env to keep middleware on the Edge runtime.
// middleware cannot import from @/config/env (Node-only module).
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // ── Always allow Next.js internals, static files, and API routes ─────────
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/assets') ||
        pathname.startsWith('/public') ||
        pathname.startsWith('/api')     // API handles its own auth
    ) {
        return NextResponse.next();
    }

    const accessToken = req.cookies.get('access_token')?.value;

    // ── No token → only public routes are allowed ─────────────────────────────
    if (!accessToken) {
        if (
            PUBLIC_ROUTES.includes(pathname) ||
            AUTH_ROUTES.some(r => pathname.startsWith(r))
        ) {
            return NextResponse.next();
        }
        // Tried to access /dashboard or /onboarding without a session → home
        return NextResponse.redirect(new URL('/', req.url));
    }

    // ── Verify token ──────────────────────────────────────────────────────────
    try {
        const { payload } = await jwtVerify(accessToken, ACCESS_SECRET);
        const onboardingCompleted = payload.onboardingCompleted as boolean;

        // ── Logged-in user visiting complete-profile → skip to right place ──────────
        if (pathname === '/complete-profile') {
            return NextResponse.redirect(
                new URL(onboardingCompleted ? DASHBOARD : ONBOARDING, req.url)
            );
        }

        // ── Onboarding not done → force /onboarding ──────────────────────────────
        if (!onboardingCompleted && pathname.startsWith(DASHBOARD)) {
            return NextResponse.redirect(new URL(ONBOARDING, req.url));
        }

        // ── Onboarding done → don't let them back into /onboarding ───────────────
        if (onboardingCompleted && pathname.startsWith(ONBOARDING)) {
            return NextResponse.redirect(new URL(DASHBOARD, req.url));
        }

        return NextResponse.next();

    } catch {
        // Token expired or tampered → clear cookies and send home
        const res = NextResponse.redirect(new URL('/', req.url));
        res.cookies.delete('access_token');
        res.cookies.delete('refresh_token');
        return res;
    }
}

export const config = {
    // Run on every route except Next.js internals and static files
    matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|public).*)'],
};