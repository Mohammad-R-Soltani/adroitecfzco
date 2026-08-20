export default function Logomark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#0071e3" />
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#logomark-sheen)" />
      {/* pin-grid-array corner accent */}
      <circle cx="23" cy="9" r="1.3" fill="#22d3ee" />
      <circle cx="27" cy="9" r="1.3" fill="#22d3ee" fillOpacity="0.55" />
      <circle cx="23" cy="13" r="1.3" fill="#22d3ee" fillOpacity="0.55" />
      <text
        x="9"
        y="23"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="700"
        fontSize="16"
        fill="white"
      >
        a
      </text>
      <defs>
        <linearGradient id="logomark-sheen" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.16" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
