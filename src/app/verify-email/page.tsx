'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('Verifying...');
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus('No token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (data.success) {
          setStatus('Verification successful! Redirecting...');
          setTimeout(() => {
            router.push('/onboarding');
          }, 2000);
        } else {
          setStatus('Verification failed: ' + (data.error.message || 'Unknown error'));
        }
      } catch (err: any) {
        setStatus('Verification failed: ' + err.message);
      }
    };
    verify();
  }, [token, router]);

  return (
    <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6 text-center z-10">
      <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr">Email Verification</h1>
      <p className="text-gray-300">{status}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
