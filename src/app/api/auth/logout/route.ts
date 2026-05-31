import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SessionRepository } from '@/features/auth/repositories/session.repository';
import prisma from '@/lib/prisma/db';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        await SessionRepository.deleteSession(payload.sessionId);
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        await prisma.authLog.create({
          data: { userId: payload.userId, action: 'LOGOUT', ipAddress, userAgent, status: 'SUCCESS' }
        });
      }
    }

    cookieStore.delete('access_token');
    cookieStore.delete({ name: 'refresh_token', path: '/api/auth' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
