// "AT" monogram: the A and T share one crossbar. Drawn with currentColor so it follows the theme.
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 50 21 14 34 50" />
      <path d="M32 14h24" />
      <path d="M44.5 14v36" />
      <path d="M13.5 38h31" />
      <circle cx="55" cy="49" r="3.4" fill="var(--accent, #e6a07e)" stroke="none" />
    </svg>
  );
}
