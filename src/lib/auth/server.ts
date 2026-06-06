import { cookies } from 'next/headers';
import prisma from '@/lib/prisma/db';
import { verifyAccessToken } from './jwt';

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) return null;

    const payload = await verifyAccessToken(accessToken);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        interests: true,
        skills: true,
        preference: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }
}
