import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  // Server-side verification guard (secondary to proxy.ts)
  if (user.provider === 'GOOGLE' && !user.isEmailVerified) {
    redirect('/verify-email-notice');
  }

  if (user.provider === 'PHONE' && !user.isPhoneVerified) {
    redirect('/verify-phone-notice');
  }

  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
