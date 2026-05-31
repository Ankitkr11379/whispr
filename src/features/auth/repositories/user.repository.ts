import prisma from '@/lib/prisma/db';
import { Prisma, User, AuthProvider } from '@prisma/client';

export class UserRepository {
  static async findByFirebaseUid(firebaseUid: string) {
    return prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }
  
  static async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  static async createUserWithProfile(data: {
    firebaseUid: string;
    email?: string;
    phone?: string;
    provider: AuthProvider;
    fullName?: string;
    username: string;
    dateOfBirth?: Date;
    gender?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
  }) {
    return prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        phone: data.phone,
        username: data.username,
        provider: data.provider,
        isEmailVerified: data.isEmailVerified ?? false,
        isPhoneVerified: data.isPhoneVerified ?? false,
        profileCompleted: true,
        profile: {
          create: {
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
          },
        },
      },
      include: { profile: true },
    });
  }
}
