import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/features/auth/validators/auth.validator';
import prisma from '@/lib/prisma/db';
import { createHash } from 'crypto';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { SessionRepository } from '@/features/auth/repositories/session.repository';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyEmailSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid token' } }, { status: 400 });
    }

    const tokenHash = createHash('sha256').update(result.data.token).digest('hex');

    const verification = await prisma.emailVerification.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!verification) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid' } }, { status: 400 });
    }

    if (verification.used || verification.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: { code: 'EXPIRED_TOKEN', message: 'Token is expired or already used' } }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { used: true }
      }),
      prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true }
      })
    ]);

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await prisma.authLog.create({
      data: { userId: verification.userId, action: 'VERIFY_EMAIL', ipAddress, userAgent, status: 'SUCCESS' }
    });

    const refreshToken = await generateRefreshToken({ userId: verification.userId, role: verification.user.role });
    const session = await SessionRepository.createSession(verification.userId, refreshToken, userAgent, ipAddress);
    const accessToken = await generateAccessToken({ userId: verification.userId, role: verification.user.role, sessionId: session.id });

    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60, path: '/' });
    cookieStore.set('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/api/auth' });

    return NextResponse.json({ success: true, data: { verified: true } });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'VERIFICATION_FAILED', message: error.message } }, { status: 500 });
  }
}
