'use client';

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

// ─── Country Codes ────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { flag: '🇮🇳', name: 'India', code: '+91', maxDigits: 10 },
  { flag: '🇺🇸', name: 'USA', code: '+1', maxDigits: 10 },
  { flag: '🇬🇧', name: 'UK', code: '+44', maxDigits: 10 },
  { flag: '🇦🇺', name: 'Australia', code: '+61', maxDigits: 9 },
  { flag: '🇨🇦', name: 'Canada', code: '+1', maxDigits: 10 },
  { flag: '🇸🇬', name: 'Singapore', code: '+65', maxDigits: 8 },
  { flag: '🇦🇪', name: 'UAE', code: '+971', maxDigits: 9 },
  { flag: '🇩🇪', name: 'Germany', code: '+49', maxDigits: 12 },
  { flag: '🇫🇷', name: 'France', code: '+33', maxDigits: 9 },
  { flag: '🇯🇵', name: 'Japan', code: '+81', maxDigits: 10 },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginMode = 'idle' | 'google' | 'phone';
type AuthStep = 'choose' | 'phone' | 'otp';

// ─── Navigation helper ────────────────────────────────────────────────────────
function resolveRedirect(userData: {
  provider: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  onboardingCompleted: boolean;
}): string {
  if (userData.provider === 'GOOGLE' && !userData.isEmailVerified) return '/verify-email-notice';
  if (userData.provider === 'PHONE' && !userData.isPhoneVerified) return '/verify-phone-notice';
  if (!userData.onboardingCompleted) return '/onboarding';
  return '/dashboard';
}

// ─── Chat bubbles data ────────────────────────────────────────────────────────
const CHAT_BUBBLES = [
  { user: 'HiddenSoul', text: "I've always found the concept of liminal spaces so fascinating...", isOwn: false },
  { user: 'MidnightWave', text: 'Same! It\'s that eerie feeling of "in-between" that gets me.', isOwn: true },
  { user: 'HiddenSoul', text: 'Like you belong everywhere and nowhere at the same time.', isOwn: false },
];

const FEATURES = [
  { icon: '👤', label: 'Anonymous First' },
  { icon: '💬', label: 'Real Conversations' },
  { icon: '🤝', label: 'Mutual Reveal' },
  { icon: '🛡️', label: 'Safe For Everyone' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('choose');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('idle');
  const [error, setError] = useState('');
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const isLoading = loginMode !== 'idle';

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= selectedCountry.maxDigits) setLocalPhone(digits);
  };

  const isPhoneValid = localPhone.length === selectedCountry.maxDigits;

  const authenticateWithBackend = async (idToken: string) => {
    // ✅ FIX: Clear any stale session cookies BEFORE calling the auth endpoint.
    // Without this, if a previous user's access_token cookie is still alive,
    // the proxy sees them as authenticated and redirects new users away from
    // /complete-profile straight to /dashboard as the old user.
    // We call this silently — if it fails, it's not critical.
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });

    const res = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Authentication failed');

    if (data.data.isNewUser) {
      // New user: store temp data for complete-profile page.
      // Cookies are cleared above so the proxy won't interfere.
      sessionStorage.setItem('tempFirebaseIdToken', idToken);
      sessionStorage.setItem('tempUser', JSON.stringify(data.data));
      router.push('/complete-profile');
    } else {
      // Existing user: /api/auth/firebase already set the cookies.
      // Use resolveRedirect to decide where to send them based on
      // their verification and onboarding status.
      router.push(resolveRedirect(data.data.user));
    }
  };

  const handleGoogleLogin = async () => {
    setLoginMode('google');
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await authenticateWithBackend(idToken);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoginMode('idle');
    }
  };

  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current!,
        { size: 'invisible' }
      );
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      setError(`Please enter a valid ${selectedCountry.maxDigits}-digit phone number.`);
      return;
    }
    setLoginMode('phone');
    setError('');
    try {
      const appVerifier = setupRecaptcha();
      const fullPhoneNumber = `${selectedCountry.code}${localPhone}`;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setAuthStep('otp');
    } catch (err: any) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoginMode('idle');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoginMode('phone');
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      if (!result) throw new Error('Verification failed.');
      const idToken = await result.user.getIdToken();
      await authenticateWithBackend(idToken);
    } catch (err: any) {
      setError(
        err.message === 'Firebase: Error (auth/invalid-verification-code).'
          ? 'Invalid OTP. Please check the code and try again.'
          : err.message || 'Verification failed.'
      );
    } finally {
      setLoginMode('idle');
    }
  };

  const handleChangeNumber = () => {
    setAuthStep('phone');
    setOtp('');
    setError('');
    setConfirmationResult(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:ital,wght@0,700;1,700&display=swap');

        .whispr-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #fff8f5;
        }

        /* ── Left panel ── */
        .whispr-left {
          width: 38%;
          background: linear-gradient(145deg, #ff7b54 0%, #e8404a 55%, #c0392b 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem;
          position: relative;
          overflow: hidden;
        }

        .whispr-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .whispr-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fff;
          font-weight: 600;
          font-size: 1.1rem;
          letter-spacing: -0.01em;
        }

        .whispr-logo-icon {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.25);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .whispr-tagline {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.7rem, 3.5vw, 2.4rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.18;
          letter-spacing: -0.02em;
          margin-bottom: 2rem;
        }

        /* Chat preview card */
        .chat-card {
          background: #fff;
          border-radius: 18px;
          padding: 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .bubble-wrap { display: flex; align-items: flex-end; gap: 0.5rem; }
        .bubble-wrap.own { flex-direction: row-reverse; }

        .bubble-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff7b54, #e8404a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #fff;
          font-weight: 600;
          flex-shrink: 0;
        }

        .bubble-avatar.own {
          background: linear-gradient(135deg, #c0392b, #96281b);
        }

        .bubble-body { max-width: 82%; }

        .bubble-name {
          font-size: 10px;
          font-weight: 600;
          color: #e8404a;
          margin-bottom: 3px;
          padding-left: 2px;
        }

        .bubble-name.own { text-align: right; padding-right: 2px; color: #c0392b; }

        .bubble-text {
          background: #f5f5f5;
          border-radius: 14px 14px 14px 4px;
          padding: 0.6rem 0.85rem;
          font-size: 0.8rem;
          color: #333;
          line-height: 1.45;
        }

        .bubble-wrap.own .bubble-text {
          background: linear-gradient(135deg, #ff7b54, #e8404a);
          color: #fff;
          border-radius: 14px 14px 4px 14px;
        }

        /* Feature pills */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }

        .feature-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 8px;
          padding: 0.45rem 0.7rem;
          font-size: 0.75rem;
          color: #fff;
          font-weight: 500;
        }

        .left-footer {
          display: flex;
          gap: 1rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-top: 1.5rem;
        }

        /* ── Right panel ── */
        .whispr-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #fff8f5;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          box-shadow: 0 2px 24px rgba(200,80,60,0.08), 0 0 0 1px rgba(230,160,140,0.18);
        }

        .auth-card h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: #888;
          margin-bottom: 1.75rem;
          line-height: 1.5;
        }

        /* Buttons */
        .btn-mobile {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.8rem 1.25rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
          background: #e8404a;
          color: #fff;
          margin-bottom: 0.75rem;
        }

        .btn-mobile:hover:not(:disabled) { background: #d43840; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,64,74,0.35); }
        .btn-mobile:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-email {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.8rem 1.25rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid #f0c0bb;
          background: #fff5f4;
          color: #444;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 0.75rem;
        }

        .btn-email:hover:not(:disabled) { border-color: #e8404a; color: #e8404a; transform: translateY(-1px); }

        .divider-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #ccc;
          font-size: 0.8rem;
          margin: 0.25rem 0 0.75rem;
        }

        .divider-row::before,
        .divider-row::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f0e8e5;
        }

        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.8rem 1.25rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid #e8e0dd;
          background: #fff;
          color: #333;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 0.75rem;
        }

        .btn-google:hover:not(:disabled) { border-color: #ccc; background: #fafafa; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.08); }
        .btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-apple {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.8rem 1.25rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: #111;
          color: #fff;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .btn-apple:hover:not(:disabled) { background: #2a2a2a; transform: translateY(-1px); }

        /* Error */
        .error-banner {
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          background: #fff0f0;
          border: 1px solid #fdc5c5;
          color: #c0392b;
          font-size: 0.83rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        /* Phone step */
        .phone-form { display: flex; flex-direction: column; gap: 1rem; }

        .form-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #888;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: -0.25rem;
        }

        .phone-row { display: flex; gap: 0.5rem; }

        .country-select-wrap { position: relative; }

        .country-select {
          appearance: none;
          background: #fff5f4;
          border: 1.5px solid #f0c0bb;
          border-radius: 10px;
          padding: 0.72rem 1.75rem 0.72rem 0.75rem;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          color: #333;
          cursor: pointer;
          width: 105px;
        }

        .country-select:focus { outline: none; border-color: #e8404a; }

        .country-arrow {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: #aaa;
          pointer-events: none;
        }

        .phone-input {
          flex: 1;
          background: #fff5f4;
          border: 1.5px solid #f0c0bb;
          border-radius: 10px;
          padding: 0.72rem 0.9rem;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          letter-spacing: 0.08em;
          transition: border-color 0.15s;
        }

        .phone-input:focus { outline: none; border-color: #e8404a; background: #fff; }
        .phone-input::placeholder { color: #ccc; letter-spacing: 0.04em; }

        .phone-hint {
          font-size: 0.78rem;
          color: #aaa;
          margin-top: -0.25rem;
        }

        .phone-hint.valid { color: #27ae60; }

        .otp-input {
          width: 100%;
          background: #fff5f4;
          border: 1.5px solid #f0c0bb;
          border-radius: 10px;
          padding: 0.9rem;
          font-size: 1.5rem;
          font-family: 'DM Mono', 'Courier New', monospace;
          color: #1a1a1a;
          letter-spacing: 0.5em;
          text-align: center;
          transition: border-color 0.15s;
        }

        .otp-input:focus { outline: none; border-color: #e8404a; background: #fff; }

        .back-link {
          background: none;
          border: none;
          color: #aaa;
          font-size: 0.83rem;
          cursor: pointer;
          text-align: center;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
          padding: 0;
        }

        .back-link:hover { color: #e8404a; }
        .back-link:disabled { opacity: 0.4; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        .spinner-dark {
          border-color: rgba(0,0,0,0.15);
          border-top-color: #555;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.83rem;
          color: #aaa;
        }

        .login-footer a { color: #e8404a; font-weight: 600; text-decoration: none; }
        .login-footer a:hover { text-decoration: underline; }

        .card-footer-links {
          display: flex;
          justify-content: center;
          gap: 1rem;
          font-size: 0.75rem;
          color: #bbb;
          margin-top: 1.5rem;
        }

        .card-footer-links a { color: #bbb; text-decoration: none; }
        .card-footer-links a:hover { color: #e8404a; }

        @media (max-width: 768px) {
          .whispr-left { display: none; }
          .whispr-right { background: #fff8f5; }
        }
      `}</style>

      <div className="whispr-root">
        {/* ── Left branding panel ── */}
        <div className="whispr-left">
          <div className="whispr-logo">
            <div className="whispr-logo-icon">💬</div>
            Whispr
          </div>

          <div>
            <p className="whispr-tagline">
              Meet people who like your mind before they see your face.
            </p>

            <div className="chat-card">
              {CHAT_BUBBLES.map((b, i) => (
                <div key={i} className={`bubble-wrap ${b.isOwn ? 'own' : ''}`}>
                  <div className={`bubble-avatar ${b.isOwn ? 'own' : ''}`}>
                    {b.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="bubble-body">
                    <div className={`bubble-name ${b.isOwn ? 'own' : ''}`}>{b.user}</div>
                    <div className="bubble-text">{b.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.label} className="feature-pill">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <div className="left-footer">
              <span>© Safe</span>
              <span>© Anonymous</span>
              <span>© Gen-Z Friendly</span>
              <span>© No Endless Swiping</span>
            </div>
          </div>
        </div>

        {/* ── Right auth panel ── */}
        <div className="whispr-right">
          <div className="auth-card">
            <h2>Welcome to Whispr</h2>
            <p className="auth-subtitle">
              {authStep === 'otp'
                ? `Enter the code sent to ${selectedCountry.code} ${localPhone}`
                : 'Start your journey with the authentication method that works best for you.'}
            </p>

            {/* Error banner */}
            {error && <div className="error-banner" role="alert">{error}</div>}

            {/* ── Choose method ── */}
            {authStep === 'choose' && (
              <>
                <button
                  id="btn-mobile-login"
                  className="btn-mobile"
                  onClick={() => { setError(''); setAuthStep('phone'); }}
                  disabled={isLoading}
                >
                  📱 Continue with Mobile Number
                </button>

                <button
                  className="btn-email"
                  disabled={isLoading}
                  onClick={() => {/* email flow placeholder */ }}
                >
                  ✉️ Continue with Email
                </button>

                <div className="divider-row">OR</div>

                <button
                  id="btn-google-login"
                  className="btn-google"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {loginMode === 'google' ? (
                    <span className="spinner spinner-dark" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  <span>{loginMode === 'google' ? 'Signing in...' : 'Continue with Google'}</span>
                </button>

                <button className="btn-apple" disabled={isLoading}>
                  <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-165.3-118.3C46.3 763.3 0 626.4 0 497.7 0 261 151.6 138.3 300.3 138.3c68.3 0 124.9 45.5 167.4 45.5 41.1 0 105.4-48 182.7-48 29.4 0 108.2 2.6 162.5 96.9zm-209.4-85.7c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>

                <div className="login-footer">
                  Already have an account? <a href="/login">Login</a>
                </div>
              </>
            )}

            {/* ── Phone number entry ── */}
            {authStep === 'phone' && (
              <form onSubmit={handleSendOtp} className="phone-form">
                <p className="form-label">Phone Number</p>
                <div className="phone-row">
                  <div className="country-select-wrap">
                    <select
                      id="select-country-code"
                      className="country-select"
                      value={selectedCountry.code + selectedCountry.name}
                      onChange={(e) => {
                        const found = COUNTRY_CODES.find(c => c.code + c.name === e.target.value);
                        if (found) { setSelectedCountry(found); setLocalPhone(''); }
                      }}
                      disabled={isLoading}
                      aria-label="Select country code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code + c.name} value={c.code + c.name}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <span className="country-arrow">▼</span>
                  </div>
                  <input
                    id="input-phone-number"
                    type="tel"
                    inputMode="numeric"
                    placeholder={'9'.repeat(selectedCountry.maxDigits)}
                    value={localPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="phone-input"
                    maxLength={selectedCountry.maxDigits}
                    required
                    disabled={isLoading}
                    aria-label="Phone number"
                  />
                </div>

                <p className={`phone-hint ${isPhoneValid ? 'valid' : ''}`}>
                  {localPhone.length > 0
                    ? isPhoneValid
                      ? '✓ Ready to send OTP'
                      : `${selectedCountry.maxDigits - localPhone.length} more digit${selectedCountry.maxDigits - localPhone.length !== 1 ? 's' : ''} needed`
                    : `Enter your ${selectedCountry.maxDigits}-digit local number`}
                </p>

                <button
                  id="btn-send-otp"
                  type="submit"
                  className="btn-mobile"
                  disabled={isLoading || !isPhoneValid}
                >
                  {loginMode === 'phone'
                    ? <><span className="spinner" /> Sending OTP...</>
                    : 'Send OTP'}
                </button>

                <button type="button" className="back-link" onClick={() => { setError(''); setAuthStep('choose'); }} disabled={isLoading}>
                  ← Back to all options
                </button>
              </form>
            )}

            {/* ── OTP verification ── */}
            {authStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="phone-form">
                <input
                  id="input-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="otp-input"
                  maxLength={6}
                  required
                  disabled={isLoading}
                  aria-label="One-time password"
                  autoComplete="one-time-code"
                />

                <button
                  id="btn-verify-otp"
                  type="submit"
                  className="btn-mobile"
                  disabled={isLoading || otp.length !== 6}
                >
                  {loginMode === 'phone'
                    ? <><span className="spinner" /> Verifying...</>
                    : 'Verify OTP'}
                </button>

                <button
                  id="btn-change-number"
                  type="button"
                  className="back-link"
                  onClick={handleChangeNumber}
                  disabled={isLoading}
                >
                  ← Change number
                </button>
              </form>
            )}

            <div className="card-footer-links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/safety">Safety</a>
            </div>
          </div>
        </div>
      </div>

      {/* Invisible reCAPTCHA mount point */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />
    </>
  );
}
