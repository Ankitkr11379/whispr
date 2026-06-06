import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/server';
import OnboardingWizard from './components/OnboardingWizard';

export default async function OnboardingPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  if (user.onboardingCompleted) {
    redirect('/dashboard');
  }

  const serializedUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    profile: user.profile
      ? {
          fullName: user.profile.fullName,
          gender: user.profile.gender,
        }
      : null,
  };

  return (
    <div className="w-full flex items-center justify-center py-6 relative">
      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-0 w-48 h-48 rounded-full blur-[110px] opacity-40 bg-[#FB2BB6] -translate-x-1/4 -translate-y-1/4 z-[-1]" />
      <div className="fixed bottom-0 right-0 w-48 h-48 rounded-full blur-[110px] opacity-40 bg-[#01D7F7] translate-x-1/4 translate-y-1/4 z-[-1]" />

      <OnboardingWizard user={serializedUser} />
    </div>
  );
}
