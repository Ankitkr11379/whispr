import prisma from '@/lib/prisma/db';
import { createHash } from 'crypto';

export class SessionRepository {
  static hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  static async createSession(userId: string, refreshToken: string, deviceInfo?: string, ipAddress?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    return prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        expiresAt,
        deviceInfo,
        ipAddress,
      },
    });
  }

  static async revokeSession(sessionId: string, replacedByTokenHash?: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { 
        isRevoked: true,
        replacedByTokenHash
      },
    });
  }

  static async deleteSession(sessionId: string) {
    return prisma.session.delete({
      where: { id: sessionId },
    });
  }

  static async deleteAllUserSessions(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  static async findSessionByToken(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    return prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });
  }
}
