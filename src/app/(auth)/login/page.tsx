'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await authenticateWithBackend(idToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setShowOtp(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult?.confirm(otp);
      if (result) {
        const idToken = await result.user.getIdToken();
        await authenticateWithBackend(idToken);
      }
    } catch (err: any) {
      setError('Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithBackend = async (idToken: string) => {
    const res = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    
    if (data.success) {
      if (data.data.isNewUser) {
        sessionStorage.setItem('tempFirebaseIdToken', idToken);
        sessionStorage.setItem('tempUser', JSON.stringify(data.data));
        router.push('/complete-profile');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(data.error.message || 'Authentication failed');
    }
  };

  return (
    <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6 relative z-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">Welcome to Whispr</h1>
        <p className="text-gray-400 text-sm">Sign in to continue</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>}

      <button onClick={handleGoogleLogin} disabled={loading} className="btn-secondary w-full">
        Continue with Google
      </button>

      <div className="flex items-center gap-4 text-gray-500 text-sm">
        <div className="flex-1 h-px bg-white/10" />
        <span>OR</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {!showOtp ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <input
            type="tel"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="input-field text-center tracking-widest text-lg font-mono"
            maxLength={6}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}
