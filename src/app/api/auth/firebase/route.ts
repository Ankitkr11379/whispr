import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/features/auth/services/auth.service';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma/db';

const loginSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // Moved above try block so available in catch too
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } },
        { status: 400 }
      );
    }

    const loginResult = await AuthService.handleFirebaseLogin(
      result.data.idToken,
      ipAddress,
      userAgent
    );

    if (loginResult.isNewUser) {
      return NextResponse.json({
        success: true,
        data: {
          isNewUser: true,
          firebaseUid: loginResult.firebaseUid,
          email: loginResult.email,
          phone: loginResult.phone,
          provider: loginResult.provider,
        },
      });
    }

    const cookieStore = await cookies();
    cookieStore.set('access_token', loginResult.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    cookieStore.set('refresh_token', loginResult.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/api/auth',
    });

    return NextResponse.json({
      success: true,
      data: {
        isNewUser: false,
        user: {
          id: loginResult.user!.id,
          provider: loginResult.user!.provider,
          isEmailVerified: loginResult.user!.isEmailVerified,
          isPhoneVerified: loginResult.user!.isPhoneVerified,
          onboardingCompleted: loginResult.user!.onboardingCompleted,
        },
      },
    });

  } catch (error: any) {
    // Log failed login attempts
    await prisma.authLog.create({
      data: {
        userId: null,
        action: 'LOGIN',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        reason: error.message,
      },
    }).catch(() => {})

    const isAuthError = error.message?.includes('Firebase') ||
                        error.message?.includes('Invalid') ||
                        error.message?.includes('Token')

    return NextResponse.json(
      { success: false, error: { code: 'AUTH_FAILED', message: error.message } },
      { status: isAuthError ? 401 : 500 }
    );
  }
}