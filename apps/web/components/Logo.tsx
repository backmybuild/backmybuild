const Logo = ({ size = 20 }: { size?: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#g1)" />
      <path
        d="M7 9h10M7 12h6M7 15h10"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default Logo;
