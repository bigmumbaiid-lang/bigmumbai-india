export default function Tile({ index, state, onClick, disabled }) {
  // state: 'hidden' | 'safe' | 'mine'
  const base =
    'aspect-square rounded-md flex items-center justify-center transition-all duration-150 select-none overflow-hidden';

  let appearance = '';
  if (state === 'hidden') {
    appearance = disabled
      ? 'bg-slate-700 cursor-not-allowed'
      : 'bg-slate-700 hover:bg-slate-600 cursor-pointer active:scale-95';
  } else if (state === 'safe') {
    appearance = 'bg-emerald-500 cursor-default';
  } else if (state === 'mine') {
    appearance = 'bg-rose-500 cursor-default';
  }

  return (
    <button
      type="button"
      className={`${base} ${appearance}`}
      onClick={() => !disabled && state === 'hidden' && onClick(index)}
      disabled={disabled}
      aria-label={`Tile ${index + 1}`}
    >
      {state === 'safe' && <GemIcon />}
      {state === 'mine' && <BombIcon />}
    </button>
  );
}

/* ── Faceted gem icon ── */
function GemIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-3/5 h-3/5 drop-shadow-sm"
      style={{ animation: 'tilePop 0.25s ease-out' }}
    >
      {/* top facets */}
      <polygon points="12,8 36,8 42,18 6,18" fill="#baf7e0" />
      <polygon points="12,8 24,18 6,18" fill="#8ceccb" />
      <polygon points="36,8 42,18 24,18" fill="#8ceccb" />
      <polygon points="12,8 36,8 24,18" fill="#ffffff" fillOpacity="0.85" />
      {/* body facets */}
      <polygon points="6,18 24,18 24,42" fill="#34d399" />
      <polygon points="42,18 24,18 24,42" fill="#10b981" />
      <polygon points="6,18 42,18 24,42" fill="#059669" fillOpacity="0.25" />
      {/* shine */}
      <polygon points="12,8 16,8 13,18 9,18" fill="#ffffff" fillOpacity="0.5" />
    </svg>
  );
}

/* ── Bomb icon with lit fuse ── */
function BombIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-3/5 h-3/5 drop-shadow-sm"
      style={{ animation: 'tilePop 0.25s ease-out' }}
    >
      {/* fuse */}
      <path
        d="M30 14 Q34 8 38 7"
        fill="none"
        stroke="#92400e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* spark */}
      <circle cx="39" cy="6.5" r="3.2" fill="#fde047" />
      <circle cx="39" cy="6.5" r="1.6" fill="#fff" />
      {/* fuse cap */}
      <rect x="26" y="12" width="6" height="6" rx="1.5" fill="#1f2937" transform="rotate(20 29 15)" />
      {/* body */}
      <circle cx="22" cy="28" r="15" fill="#1a1a1a" />
      {/* highlight */}
      <ellipse cx="16" cy="22" rx="5" ry="3.5" fill="#ffffff" fillOpacity="0.18" />
      {/* skull (nod to your reference) */}
      <circle cx="22" cy="27" r="6.5" fill="#e5e7eb" />
      <circle cx="19.5" cy="26" r="1.6" fill="#1a1a1a" />
      <circle cx="24.5" cy="26" r="1.6" fill="#1a1a1a" />
      <path d="M21 31 h2 v2 h-2 z" fill="#1a1a1a" />
    </svg>
  );
}