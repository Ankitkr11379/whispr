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
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const body = await req.json();
    const result = completeProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: result.error.issues } },
        { status: 400 }
      );
    }

    const decodedToken = await AuthService.verifyFirebaseToken(result.data.firebaseIdToken);

    const existingUser = await UserRepository.findByFirebaseUid(decodedToken.uid);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'User already exists' } },
        { status: 400 }
      );
    }

    // ── Determine provider and resolve email / phone ──────────────────────────
    const provider = decodedToken.email ? AuthProvider.GOOGLE : AuthProvider.PHONE;

    // Allow resolving email from the request body for PHONE provider users.
    const email: string | undefined =
      provider === AuthProvider.GOOGLE ? decodedToken.email : (result.data.email || undefined);

    const phone: string | undefined = decodedToken.phone_number || result.data.phone || undefined;

    // ── Validate only the field relevant to this provider ────────────────────
    if (provider === AuthProvider.GOOGLE && !email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required for Google sign-in' } },
        { status: 400 }
      );
    }

    if (provider === AuthProvider.PHONE && !phone) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Phone number is required for phone sign-in' } },
        { status: 400 }
      );
    }

    // ── Check Firebase email_verified flag, not just email presence ──────────
    const isEmailVerified = provider === AuthProvider.GOOGLE
      ? (decodedToken.email_verified === true)
      : false;

    // Phone OTP completion in Firebase means the phone IS verified
    const isPhoneVerified = provider === AuthProvider.PHONE
      ? !!decodedToken.phone_number
      : false;

    // ── Create user ───────────────────────────────────────────────────────────
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
        if (target?.includes('username')) {
          return NextResponse.json(
            { success: false, error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' } },
            { status: 400 }
          );
        }
        if (target?.includes('email')) {
          return NextResponse.json(
            { success: false, error: { code: 'EMAIL_TAKEN', message: 'Email is already registered' } },
            { status: 400 }
          );
        }
        if (target?.includes('phone')) {
          return NextResponse.json(
            { success: false, error: { code: 'PHONE_TAKEN', message: 'Phone number is already registered' } },
            { status: 400 }
          );
        }
      }
      throw e;
    }

    // Log successful registration
    await prisma.authLog.create({
      data: {
        userId: newUser.id,
        action: 'REGISTER',
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });

    // ── Send email verification if email is present and NOT verified ──────────
    if (email && !isEmailVerified) {
      const rawToken = randomBytes(32).toString('hex');
      // Bug fix #4: store the SHA-256 hash, never the raw token
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailVerification.create({
        data: { userId: newUser.id, tokenHash, expiresAt },
      });

      // Send raw token in the email link; verify endpoint must hash before DB lookup
      await sendVerificationEmail(email, rawToken);

      return NextResponse.json({
        success: true,
        data: { requireEmailVerification: true, message: 'Verification email sent' },
      });
    }

    // ── Issue session tokens ───────────────────────────────────────────────────
    // Bug fix #2: onboardingCompleted is included in the token payload so that
    // downstream middleware can enforce the gate on protected routes.
    // Ensure your auth middleware rejects requests where onboardingCompleted === false.
    const tokenPayloadBase = {
      userId: newUser.id,
      role: newUser.role,
      provider: newUser.provider,
      isEmailVerified: newUser.isEmailVerified,
      isPhoneVerified: newUser.isPhoneVerified,
      onboardingCompleted: newUser.onboardingCompleted,
    };

    const refreshToken = await generateRefreshToken(tokenPayloadBase);
    const session = await SessionRepository.createSession(newUser.id, refreshToken, userAgent, ipAddress);
    const accessToken = await generateAccessToken({
      ...tokenPayloadBase,
      sessionId: session.id,
    });

    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    // Bug fix #6: path must exactly match your refresh endpoint route.
    // Using '/api/auth' is explicit and safe. If your refresh route
    // lives at a different path, update this value to match it exactly.
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/api/auth',
    });

    // Return only safe user fields, not the full Prisma object
    return NextResponse.json({
      success: true,
      data: {
        requireEmailVerification: false,
        user: {
          id: newUser.id,
          provider: newUser.provider,
          isEmailVerified: newUser.isEmailVerified,
          isPhoneVerified: newUser.isPhoneVerified,
          onboardingCompleted: newUser.onboardingCompleted,
        },
      },
    });

  } catch (error: any) {
    // Bug fix #3: log the full error server-side only; never expose error.message
    // to the client as it can leak Prisma internals (table/column/constraint names).
    console.error('[POST /api/auth/register]', error);

    await prisma.authLog.create({
      data: {
        userId: null,
        action: 'REGISTER',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        // Store the message in your DB log for internal debugging only
        reason: error.message,
      },
    }).catch(() => { }); // don't let logging failure crash the response

    return NextResponse.json(
      { success: false, error: { code: 'REGISTRATION_FAILED', message: 'Registration failed. Please try again.' } },
      { status: 500 }
    );
  }
}