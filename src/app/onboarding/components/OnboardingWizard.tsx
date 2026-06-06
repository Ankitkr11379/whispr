'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LucideIcon, User, Sparkles, Target, CheckCircle2, ChevronRight, ChevronLeft, Upload, Plus, X } from 'lucide-react';

interface OnboardingWizardProps {
  user: {
    id: string;
    username: string | null;
    email: string | null;
    profile: {
      fullName: string | null;
      gender: string | null;
    } | null;
  };
}

const INTERESTS_PRESETS = [
  'Tech & Coding', 'Design & Art', 'Music & Concerts', 'Gaming & Esport',
  'Fitness & Gym', 'Travel & Hiking', 'Movies & Anime', 'Photography',
  'Cooking & Food', 'Reading & Writing', 'Startups & Biz', 'Sports'
];

const SKILLS_SUGGESTIONS = [
  'React / Next.js', 'Node.js', 'UI/UX Design', 'TypeScript',
  'Python', 'Machine Learning', 'Marketing', 'Public Speaking'
];

const LOOKING_FOR_PRESETS = [
  { id: 'Friendship', title: '🤝 Friendship', desc: 'Connect with like-minded friends' },
  { id: 'Networking', title: '💼 Networking', desc: 'Expand your professional circle' },
  { id: 'Mentorship', title: '💬 Mentorship', desc: 'Learn or guide others in your field' },
  { id: 'Dating', title: '❤️ Dating', desc: 'Find romantic connections' }
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Everyone'];

export default function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basics State
  const [fullName, setFullName] = useState(user.profile?.fullName || '');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Interests & Skills State
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Step 3: Preferences State
  const [lookingFor, setLookingFor] = useState('Friendship');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [distance, setDistance] = useState(50);
  const [preferredGenders, setPreferredGenders] = useState<string[]>(['Everyone']);

  // Predefined Avatar Gradients
  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #FB2BB6 0%, #D210FA 100%)',
    'linear-gradient(135deg, #D210FA 0%, #3E36FA 100%)',
    'linear-gradient(135deg, #3E36FA 0%, #01D7F7 100%)',
    'linear-gradient(135deg, #01D7F7 0%, #FB2BB6 100%)',
    'linear-gradient(135deg, #FF5E62 0%, #FF9966 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  ];

  // Helper to handle avatar selection
  const selectPredefinedAvatar = (index: number) => {
    setAvatarIndex(index);
    // Create SVG data URI for local rendering & saving to database
    const initial = (fullName || user.username || 'U')[0].toUpperCase();
    const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="url(%23grad)" /><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${index === 0 ? '%23FB2BB6' : index === 1 ? '%23D210FA' : index === 2 ? '%233E36FA' : index === 3 ? '%2301D7F7' : index === 4 ? '%23FF5E62' : '%2311998e'}" /><stop offset="100%" stop-color="${index === 0 ? '%23D210FA' : index === 1 ? '%233E36FA' : index === 2 ? '%2301D7F7' : index === 3 ? '%23FB2BB6' : index === 4 ? '%23FF9966' : '%2338ef7d'}" /></linearGradient></defs><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Poppins, sans-serif" font-size="40" font-weight="bold" fill="white">${initial}</text></svg>`;
    setProfilePicture(svg);
  };

  // Helper for custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
      setAvatarIndex(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Interest selection helper
  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  // Skill input handlers
  const handleAddSkill = (skill: string) => {
    const cleaned = skill.trim();
    if (cleaned && !skills.includes(cleaned)) {
      setSkills([...skills, cleaned]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // Preferred Gender options toggle
  const togglePreferredGender = (gender: string) => {
    if (gender === 'Everyone') {
      setPreferredGenders(['Everyone']);
      return;
    }
    let updated = preferredGenders.filter(g => g !== 'Everyone');
    if (updated.includes(gender)) {
      updated = updated.filter(g => g !== gender);
      if (updated.length === 0) updated = ['Everyone'];
    } else {
      updated.push(gender);
    }
    setPreferredGenders(updated);
  };

  // Validate current step before advancing
  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Full Name is required');
        return;
      }
    } else if (step === 2) {
      if (interests.length === 0) {
        setError('Please select at least 1 interest');
        return;
      }
      if (skills.length === 0) {
        setError('Please add at least 1 skill');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  // Submit onboarding data to API
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        fullName,
        bio,
        profilePicture,
        interests,
        skills,
        preference: {
          lookingFor,
          minAge,
          maxAge,
          distance,
          preferredGenders
        }
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        // Step to success state, then redirect
        setStep(5);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error?.message || 'Failed to complete onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 relative z-10 p-4">
      {/* Progress Indicator */}
      {step <= 4 && (
        <div className="flex flex-col gap-2 w-full mb-2">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Step {step} of 4</span>
            <span className="font-semibold text-purple-400">{Math.round(progressPercentage)}% Completed</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-whispr transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Glass Card Form Container */}
      <div className="glass-card p-8 md:p-10 flex flex-col gap-6 w-full relative min-h-[480px] justify-between">
        
        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">
                Let's set up your profile
              </h2>
              <p className="text-gray-400 text-sm">Introduce yourself to the Whispr community.</p>
            </div>

            {/* Profile Photo Uploader */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
              <div className="relative w-28 h-28 rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden group">
                {profilePicture ? (
                  <img src={profilePicture} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-xs font-semibold"
                >
                  <Upload className="w-4 h-4 mr-1" /> Custom
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col gap-3 items-center sm:items-start w-full">
                <span className="text-sm font-medium text-gray-300">Choose a default avatar gradient:</span>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_GRADIENTS.map((gradient, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPredefinedAvatar(idx)}
                      className={`w-9 h-9 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95 border-2 ${
                        avatarIndex === idx ? 'border-purple-400 scale-105 shadow-[0_0_8px_#a855f7]' : 'border-transparent'
                      }`}
                      style={{ background: gradient }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:bg-white/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium px-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm px-1">
                  <label className="text-gray-300 font-medium">Bio / About Me</label>
                  <span className={`text-xs ${bio.length > 450 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {bio.length}/500
                  </span>
                </div>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 500))}
                  rows={4}
                  className="input-field rounded-2xl resize-none py-3"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: INTERESTS & SKILLS */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">
                Interests & Skills
              </h2>
              <p className="text-gray-400 text-sm">Tell us what you love and what you are good at.</p>
            </div>

            {/* Interests Tag Cloud */}
            <div className="flex flex-col gap-3">
              <span className="text-sm text-gray-300 font-semibold px-1">Select Interests (Min 1):</span>
              <div className="flex flex-wrap gap-2">
                {INTERESTS_PRESETS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border transition-all duration-200 ${
                        selected
                          ? 'bg-gradient-whispr border-transparent text-white shadow-[0_2px_10px_-2px_rgba(210,16,250,0.5)] scale-[1.03]'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills Tag Input */}
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-sm text-gray-300 font-semibold px-1">Add Skills (Min 1):</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill (e.g. Figma, Python) and press Enter"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(skillInput);
                    }
                  }}
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(skillInput)}
                  className="px-5 rounded-full bg-white/15 border border-white/20 text-sm font-semibold hover:bg-white/20 cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Skills Tags List */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Skill suggestions */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-xs text-gray-500 px-1 font-medium">Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS_SUGGESTIONS.map(s => {
                    const added = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={added}
                        onClick={() => handleAddSkill(s)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border border-white/5 text-gray-400 bg-white/5 ${
                          added ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 hover:text-white cursor-pointer'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GOALS & PREFERENCES */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">
                Goals & Matching Preferences
              </h2>
              <p className="text-gray-400 text-sm">We use these configurations to match you with compatible circles.</p>
            </div>

            {/* Looking For Radio Cards */}
            <div className="flex flex-col gap-3">
              <span className="text-sm text-gray-300 font-semibold px-1">What are you looking for?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LOOKING_FOR_PRESETS.map((preset) => {
                  const selected = lookingFor === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLookingFor(preset.id)}
                      className={`p-4 rounded-2xl text-left border flex flex-col gap-1 cursor-pointer transition-all duration-200 ${
                        selected
                          ? 'border-purple-400 bg-purple-500/10 shadow-[0_0_15px_-3px_#a855f7]'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-semibold text-white">{preset.title}</span>
                      <span className="text-xs text-gray-400">{preset.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Age Range Slider */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm text-gray-300 font-semibold">Target Age Match:</span>
                <span className="text-sm font-semibold text-purple-400">{minAge} - {maxAge} years</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex text-xs text-gray-500 justify-between">
                    <span>Min Age: {minAge}</span>
                    <span>Max Age: {maxAge}</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={minAge}
                    onChange={e => setMinAge(Math.min(Number(e.target.value), maxAge))}
                    className="w-full accent-purple-500 cursor-pointer h-1 bg-white/10 rounded-full"
                  />
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={maxAge}
                    onChange={e => setMaxAge(Math.max(Number(e.target.value), minAge))}
                    className="w-full accent-purple-500 cursor-pointer h-1 bg-white/10 rounded-full mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Distance Slider */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm text-gray-300 font-semibold">Max Distance:</span>
                <span className="text-sm font-semibold text-cyan-400">{distance} miles</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={distance}
                onChange={e => setDistance(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1 bg-white/10 rounded-full"
              />
            </div>

            {/* Preferred Genders Buttons */}
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-sm text-gray-300 font-semibold px-1">Connect with genders:</span>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((gender) => {
                  const selected = preferredGenders.includes(gender);
                  return (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => togglePreferredGender(gender)}
                      className={`px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                        selected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {gender}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & FINISH */}
        {step === 4 && (
          <div className="flex flex-col gap-6 animate-fadeIn items-center text-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">
                Ready to explore?
              </h2>
              <p className="text-gray-400 text-sm">Review your custom profile setup before finalizing.</p>
            </div>

            {/* Live Profile Card Preview */}
            <div className="w-full max-w-sm glass-card border border-white/20 p-6 flex flex-col gap-4 text-left relative overflow-hidden group shadow-[0_10px_30px_-5px_rgba(168,85,247,0.15)]">
              {/* Corner Ambient lights */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-40 bg-[#FB2BB6] translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[40px] opacity-40 bg-[#01D7F7] -translate-x-1/3 translate-y-1/3" />

              <div className="flex gap-4 items-center z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-whispr p-[2px] flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Avatar" className="w-full h-full rounded-full object-cover bg-[#0d0d0d]" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center text-xl font-bold text-white">
                      {(fullName || user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{fullName || 'Your Name'}</h3>
                  <p className="text-xs text-purple-400">@{user.username || 'username'}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-gray-300">
                    🎯 {lookingFor}
                  </span>
                </div>
              </div>

              {bio && (
                <p className="text-sm text-gray-300 border-t border-white/5 pt-3 leading-relaxed z-10 italic">
                  "{bio}"
                </p>
              )}

              <div className="flex flex-col gap-2.5 border-t border-white/5 pt-3 z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Interests</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {interests.map(i => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/15">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS REDIRECT ANIMATION */}
        {step === 5 && (
          <div className="flex flex-col gap-6 items-center justify-center text-center py-12 animate-fadeIn">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 animate-bounce" />
            <div>
              <h2 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-2">
                All Set, {fullName.split(' ')[0]}!
              </h2>
              <p className="text-gray-400 text-base max-w-sm mx-auto">
                Setting up your personalized matching dashboard... Get ready to connect.
              </p>
            </div>
            {/* Spinning loading line */}
            <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-gradient-whispr animate-loadingBar" />
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        {step <= 4 && (
          <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="btn-secondary px-6 py-2.5 text-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-8 py-2.5 text-sm flex items-center gap-1 cursor-pointer"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary px-10 py-2.5 text-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Finalizing...' : 'Complete Setup'} <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
