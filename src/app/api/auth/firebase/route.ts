import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/features/auth/services/auth.service';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const loginResult = await AuthService.handleFirebaseLogin(result.data.idToken, ipAddress, userAgent);

    if (loginResult.isNewUser) {
      return NextResponse.json({
        success: true,
        data: {
          isNewUser: true,
          firebaseUid: loginResult.firebaseUid,
          email: loginResult.email,
          phone: loginResult.phone,
          provider: loginResult.provider,
        }
      });
    }

    // Set Cookies
    const cookieStore = await cookies();
    cookieStore.set('access_token', loginResult.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });
    
    cookieStore.set('refresh_token', loginResult.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/api/auth', // restricted path
    });

    return NextResponse.json({
      success: true,
      data: {
        isNewUser: false,
        user: loginResult.user,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'AUTH_FAILED', message: error.message }
    }, { status: 401 });
  }
}
