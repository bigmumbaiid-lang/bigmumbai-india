import { useId } from 'react';

export default function Tile({ index, state, onClick, disabled }) {
  const cls =
    state === 'safe' ? 'm-tile m-tile--safe'
    : state === 'mine' ? 'm-tile m-tile--mine'
    : 'm-tile m-tile--hidden';

  // Purple backdrop to match the reference gem tile
  const safeStyle = state === 'safe'
    ? { background: 'radial-gradient(75% 75% at 50% 32%, #935cce 0%, #844bc3 60%, #793fb6 100%)' }
    : undefined;

  return (
    <button
      type="button"
      className={cls}
      style={safeStyle}
      onClick={() => !disabled && state === 'hidden' && onClick(index)}
      disabled={disabled}
      aria-label={`Tile ${index + 1}`}
    >
      {state === 'safe' && <DiamondIcon />}
      {state === 'mine' && <BombIcon />}
    </button>
  );
}

const REVEAL = { animation: 'tileReveal 0.28s cubic-bezier(.2,.8,.25,1) both' };

/* ── Faceted translucent purple diamond ── */
function DiamondIcon() {
  const raw = useId();
  const uid = raw.replace(/:/g, '');
  const g = (n) => `${uid}-${n}`;
  return (
    <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" style={REVEAL}>
      <defs>
        <linearGradient id={g('table')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1e4ff" />
          <stop offset="100%" stopColor="#c39df6" />
        </linearGradient>
        <linearGradient id={g('sideL')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cfaef9" />
          <stop offset="100%" stopColor="#9a63e8" />
        </linearGradient>
        <linearGradient id={g('sideR')} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b083f2" />
          <stop offset="100%" stopColor="#8348d4" />
        </linearGradient>
        <linearGradient id={g('pavL')} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#b884f2" />
          <stop offset="100%" stopColor="#7b3fce" />
        </linearGradient>
        <linearGradient id={g('pavR')} x1="0.9" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor="#9a5fe4" />
          <stop offset="100%" stopColor="#6a2fb8" />
        </linearGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#d5a6ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#d5a6ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('spk')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* aura + drop shadow */}
      <ellipse cx="32" cy="33" rx="27" ry="25" fill={`url(#${g('glow')})`} />
      <ellipse cx="32" cy="55" rx="9" ry="2.6" fill="#3a1d6b" opacity="0.4" />

      {/* pavilion */}
      <polygon points="8,30 32,30 32,56" fill={`url(#${g('pavL')})`} />
      <polygon points="56,30 32,30 32,56" fill={`url(#${g('pavR')})`} />
      <polygon points="8,30 20,30 32,56" fill="#ffffff" fillOpacity="0.06" />
      <polygon points="20,30 32,30 32,56" fill="#ffffff" fillOpacity="0.11" />
      <polygon points="56,30 44,30 32,56" fill="#000000" fillOpacity="0.09" />

      {/* crown */}
      <polygon points="22,15 42,15 44,30 20,30" fill={`url(#${g('table')})`} />
      <polygon points="22,15 20,30 8,30" fill={`url(#${g('sideL')})`} />
      <polygon points="42,15 56,30 44,30" fill={`url(#${g('sideR')})`} />
      <polygon points="22,15 24,30 20,30" fill="#ffffff" fillOpacity="0.10" />
      <polygon points="42,15 44,30 40,30" fill="#000000" fillOpacity="0.06" />
      {/* table bevel highlight */}
      <polygon points="22,15 42,15 38,19 26,19" fill="#ffffff" fillOpacity="0.6" />

      {/* girdle shimmer */}
      <polygon points="8,30 56,30 52,31.7 12,31.7" fill="#ffffff" fillOpacity="0.35" />

      {/* tiny inner star */}
      <path d="M32 27 l0.8 2 2 0.8 -2 0.8 -0.8 2 -0.8 -2 -2 -0.8 2 -0.8 Z" fill="#ffffff" fillOpacity="0.65" />

      {/* sparkle bottom-right */}
      <g transform="translate(47 40)">
        <circle r="9" fill={`url(#${g('spk')})`} />
        <path
          d="M0 -8.5 C0.6 -2.5 2.5 -0.6 8.5 0 C2.5 0.6 0.6 2.5 0 8.5 C-0.6 2.5 -2.5 0.6 -8.5 0 C-2.5 -0.6 -0.6 -2.5 0 -8.5 Z"
          fill="#ffffff"
          style={{ animation: 'gemTwinkle 1.8s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      </g>
    </svg>
  );
}

/* ── Glossy skull bomb with a lit, sparking fuse ── */
function BombIcon() {
  const raw = useId();
  const uid = raw.replace(/:/g, '');
  const g = (n) => `${uid}-${n}`;
  return (
    <svg viewBox="-4 -8 72 72" className="w-4/5 h-4/5" style={REVEAL}>
      <defs>
        <radialGradient id={g('body')} cx="0.34" cy="0.30" r="0.85">
          <stop offset="0%" stopColor="#b2b8c1" />
          <stop offset="34%" stopColor="#787e88" />
          <stop offset="68%" stopColor="#3d4147" />
          <stop offset="100%" stopColor="#191b1f" />
        </radialGradient>
        <linearGradient id={g('neck')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4c505a" />
          <stop offset="100%" stopColor="#22252b" />
        </linearGradient>
        <linearGradient id={g('brass')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6d98f" />
          <stop offset="48%" stopColor="#c79a4e" />
          <stop offset="100%" stopColor="#87672d" />
        </linearGradient>
        <radialGradient id={g('spark')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fffdef" />
          <stop offset="45%" stopColor="#ffe243" />
          <stop offset="100%" stopColor="#f5c000" />
        </radialGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffe86b" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ffcf3a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffcf3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('skull')} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c3c8d0" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="28" cy="57" rx="18" ry="3.2" fill="#000000" opacity="0.18" />

      {/* fuse glow */}
      <circle cx="49" cy="12" r="17" fill={`url(#${g('glow')})`} />

      {/* fuse neck */}
      <path d="M35 24 L41 12 L49 15 L45 27 Z" fill={`url(#${g('neck')})`} />
      {/* brass holder + glowing hole */}
      <g transform="rotate(20 45 13)">
        <ellipse cx="45" cy="13" rx="6.4" ry="3" fill={`url(#${g('brass')})`} />
        <ellipse cx="45" cy="13" rx="4.2" ry="1.9" fill="#4a3212" />
        <ellipse cx="45" cy="13" rx="2.6" ry="1.2" fill="#ff9d2e" />
      </g>

      {/* sphere body */}
      <circle cx="28" cy="38" r="20" fill={`url(#${g('body')})`} />
      {/* top-left gloss */}
      <ellipse cx="19" cy="27" rx="9" ry="5.2" fill="#ffffff" opacity="0.30" transform="rotate(-35 19 27)" />
      <ellipse cx="17" cy="25" rx="3.4" ry="2" fill="#ffffff" opacity="0.6" transform="rotate(-35 17 25)" />
      {/* bottom rim light */}
      <path d="M12 47 A20 20 0 0 0 45 44" fill="none" stroke="#c4c9d1" strokeOpacity="0.22" strokeWidth="2.4" strokeLinecap="round" />

      {/* skull */}
      <path
        d="M23 31 C16.9 31 12.8 35.2 12.8 40.7 C12.8 44 14.5 46.4 16.9 47.7 L16.9 50.4
           C16.9 51.4 17.7 52.1 18.7 52.1 C19.6 52.1 20.4 51.4 20.4 50.4 L20.4 49.2
           C20.4 48.6 20.9 48.1 21.5 48.1 L24.5 48.1 C25.1 48.1 25.6 48.6 25.6 49.2 L25.6 50.4
           C25.6 51.4 26.4 52.1 27.3 52.1 C28.3 52.1 29.1 51.4 29.1 50.4 L29.1 47.7
           C31.5 46.4 33.2 44 33.2 40.7 C33.2 35.2 29.1 31 23 31 Z"
        fill={`url(#${g('skull')})`}
      />
      <ellipse cx="18.8" cy="40.4" rx="2.8" ry="3.4" fill="#5b616b" transform="rotate(14 18.8 40.4)" />
      <ellipse cx="27.2" cy="40.4" rx="2.8" ry="3.4" fill="#5b616b" transform="rotate(-14 27.2 40.4)" />
      <path d="M23 43.4 l1.5 2.7 h-3 Z" fill="#5b616b" />

      {/* spark star — outer g positions it, inner g animates (keeps the two
          transforms separate so the CSS scale never wipes the translate) */}
      <g transform="translate(49 11)">
        <g style={{ animation: 'gemTwinkle 0.9s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}>
          <path
            d="M0 -15 C1.3 -4.5 4.5 -1.3 15 0 C4.5 1.3 1.3 4.5 0 15 C-1.3 4.5 -4.5 1.3 -15 0 C-4.5 -1.3 -1.3 -4.5 0 -15 Z"
            fill={`url(#${g('spark')})`}
          />
          <circle r="3.2" fill="#fffef2" />
        </g>
      </g>
      {/* sparkle dots */}
      <circle cx="60" cy="8" r="1.7" fill="#ffffff" />
      <circle cx="59" cy="22" r="1.5" fill="#ffffff" />
      <circle cx="38" cy="8" r="1.3" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}
