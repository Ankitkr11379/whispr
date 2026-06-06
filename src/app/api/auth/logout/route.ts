import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SessionRepository } from '@/features/auth/repositories/session.repository';
import prisma from '@/lib/prisma/db';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        // Delete the DB session — ignore errors (session may already be gone)
        await SessionRepository.deleteSession(payload.sessionId).catch(() => { });
        await prisma.authLog.create({
          data: {
            userId: payload.userId,
            action: 'LOGOUT',
            ipAddress,
            userAgent,
            status: 'SUCCESS',
          },
        }).catch(() => { });
      }
    } else {
      // ✅ No active session — still log and clear cookies silently.
      // This is the path hit when login clears stale cookies for a new user.
      await prisma.authLog.create({
        data: {
          userId: null,
          action: 'LOGOUT',
          ipAddress,
          userAgent,
          status: 'SUCCESS',
          reason: 'No active session',
        },
      }).catch(() => { });
    }

    // Always clear cookies regardless of token validity
    cookieStore.delete('access_token');
    cookieStore.delete({ name: 'refresh_token', path: '/api/auth' });

    return NextResponse.json({
      success: true,
      data: { redirectTo: '/login' },
    });

  } catch (error: any) {
    // Still clear cookies even if something above throws
    try {
      const cookieStore = await cookies();
      cookieStore.delete('access_token');
      cookieStore.delete({ name: 'refresh_token', path: '/api/auth' });
    } catch { }

    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}
