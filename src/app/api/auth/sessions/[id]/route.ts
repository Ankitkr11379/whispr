import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma/db';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { SessionRepository } from '@/features/auth/repositories/session.repository';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 });
    }

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: { message: 'Session not found' } }, { status: 404 });
    }

    await SessionRepository.deleteSession(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
