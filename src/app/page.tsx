import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="w-full max-w-3xl glass-card p-12 flex flex-col gap-8 text-center z-10 items-center justify-center mt-12">
      <h1 className="text-6xl md:text-8xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr mb-4">
        Whispr
      </h1>
      <p className="text-gray-300 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
        The next generation platform for authentic connections. Discover, match, and chat securely.
      </p>
      
      <div className="flex gap-6 mt-8">
        <Link href="/login" className="btn-primary px-8 py-3 text-lg font-semibold shadow-lg shadow-purple-500/20">
          Get Started
        </Link>
      </div>
    </div>
  );
}
