'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  open?: boolean;
  scrollY?: number;
}

export function RobotMascot({ size = 64, open = false, scrollY = 0 }: Props) {
  const s = size;
  const rotY = open ? 0 : (scrollY * 0.08) % 360;
  const rotX = open ? 0 : Math.sin(scrollY * 0.003) * 14;

  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: s,
        height: s,
        transform: `perspective(300px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
        transition: open ? 'transform 0.5s ease' : 'transform 0.1s linear',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 100 110"
        xmlns="http://www.w3.org/2000/svg"
        width={s}
        height={s}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="rm-head" cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ff8fab" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#7f1d32" />
          </radialGradient>
          <radialGradient id="rm-body" cx="30%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="55%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>
          <radialGradient id="rm-arm" cx="35%" cy="25%" r="65%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>
          <linearGradient id="rm-visor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>
          <filter id="rm-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="rm-eye-l" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="60%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
          <radialGradient id="rm-eye-r" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="60%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
        </defs>

        {/* Antenna base */}
        <rect x="47" y="5" width="6" height="12" rx="3" fill="#be123c" />
        {/* Antenna glow ball */}
        <circle cx="50" cy="4" r="4.5" fill="#fb7185" filter="url(#rm-glow)">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="r" values="4.5;5.5;4.5" dur="1.4s" repeatCount="indefinite" />
        </circle>

        {/* Head */}
        <rect x="21" y="17" width="58" height="40" rx="13" fill="url(#rm-head)" />
        {/* Head highlight */}
        <ellipse cx="38" cy="24" rx="14" ry="5" fill="white" opacity="0.15" />
        {/* Head side shadow */}
        <rect x="64" y="22" width="12" height="30" rx="6" fill="black" opacity="0.12" />

        {/* Visor / screen */}
        <rect x="27" y="24" width="46" height="25" rx="8" fill="url(#rm-visor)" />
        {/* Visor reflection line */}
        <rect x="29" y="25.5" width="42" height="2" rx="1" fill="white" opacity="0.08" />

        {/* Left eye */}
        <circle cx="39" cy="36" r="6.5" fill="url(#rm-eye-l)" filter="url(#rm-glow)" />
        <circle cx="40.5" cy="34.5" r="2" fill="white" opacity="0.6" />
        <circle cx="39" cy="36" r="2.5" fill="#001c38" />
        <circle cx="37.8" cy="34.8" r="0.9" fill="white" opacity="0.8" />
        {/* Eye blink */}
        <rect x="32.5" y="33.5" width="13" height="0" rx="2" fill="url(#rm-visor)" opacity="0">
          <animate attributeName="height" values="0;5;0" dur="4s" begin="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="4s" begin="2s" repeatCount="indefinite" />
        </rect>

        {/* Right eye */}
        <circle cx="61" cy="36" r="6.5" fill="url(#rm-eye-r)" filter="url(#rm-glow)" />
        <circle cx="62.5" cy="34.5" r="2" fill="white" opacity="0.6" />
        <circle cx="61" cy="36" r="2.5" fill="#001c38" />
        <circle cx="59.8" cy="34.8" r="0.9" fill="white" opacity="0.8" />
        <rect x="54.5" y="33.5" width="13" height="0" rx="2" fill="url(#rm-visor)" opacity="0">
          <animate attributeName="height" values="0;5;0" dur="4s" begin="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="4s" begin="2s" repeatCount="indefinite" />
        </rect>

        {/* Mouth / status bar */}
        <rect x="35" y="45" width="30" height="3" rx="1.5" fill="white" opacity="0.12" />
        <rect x="35" y="45" width="0" height="3" rx="1.5" fill="#38bdf8" opacity="0.7">
          <animate attributeName="width" values="0;30;0" dur="2.5s" repeatCount="indefinite" />
        </rect>

        {/* Ears */}
        <rect x="15" y="27" width="8" height="20" rx="4" fill="url(#rm-arm)" />
        <rect x="77" y="27" width="8" height="20" rx="4" fill="url(#rm-arm)" />

        {/* Neck */}
        <rect x="43" y="57" width="14" height="6" rx="3" fill="#be123c" />

        {/* Body */}
        <rect x="17" y="63" width="66" height="44" rx="14" fill="url(#rm-body)" />
        {/* Body highlight */}
        <ellipse cx="36" cy="70" rx="14" ry="5" fill="white" opacity="0.12" />
        {/* Body right shadow */}
        <rect x="67" y="68" width="12" height="35" rx="6" fill="black" opacity="0.1" />

        {/* Chest panel */}
        <rect x="27" y="70" width="46" height="30" rx="9" fill="rgba(0,0,0,0.28)" />
        <rect x="29" y="72" width="42" height="1.5" rx="0.75" fill="white" opacity="0.1" />

        {/* Power/status dots */}
        <circle cx="36" cy="79" r="3.5" fill="#f43f5e">
          <animate attributeName="opacity" values="1;0.4;1" dur="0.9s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="79" r="3.5" fill="#a78bfa">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="64" cy="79" r="3.5" fill="#34d399">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.7s" repeatCount="indefinite" />
        </circle>

        {/* Panel progress bar */}
        <rect x="32" y="87" width="36" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
        <rect x="32" y="87" width="0" height="5" rx="2.5" fill="#fb7185" opacity="0.8">
          <animate attributeName="width" values="0;36;0" dur="3s" repeatCount="indefinite" />
        </rect>

        {/* Panel wave indicator */}
        <polyline
          points="31,97 35,93 39,98 43,91 47,96 51,93 55,97 59,92 63,96 67,93 69,97"
          fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Arms */}
        <rect x="3" y="65" width="14" height="34" rx="7" fill="url(#rm-arm)">
          <animateTransform attributeName="transform" type="rotate"
            values="0 10 65;8 10 65;0 10 65;-4 10 65;0 10 65"
            dur="5s" repeatCount="indefinite" />
        </rect>
        <rect x="83" y="65" width="14" height="34" rx="7" fill="url(#rm-arm)">
          <animateTransform attributeName="transform" type="rotate"
            values="0 90 65;-8 90 65;0 90 65;4 90 65;0 90 65"
            dur="5s" repeatCount="indefinite" />
        </rect>

        {/* Hands */}
        <circle cx="10" cy="101" r="6" fill="url(#rm-arm)" />
        <circle cx="90" cy="101" r="6" fill="url(#rm-arm)" />
        <circle cx="8.5" cy="99.5" r="1.5" fill="white" opacity="0.2" />
        <circle cx="88.5" cy="99.5" r="1.5" fill="white" opacity="0.2" />

        {/* Legs / base */}
        <rect x="32" y="107" width="14" height="3" rx="1.5" fill="#be123c" />
        <rect x="54" y="107" width="14" height="3" rx="1.5" fill="#be123c" />
      </svg>
    </motion.div>
  );
}
