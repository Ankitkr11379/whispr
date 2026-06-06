export default function VerifyPhoneNoticePage() {
  return (
    <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6 text-center z-10">
      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#FB2BB6] to-[#01D7F7] flex items-center justify-center text-2xl">
        📱
      </div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-gradient-whispr">
        Verify Your Phone
      </h1>
      <p className="text-gray-300 leading-relaxed">
        Your phone number has not been verified yet. Please contact support or
        try logging in again to complete phone verification.
      </p>
      <a
        href="/login"
        className="btn-primary w-full"
      >
        Back to Login
      </a>
    </div>
  );
}
