'use client';

import { motion } from 'framer-motion';

export type MascotExpression = 'idle' | 'happy' | 'thinking' | 'talking' | 'greeting';

interface Props {
  size?: number;
  expression?: MascotExpression;
  open?: boolean;
  scrollY?: number;
}

export function AnimeMascot({ size = 80, expression = 'idle', open = false, scrollY = 0 }: Props) {
  const rotY = open ? 0 : Math.sin(scrollY * 0.002) * 12;
  const rotX = open ? 0 : Math.cos(scrollY * 0.003) * 6;

  const isHappy = expression === 'happy';
  const isThinking = expression === 'thinking';
  const isTalking = expression === 'talking';
  const isGreeting = expression === 'greeting';

  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: size,
        height: size * 1.15,
        transform: `perspective(500px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
        transition: open ? 'transform 0.6s ease' : 'transform 0.12s linear',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 100 115" width={size} height={size * 1.15} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="anim-skin" cx="42%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#fff4ee" />
            <stop offset="70%" stopColor="#fde8d8" />
            <stop offset="100%" stopColor="#f5c9ad" />
          </radialGradient>
          <radialGradient id="anim-hair" cx="30%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>
          <radialGradient id="anim-iris" cx="32%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#3b0764" />
          </radialGradient>
          <radialGradient id="anim-body" cx="30%" cy="20%" r="72%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </radialGradient>
          <filter id="anim-soft">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
          <filter id="anim-glow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── HAIR BACK LAYER ── */}
        <ellipse cx="50" cy="50" rx="26" ry="30" fill="url(#anim-hair)" />

        {/* ── CAT EARS ── */}
        <polygon points="27,26 20,8 37,20" fill="url(#anim-hair)" />
        <polygon points="30,24 24,12 36,20" fill="#fda4af" opacity="0.75" />
        <polygon points="73,26 80,8 63,20" fill="url(#anim-hair)" />
        <polygon points="70,24 76,12 64,20" fill="#fda4af" opacity="0.75" />

        {/* ── HAIR FRONT (bangs) ── */}
        <ellipse cx="50" cy="25" rx="26" ry="14" fill="url(#anim-hair)" />
        {/* Bang fringe */}
        <path d="M24,28 Q26,16 34,20 Q38,14 44,22 Q48,12 52,22 Q57,14 62,20 Q68,16 76,28" fill="url(#anim-hair)" />
        {/* Side strands */}
        <ellipse cx="25" cy="48" rx="7" ry="14" fill="url(#anim-hair)" />
        <ellipse cx="75" cy="48" rx="7" ry="14" fill="url(#anim-hair)" />

        {/* ── FACE ── */}
        <ellipse cx="50" cy="50" rx="22" ry="24" fill="url(#anim-skin)" />

        {/* ── BLUSH ── */}
        <ellipse cx="34" cy="57" rx="6.5" ry="4" fill="#fca5a5" opacity="0.45" filter="url(#anim-soft)" />
        <ellipse cx="66" cy="57" rx="6.5" ry="4" fill="#fca5a5" opacity="0.45" filter="url(#anim-soft)" />

        {/* ── EYES ── */}
        {isHappy ? (
          /* Happy: curved arch eyes */
          <>
            <path d="M32,46 Q37.5,41 43,46" stroke="#3b0764" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M57,46 Q62.5,41 68,46" stroke="#3b0764" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            {/* Eye sparkle */}
            <circle cx="34" cy="43" r="1" fill="#a78bfa" opacity="0.8" />
            <circle cx="67" cy="43" r="1" fill="#a78bfa" opacity="0.8" />
          </>
        ) : isThinking ? (
          /* Thinking: one eye half-closed */
          <>
            {/* Left eye: normal */}
            <ellipse cx="37" cy="47" rx="5.5" ry="6.5" fill="white" />
            <ellipse cx="37" cy="47" rx="4.5" ry="5.5" fill="url(#anim-iris)" />
            <ellipse cx="37" cy="47" rx="2.2" ry="2.8" fill="#1a0030" />
            <circle cx="34.5" cy="44.5" r="1.4" fill="white" />
            {/* Right eye: half-closed (droopy lid) */}
            <ellipse cx="63" cy="47" rx="5.5" ry="6.5" fill="white" />
            <ellipse cx="63" cy="47" rx="4.5" ry="5.5" fill="url(#anim-iris)" />
            <ellipse cx="63" cy="47" rx="2.2" ry="2.8" fill="#1a0030" />
            <circle cx="60.5" cy="44.5" r="1.4" fill="white" />
            {/* Heavy lid */}
            <path d="M57.5,42 Q63,40 68.5,42" fill="#e11d48" opacity="0.7" />
            {/* Thinking sweat drop */}
            <ellipse cx="77" cy="38" rx="2.5" ry="3.5" fill="#93c5fd" opacity="0.7" />
            <ellipse cx="77" cy="35.5" rx="1.2" ry="1.5" fill="#93c5fd" opacity="0.5" />
          </>
        ) : (
          /* Normal / talking / greeting */
          <>
            {/* Left eye */}
            <ellipse cx="37" cy="47" rx="5.5" ry="6.5" fill="white" />
            <ellipse cx="37" cy="47" rx="4.5" ry="5.5" fill="url(#anim-iris)" />
            <ellipse cx="37" cy="47" rx="2.2" ry="2.8" fill="#1a0030" />
            <circle cx="34.5" cy="44.5" r="1.5" fill="white" />
            <circle cx="39" cy="48.5" r="0.7" fill="white" opacity="0.7" />
            {/* Right eye */}
            <ellipse cx="63" cy="47" rx="5.5" ry="6.5" fill="white" />
            <ellipse cx="63" cy="47" rx="4.5" ry="5.5" fill="url(#anim-iris)" />
            <ellipse cx="63" cy="47" rx="2.2" ry="2.8" fill="#1a0030" />
            <circle cx="60.5" cy="44.5" r="1.5" fill="white" />
            <circle cx="65" cy="48.5" r="0.7" fill="white" opacity="0.7" />
          </>
        )}

        {/* ── EYELASHES ── */}
        {!isHappy && (
          <g stroke="#3b0764" strokeWidth="1.1" strokeLinecap="round" opacity="0.8">
            <line x1="31.5" y1="41.5" x2="30.5" y2="39" />
            <line x1="34" y1="40.5" x2="33.5" y2="38" />
            <line x1="37" y1="40.5" x2="37" y2="38" />
            <line x1="40" y1="41" x2="40.5" y2="38.5" />
            <line x1="42.5" y1="42" x2="43.5" y2="39.5" />
            <line x1="57.5" y1="42" x2="56.5" y2="39.5" />
            <line x1="60" y1="41" x2="59.5" y2="38.5" />
            <line x1="63" y1="40.5" x2="63" y2="38" />
            <line x1="66" y1="40.5" x2="66.5" y2="38" />
            <line x1="68.5" y1="41.5" x2="69.5" y2="39" />
          </g>
        )}

        {/* ── NOSE ── */}
        <ellipse cx="47.5" cy="56" rx="1.1" ry="0.8" fill="#d97070" opacity="0.6" />
        <ellipse cx="52.5" cy="56" rx="1.1" ry="0.8" fill="#d97070" opacity="0.6" />

        {/* ── MOUTH ── */}
        {isHappy ? (
          <path d="M41,62 Q50,70 59,62" stroke="#c2185b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ) : isTalking ? (
          <>
            <path d="M43,61 Q50,66 57,61" stroke="#c2185b" strokeWidth="2" fill="none" strokeLinecap="round" />
            <motion.ellipse
              cx="50" cy="64" rx="5" ry="3.5" fill="#fda4af" opacity="0.6"
              animate={{ ry: [3.5, 2, 3.5, 4, 3.5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </>
        ) : (
          <path d="M44,62 Q50,66 56,62" stroke="#c2185b" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}

        {/* ── SMALL BOW / ACCESSORY ── */}
        <path d="M44,32 Q50,28 56,32 Q50,36 44,32 Z" fill="#fca5a5" opacity="0.6" />
        <circle cx="50" cy="32" r="2" fill="#e11d48" />

        {/* ── NECK ── */}
        <rect x="44" y="73" width="12" height="5" rx="2.5" fill="#f5c9ad" />

        {/* ── BODY ── */}
        <path d="M28,78 Q22,83 20,97 L80,97 Q78,83 72,78 Q60,73 50,73 Q40,73 28,78 Z" fill="url(#anim-body)" />
        {/* Shirt highlight */}
        <path d="M36,79 L50,88 L64,79" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Logo dot on shirt */}
        <circle cx="50" cy="91" r="3" fill="rgba(255,255,255,0.25)" />
        <text x="48.5" y="93" fontSize="3.5" fill="white" fontWeight="bold" opacity="0.8">F</text>

        {/* ── GREETING HAND WAVE ── */}
        {isGreeting && (
          <motion.g
            animate={{ rotate: [0, 18, -5, 18, 0] }}
            transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
            style={{ transformOrigin: '72px 82px' }}
          >
            <ellipse cx="72" cy="82" rx="8" ry="9" fill="url(#anim-skin)" />
            <path d="M66,74 Q64,67 66,65 Q68,63 70,66" stroke="url(#anim-skin)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M69,73 Q68,65 70,63 Q72,61 73,65" stroke="url(#anim-skin)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M72,73 Q72,65 74,63 Q76,61 77,65" stroke="url(#anim-skin)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </motion.g>
        )}

        {/* ── EXPRESSION SPARKLES ── */}
        {isHappy && (
          <g filter="url(#anim-glow)">
            <motion.text x="82" y="38" fontSize="9" fill="#fbbf24" animate={{ scale: [1, 1.3, 1], opacity: [0.9, 1, 0.9] }} transition={{ duration: 1, repeat: Infinity }}>✨</motion.text>
            <motion.text x="8" y="42" fontSize="8" fill="#a78bfa" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>★</motion.text>
          </g>
        )}
        {isThinking && (
          <>
            <motion.text x="74" y="32" fontSize="10" fill="#7c3aed" fontWeight="bold" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>?</motion.text>
            <motion.text x="80" y="46" fontSize="8" fill="#e11d48" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }}>?</motion.text>
          </>
        )}
      </svg>
    </motion.div>
  );
}
