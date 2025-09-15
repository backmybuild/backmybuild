const Logo = ({ size = 50 }: { size?: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Background with subtle layering */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        fill="#0f172a" // slate-900 background
      />
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        fill="#1e293b" // slate-800 inner layer
      />

      {/* Lock body with soft shadow */}
      <rect
        x="8"
        y="11"
        width="8"
        height="6"
        rx="1.8"
        fill="white"
        opacity="0.6"
      />
      <rect
        x="8"
        y="11"
        width="8"
        height="6"
        rx="1.8"
        stroke="white"
        strokeOpacity="0.8"
      />

      {/* Lock shackle */}
      <path
        d="M10 11V9.5a2 2 0 0 1 4 0V11"
        stroke="white"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Heart inside lock with subtle shine */}
      <path
        d="M12 14.3l-0.6-0.6a1.2 1.2 0 1 1 1.7-1.7l0.4 0.4 0.4-0.4a1.2 1.2 0 1 1 1.7 1.7l-0.6 0.6-1.5 1.5-1.5-1.5z"
        fill="#ef4444"
      />
      <circle cx="12.8" cy="13.2" r="0.4" fill="white" opacity="0.6" />
    </svg>
  </div>
);

export default Logo;
