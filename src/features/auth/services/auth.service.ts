import { authAdmin } from '@/lib/firebase/admin';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { AuthProvider } from '@prisma/client';
import prisma from '@/lib/prisma/db';

export class AuthService {
  static async verifyFirebaseToken(idToken: string) {
    try {
      const decodedToken = await authAdmin.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid Firebase Token');
    }
  }

  static async handleFirebaseLogin(idToken: string, ipAddress?: string, userAgent?: string) {
    const decodedToken = await this.verifyFirebaseToken(idToken);
    const { uid: firebaseUid, email, phone_number } = decodedToken;
    
    const existingUser = await UserRepository.findByFirebaseUid(firebaseUid);
    
    if (existingUser) {
      if (existingUser.status !== 'ACTIVE') {
        throw new Error('User account is ' + existingUser.status.toLowerCase());
      }

      const refreshToken = await generateRefreshToken({
        userId: existingUser.id,
        role: existingUser.role,
      });
      
      const session = await SessionRepository.createSession(existingUser.id, refreshToken, userAgent, ipAddress);
      
      const accessToken = await generateAccessToken({
        userId: existingUser.id,
        role: existingUser.role,
        sessionId: session.id,
      });

      // Log success
      await prisma.authLog.create({
        data: { userId: existingUser.id, action: 'LOGIN', ipAddress, userAgent, status: 'SUCCESS' }
      });

      return {
        isNewUser: false,
        user: existingUser,
        accessToken,
        refreshToken,
      };
    } else {
      return {
        isNewUser: true,
        firebaseUid,
        email,
        phone: phone_number,
        provider: email ? AuthProvider.GOOGLE : AuthProvider.PHONE,
      };
    }
  }
}
