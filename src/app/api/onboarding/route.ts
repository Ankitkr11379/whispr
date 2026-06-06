import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma/db';
import { verifyAccessToken, generateAccessToken } from '@/lib/auth/jwt';
import { onboardingSchema } from '@/features/onboarding/validators/onboarding.validator';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ success: false, error: { message: 'Invalid or expired token' } }, { status: 401 });
    }

    const userId = payload.userId;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });
    }

    const body = await req.json();
    const result = onboardingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: result.error.issues } },
        { status: 400 }
      );
    }

    const { fullName, bio, profilePicture, interests, skills, preference } = result.data;

    // Perform the database operations in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Profile (if profile doesn't exist, create it)
      await tx.profile.upsert({
        where: { userId },
        update: {
          fullName: fullName || undefined,
          bio: bio || null,
          profilePicture: profilePicture || null,
        },
        create: {
          userId,
          fullName: fullName || '',
          bio: bio || null,
          profilePicture: profilePicture || null,
        },
      });

      // 2. Sync Interests (Delete all existing user interests first, then bulk insert)
      await tx.userInterest.deleteMany({
        where: { userId },
      });
      if (interests.length > 0) {
        await tx.userInterest.createMany({
          data: interests.map((interest) => ({
            userId,
            interest,
          })),
        });
      }

      // 3. Sync Skills (Delete all existing user skills first, then bulk insert)
      await tx.userSkill.deleteMany({
        where: { userId },
      });
      if (skills.length > 0) {
        await tx.userSkill.createMany({
          data: skills.map((skill) => ({
            userId,
            skill,
          })),
        });
      }

      // 4. Sync Preferences (Upsert UserPreference)
      await tx.userPreference.upsert({
        where: { userId },
        update: {
          minAge: preference.minAge,
          maxAge: preference.maxAge,
          distance: preference.distance,
          lookingFor: preference.lookingFor,
          preferredGenders: preference.preferredGenders,
        },
        create: {
          userId,
          minAge: preference.minAge,
          maxAge: preference.maxAge,
          distance: preference.distance,
          lookingFor: preference.lookingFor,
          preferredGenders: preference.preferredGenders,
        },
      });

      // 5. Update user onboarding status
      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
        },
      });
    });

    // Reissue the access token with onboardingCompleted: true so that the user gets
    // routed immediately to the dashboard without being blocked by middleware.
    const newAccessToken = await generateAccessToken({
      userId: payload.userId,
      role: payload.role,
      sessionId: payload.sessionId,
      provider: payload.provider,
      isEmailVerified: payload.isEmailVerified,
      isPhoneVerified: payload.isPhoneVerified,
      onboardingCompleted: true,
    });

    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
