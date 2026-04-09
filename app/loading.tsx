export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Animated logo mark */}
        <div className="relative w-12 h-12">
          {/* Outer ring */}
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '1.4s', animationTimingFunction: 'linear' }}
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="24" cy="24" r="20"
              stroke="#E8E4DD"
              strokeWidth="3"
            />
            <path
              d="M 24 4 A 20 20 0 0 1 44 24"
              stroke="#0EA5E9"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          {/* Inner J mark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[#0A1628] font-bold text-lg leading-none select-none"
              style={{ fontFamily: 'Satoshi, DM Sans, sans-serif' }}
            >
              J
            </span>
          </div>
        </div>

        <p className="text-sm text-[#0A1628]/35 tracking-wide">Loading…</p>
      </div>
    </div>
  )
}
