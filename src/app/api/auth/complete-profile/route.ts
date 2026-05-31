import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { completeProfileSchema } from '@/features/auth/validators/auth.validator';
import { AuthService } from '@/features/auth/services/auth.service';
import { UserRepository } from '@/features/auth/repositories/user.repository';
import { AuthProvider, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma/db';
import { sendVerificationEmail } from '@/lib/resend/mailer';
import { createHash, randomBytes } from 'crypto';
import { SessionRepository } from '@/features/auth/repositories/session.repository';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = completeProfileSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors } }, { status: 400 });
    }

    const decodedToken = await AuthService.verifyFirebaseToken(result.data.firebaseIdToken);
    
    const existingUser = await UserRepository.findByFirebaseUid(decodedToken.uid);
    if (existingUser) {
      return NextResponse.json({ success: false, error: { code: 'USER_EXISTS', message: 'User already exists' } }, { status: 400 });
    }

    const email = decodedToken.email || result.data.email;
    const phone = decodedToken.phone_number || result.data.phone;

    if (!email) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Phone is required' } }, { status: 400 });
    }

    const provider = decodedToken.email ? AuthProvider.GOOGLE : AuthProvider.PHONE;
    const isEmailVerified = !!decodedToken.email;
    const isPhoneVerified = !!decodedToken.phone_number;

    let newUser;
    try {
      newUser = await UserRepository.createUserWithProfile({
        firebaseUid: decodedToken.uid,
        email,
        phone,
        provider,
        username: result.data.username,
        fullName: result.data.fullName,
        gender: result.data.gender,
        dateOfBirth: new Date(result.data.dateOfBirth),
        isEmailVerified,
        isPhoneVerified,
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = e.meta?.target as string[];
        if (target && target.includes('username')) {
          return NextResponse.json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' } }, { status: 400 });
        }
      }
      throw e;
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await prisma.authLog.create({
      data: { userId: newUser.id, action: 'REGISTER', ipAddress, userAgent, status: 'SUCCESS' }
    });

    if (!isEmailVerified) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.emailVerification.create({
        data: { userId: newUser.id, tokenHash, expiresAt }
      });

      await sendVerificationEmail(email, rawToken);

      return NextResponse.json({ success: true, data: { requireEmailVerification: true, message: 'Verification email sent' } });
    }

    const refreshToken = await generateRefreshToken({ userId: newUser.id, role: newUser.role });
    const session = await SessionRepository.createSession(newUser.id, refreshToken, userAgent, ipAddress);
    const accessToken = await generateAccessToken({ userId: newUser.id, role: newUser.role, sessionId: session.id });

    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60, path: '/' });
    cookieStore.set('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/api/auth' });

    return NextResponse.json({ success: true, data: { requireEmailVerification: false, user: newUser } });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'REGISTRATION_FAILED', message: error.message } }, { status: 500 });
  }
}
