const Logo = ({ size = 30 }: { size?: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#g1)" />

      {/* Lock body */}
      <rect
        x="8"
        y="11"
        width="8"
        height="6"
        rx="1.5"
        fill="white"
        opacity="0.9"
      />

      {/* Lock shackle */}
      <path
        d="M10 11V9.5a2 2 0 0 1 4 0V11"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Heart inside lock */}
      <path
        d="M12 14.5l-0.7-0.7a1.5 1.5 0 1 1 2.1-2.1l0.6 0.6 0.6-0.6a1.5 1.5 0 1 1 2.1 2.1l-0.7 0.7-2 2-2-2z"
        fill="#ef4444"
      />
    </svg>
  </div>
);

export default Logo;
