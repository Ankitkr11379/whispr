'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Step indicators ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Create Your Account' },
  { label: 'Build Your Vibe Profile' },
  { label: 'Match Anonymously' },
  { label: 'Chat Freely' },
  { label: 'Reveal When Ready' },
];

// ─── Feature highlights ───────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🎭',
    title: 'Personality First',
    desc: 'Your interests, values, and vibe matter more than your photos.',
  },
  {
    icon: '🌙',
    title: 'Stay Anonymous',
    desc: 'Explore conversations without worrying about appearances.',
  },
  {
    icon: '⚗️',
    title: 'Genuine Chemistry',
    desc: 'Build attraction through shared interests and meaningful conversations.',
  },
];

export default function CompleteProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    email: '',
    phone: '',
  });
  const [tempUser, setTempUser] = useState<any>(null);
  const [idToken, setIdToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // ── All logic unchanged ───────────────────────────────────────────────────
  useEffect(() => {
    const userStr = sessionStorage.getItem('tempUser');
    const token = sessionStorage.getItem('tempFirebaseIdToken');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setTempUser(user);
    setIdToken(token);
    setFormData(prev => ({
      ...prev,
      email: user.email || '',
      phone: user.phone || '',
    }));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseIdToken: idToken,
          fullName: formData.fullName,
          username: formData.username,
          dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
          gender: formData.gender,
          email: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.removeItem('tempUser');
        sessionStorage.removeItem('tempFirebaseIdToken');

        if (data.data.requireEmailVerification) {
          router.push('/verify-email-notice');
          return;
        }

        const user = data.data.user;
        if (user.provider === 'GOOGLE' && !user.isEmailVerified) {
          router.push('/verify-email-notice');
        } else if (user.provider === 'PHONE' && !user.isPhoneVerified) {
          router.push('/verify-phone-notice');
        } else if (!user.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(
          typeof data.error.message === 'string'
            ? data.error.message
            : JSON.stringify(data.error.message)
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tempUser) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:ital,wght@0,700;1,700&display=swap');

        .cp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #fff8f5;
        }

        /* ── Left panel ── */
        .cp-left {
          width: 42%;
          background: linear-gradient(145deg, #ff7b54 0%, #e8404a 55%, #c0392b 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem;
          position: relative;
          overflow: hidden;
        }

        .cp-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .cp-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fff;
          font-weight: 600;
          font-size: 1.1rem;
          letter-spacing: -0.01em;
          position: relative;
          z-index: 1;
        }

        .cp-logo-icon {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.25);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .cp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 20px;
          padding: 0.25rem 0.75rem;
          font-size: 0.72rem;
          color: #fff;
          font-weight: 500;
          margin-top: 1rem;
          width: fit-content;
          position: relative;
          z-index: 1;
        }

        .cp-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #a8ff78;
          border-radius: 50%;
          display: inline-block;
        }

        .cp-tagline {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.18;
          letter-spacing: -0.02em;
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .cp-desc {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
          margin-top: 0.75rem;
          position: relative;
          z-index: 1;
        }

        /* Step tracker */
        .cp-steps {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-top: 2rem;
          position: relative;
          z-index: 1;
        }

        .cp-step {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.65);
          font-weight: 500;
        }

        .cp-step.active {
          color: #fff;
          font-weight: 600;
        }

        .cp-step-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 9px;
          color: transparent;
        }

        .cp-step.active .cp-step-dot {
          background: #fff;
          border-color: #fff;
          color: #e8404a;
          font-weight: 700;
        }

        /* Feature cards */
        .cp-features {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 2rem;
          position: relative;
          z-index: 1;
        }

        .cp-feature {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .cp-feature-icon {
          width: 34px;
          height: 34px;
          background: rgba(255,255,255,0.18);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .cp-feature-text h4 {
          font-size: 0.82rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 2px;
        }

        .cp-feature-text p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
          margin: 0;
          line-height: 1.45;
        }

        .cp-quote {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.55);
          font-style: italic;
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .cp-left-footer {
          display: flex;
          gap: 1rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1rem;
          position: relative;
          z-index: 1;
        }

        /* ── Right panel ── */
        .cp-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #fff8f5;
        }

        .cp-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          box-shadow: 0 2px 24px rgba(200,80,60,0.08), 0 0 0 1px rgba(230,160,140,0.18);
        }

        .cp-card h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.7rem;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
        }

        .cp-subtitle {
          font-size: 0.875rem;
          color: #888;
          margin-bottom: 1.75rem;
          line-height: 1.5;
        }

        /* Form fields */
        .cp-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          margin-bottom: 1.25rem;
        }

        .cp-field-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #aaa;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
        }

        .cp-input {
          width: 100%;
          background: #fff5f4;
          border: 1.5px solid #f0c0bb;
          border-radius: 10px;
          padding: 0.78rem 1rem;
          font-size: 0.92rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }

        .cp-input:focus {
          outline: none;
          border-color: #e8404a;
          background: #fff;
        }

        .cp-input::placeholder { color: #ccc; }
        .cp-input:disabled { opacity: 0.55; cursor: not-allowed; }

        .cp-select {
          width: 100%;
          background: #fff5f4;
          border: 1.5px solid #f0c0bb;
          border-radius: 10px;
          padding: 0.78rem 1rem;
          font-size: 0.92rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.15s;
          box-sizing: border-box;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23aaa' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        .cp-select:focus {
          outline: none;
          border-color: #e8404a;
        }

        .cp-select:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Error */
        .cp-error {
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          background: #fff0f0;
          border: 1px solid #fdc5c5;
          color: #c0392b;
          font-size: 0.83rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        /* Submit button */
        .cp-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.9rem 1.25rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: #e8404a;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s ease;
          margin-top: 0.5rem;
        }

        .cp-btn:hover:not(:disabled) {
          background: #d43840;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(232,64,74,0.35);
        }

        .cp-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .cp-btn-arrow { font-size: 1rem; }

        /* Spinner */
        .cp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: cp-spin 0.7s linear infinite;
          display: inline-block;
        }

        @keyframes cp-spin { to { transform: rotate(360deg); } }

        .cp-card-footer {
          display: flex;
          justify-content: center;
          gap: 1rem;
          font-size: 0.75rem;
          color: #bbb;
          margin-top: 1.5rem;
        }

        .cp-card-footer a { color: #bbb; text-decoration: none; }
        .cp-card-footer a:hover { color: #e8404a; }

        .cp-signin {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 0.83rem;
          color: #aaa;
        }

        .cp-signin a {
          color: #e8404a;
          font-weight: 600;
          text-decoration: none;
        }

        .cp-signin a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .cp-left { display: none; }
          .cp-right { background: #fff8f5; }
        }
      `}</style>

      <div className="cp-root">
        {/* ── Left branding panel ── */}
        <div className="cp-left">
          <div>
            <div className="cp-logo">
              <div className="cp-logo-icon">💬</div>
              Whispr
            </div>
            <div className="cp-badge">Join Thousands Building Real Connections</div>
          </div>

          <div>
            <p className="cp-tagline">
              Meet people who like your mind before they see your face.
            </p>
            <p className="cp-desc">
              Whispr flips modern dating on its head. No pressure. No judgments.
              No endless swiping. Just genuine conversations that can turn into
              something meaningful.
            </p>

            {/* Step tracker — step 2 active (Build Your Vibe Profile) */}
            <div className="cp-steps">
              {STEPS.map((step, i) => (
                <div key={step.label} className={`cp-step ${i === 1 ? 'active' : ''}`}>
                  <div className="cp-step-dot">{i === 1 ? '✓' : ''}</div>
                  {step.label}
                </div>
              ))}
            </div>

            {/* Feature highlights */}
            <div className="cp-features">
              {FEATURES.map((f) => (
                <div key={f.title} className="cp-feature">
                  <div className="cp-feature-icon">{f.icon}</div>
                  <div className="cp-feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="cp-quote">"Real connections happen when people feel safe being themselves."</p>
          </div>

          <div className="cp-left-footer">
            <span>© 2024 Whispr</span>
            <span>All rights reserved.</span>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="cp-right">
          <div className="cp-card">
            <h2>Build Your Profile</h2>
            <p className="cp-subtitle">Just a few more details to get you started.</p>

            {error && <div className="cp-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="cp-field-group">

                {/* Full Name */}
                <div>
                  <p className="cp-field-label">Full Name</p>
                  <input
                    type="text"
                    placeholder="Your full name"
                    required
                    className="cp-input"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={loading}
                  />
                </div>

                {/* Username */}
                <div>
                  <p className="cp-field-label">Username</p>
                  <input
                    type="text"
                    placeholder="Pick a unique username"
                    required
                    minLength={3}
                    className="cp-input"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    disabled={loading}
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <p className="cp-field-label">Date of Birth</p>
                  <input
                    type="date"
                    required
                    className="cp-input"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={loading}
                  />
                </div>

                {/* Gender */}
                <div>
                  <p className="cp-field-label">Gender</p>
                  <select
                    className="cp-select"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    disabled={loading}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Email — only for phone users who have no email from Firebase */}
                {!tempUser.email && (
                  <div>
                    <p className="cp-field-label">Email Address</p>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="cp-input"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Phone — only for Google users who have no phone from Firebase */}
                {!tempUser.phone && (
                  <div>
                    <p className="cp-field-label">Phone Number</p>
                    <input
                      type="tel"
                      placeholder="+91 00000 00000"
                      required
                      className="cp-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                )}

              </div>

              <button type="submit" disabled={loading} className="cp-btn">
                {loading ? (
                  <><span className="cp-spinner" /> Saving...</>
                ) : (
                  <>Complete Setup <span className="cp-btn-arrow">→</span></>
                )}
              </button>
            </form>

            <div className="cp-signin">
              Already have an account? <a href="/login">Sign in</a>
            </div>

            <div className="cp-card-footer">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/safety">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
