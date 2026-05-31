import * as admin from 'firebase-admin';
import { env } from '@/config/env';

if (!admin.apps.length) {
  // Format private key properly to handle escaped newlines
  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const authAdmin = admin.auth();
