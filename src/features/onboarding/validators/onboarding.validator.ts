import { z } from 'zod';

export const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional().or(z.literal('')),
  profilePicture: z.string().optional().or(z.literal('')),
  interests: z.array(z.string()).min(1, 'Please select at least 1 interest'),
  skills: z.array(z.string()).min(1, 'Please add at least 1 skill'),
  preference: z.object({
    lookingFor: z.string().min(1, 'Please select what you are looking for'),
    minAge: z.number().int().min(18).max(100),
    maxAge: z.number().int().min(18).max(100),
    distance: z.number().int().min(1).max(500),
    preferredGenders: z.array(z.string()).min(1, 'Please select at least one preferred gender'),
  }),
});
