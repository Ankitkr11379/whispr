import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  DIRECT_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).transform(key => key.replace(/\\n/g, '\n')),  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

// We only want to parse server env vars on the server side
const isServer = typeof window === 'undefined';
const _serverEnv = isServer ? serverSchema.safeParse(process.env) : { success: true, data: {} };

if (isServer && !_serverEnv.success) {
  console.error('❌ Invalid server environment variables:\n', (_serverEnv as any).error.format());
  throw new Error('Invalid environment variables');
}

const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

if (!_clientEnv.success) {
  console.error('❌ Invalid client environment variables:\n', _clientEnv.error.format());
  throw new Error('Invalid environment variables');
}

export const env = {
  ...(isServer && _serverEnv.success ? _serverEnv.data : {}),
  ..._clientEnv.data,
} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
