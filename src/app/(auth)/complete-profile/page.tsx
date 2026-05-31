'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
        } else {
          router.push('/onboarding');
        }
      } else {
        setError(typeof data.error.message === 'string' ? data.error.message : JSON.stringify(data.error.message));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tempUser) return null;

  return (
    <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6 relative z-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">Complete Profile</h1>
        <p className="text-gray-400 text-sm">Just a few more details</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="text" placeholder="Full Name" required className="input-field" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} disabled={loading} />
        <input type="text" placeholder="Username" required minLength={3} className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={loading} />
        <input type="date" required className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} disabled={loading} />
        
        <select className="input-field appearance-none bg-transparent" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} disabled={loading}>
          <option value="Male" className="bg-[#1a1a1a]">Male</option>
          <option value="Female" className="bg-[#1a1a1a]">Female</option>
          <option value="Non-binary" className="bg-[#1a1a1a]">Non-binary</option>
          <option value="Prefer not to say" className="bg-[#1a1a1a]">Prefer not to say</option>
        </select>

        {!tempUser.email && (
          <input type="email" placeholder="Email Address" required className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={loading} />
        )}

        {!tempUser.phone && (
          <input type="tel" placeholder="Phone Number" required className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={loading} />
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}
