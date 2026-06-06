import { getAuthenticatedUser } from '@/lib/auth/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8 p-6 md:p-12 relative z-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Welcome back, {user.profile?.fullName || user.username}!</p>
        </div>
        <Link href="/api/auth/logout" className="btn-secondary px-6 py-2 text-sm flex items-center justify-center">
          Log Out
        </Link>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 glass-card p-6 flex flex-col items-center text-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-whispr p-[2px] flex items-center justify-center">
            {user.profile?.profilePicture ? (
              <img
                src={user.profile.profilePicture}
                alt={user.profile.fullName || 'User'}
                className="w-full h-full rounded-full object-cover bg-[#0d0d0d]"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center text-3xl font-bold font-[family-name:var(--font-poppins)] text-white">
                {(user.profile?.fullName || user.username || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.profile?.fullName || 'No Name'}</h2>
            <p className="text-purple-400 text-sm">@{user.username || 'username'}</p>
          </div>
          <p className="text-gray-300 text-sm max-w-xs">{user.profile?.bio || 'No bio written yet.'}</p>
        </div>

        {/* Interests & Skills */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Matches / Connections Panel */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="text-xl font-semibold font-[family-name:var(--font-poppins)] text-purple-300">
              Personalized Matching Setup
            </h3>
            <p className="text-gray-300 text-sm">
              Your profile is fully configured! Based on your selected goal (
              <span className="text-white font-medium">{user.preference?.lookingFor || 'Friendship'}</span>) and
              interests, Whispr will start presenting matches here soon.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs">
                🎯 Preference: {user.preference?.minAge || 18} - {user.preference?.maxAge || 100} years
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs">
                📍 Max Distance: {user.preference?.distance || 100} miles
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Interests Card */}
            <div className="glass-card p-6 flex flex-col gap-3">
              <h4 className="text-lg font-semibold font-[family-name:var(--font-poppins)] text-cyan-300">
                My Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map((i) => (
                    <span
                      key={i.id}
                      className="px-3 py-1 text-xs rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300"
                    >
                      {i.interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No interests selected.</p>
                )}
              </div>
            </div>

            {/* Skills Card */}
            <div className="glass-card p-6 flex flex-col gap-3">
              <h4 className="text-lg font-semibold font-[family-name:var(--font-poppins)] text-pink-300">My Skills</h4>
              <div className="flex flex-wrap gap-2">
                {user.skills && user.skills.length > 0 ? (
                  user.skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                    >
                      {s.skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No skills listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
