import { z } from 'zod';

export const completeProfileSchema = z.object({
  firebaseIdToken: z.string().min(1),
  fullName: z.string().min(2),
  username: z.string().min(3).max(30),
  dateOfBirth: z.string().datetime(), // ISO string
  gender: z.string().optional(),
  email: z.string().email().optional(), // Provided if Phone Login
  phone: z.string().optional(), // Not needed if they linked in Firebase, but we'll accept it
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});
