import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { SessionRepository } from '@/features/auth/repositories/session.repository';
import prisma from '@/lib/prisma/db';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const oldRefreshToken = cookieStore.get('refresh_token')?.value;

    if (!oldRefreshToken) {
      return NextResponse.json({ success: false, error: { message: 'No refresh token' } }, { status: 401 });
    }

    const payload = await verifyRefreshToken(oldRefreshToken);
    if (!payload) {
      return NextResponse.json({ success: false, error: { message: 'Invalid refresh token' } }, { status: 401 });
    }

    const session = await SessionRepository.findSessionByToken(oldRefreshToken);
    if (!session) {
      return NextResponse.json({ success: false, error: { message: 'Session not found' } }, { status: 401 });
    }

    // Token reuse detection
    if (session.isRevoked) {
      await SessionRepository.deleteAllUserSessions(session.userId);
      await prisma.authLog.create({
        data: { userId: session.userId, action: 'REFRESH', ipAddress: req.headers.get('x-real-ip'), userAgent: req.headers.get('user-agent'), status: 'FAILURE', reason: 'TOKEN_REUSE_DETECTED' }
      });
      return NextResponse.json({ success: false, error: { message: 'Token reuse detected. All sessions revoked.' } }, { status: 401 });
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: { message: 'Session expired' } }, { status: 401 });
    }

    // Token Rotation — fetch fresh user data to reflect any DB updates (e.g. onboardingCompleted)
    const freshUser = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!freshUser) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 401 });
    }

    const tokenPayloadBase = {
      userId: freshUser.id,
      role: freshUser.role,
      provider: freshUser.provider,
      isEmailVerified: freshUser.isEmailVerified,
      isPhoneVerified: freshUser.isPhoneVerified,
      onboardingCompleted: freshUser.onboardingCompleted,
    };

    const newRefreshToken = await generateRefreshToken(tokenPayloadBase);
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const newHash = SessionRepository.hashToken(newRefreshToken);
    await SessionRepository.revokeSession(session.id, newHash);
    
    const newSession = await SessionRepository.createSession(payload.userId, newRefreshToken, userAgent, ipAddress);

    const newAccessToken = await generateAccessToken({
      ...tokenPayloadBase,
      sessionId: newSession.id,
    });

    await prisma.authLog.create({
      data: { userId: payload.userId, action: 'REFRESH', ipAddress, userAgent, status: 'SUCCESS' }
    });

    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    
    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/api/auth',
    });

    return NextResponse.json({ success: true, data: { refreshed: true } });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 401 });
  }
}
