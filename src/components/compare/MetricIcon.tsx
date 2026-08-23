export default function MetricIcon({ kind, className = "h-4 w-4" }: { kind: string; className?: string }) {
  switch (kind) {
    case "display":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M10.5 19h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M20 12a8 8 0 11-2.5-5.8M20 4v4h-4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "battery":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="2.5" y="7" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M21 10.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="5" y="9.5" width="8" height="5" rx="1" fill="currentColor" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M13 2.5L5 13.5h5.5L10 21.5l8.5-11.5H13l0-7.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="2.5" y="6.5" width="19" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="13.2" r="3.6" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8.5 6.5l1.2-2.2h4.6l1.2 2.2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case "weight":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M6.5 8h11l2 12.5h-15L6.5 8z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    default:
      return null;
  }
}
