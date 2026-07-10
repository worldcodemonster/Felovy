'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const BURST_COUNT = 6;

const burstAngles = Array.from({ length: BURST_COUNT }, (_, i) => (i * 360) / BURST_COUNT);

interface Props {
  isFavorited: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function FavoriteButton({ isFavorited, onToggle, size = 'sm', className }: Props) {
  const [burst, setBurst] = useState(false);

  const iconSize  = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const dotSize   = size === 'md' ? 8 : 6;
  const burstDist = size === 'md' ? 20 : 14;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isFavorited) setBurst(true);
    onToggle();
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.72 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={cn(
          'relative z-10 rounded-full transition-colors',
          size === 'md'
            ? 'p-2 hover:bg-green-50'
            : 'p-1 hover:bg-gray-100',
        )}
        aria-label={isFavorited ? 'Remove from saved' : 'Save job'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isFavorited ? (
            <motion.span
              key="filled"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.0, 1], opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.4, times: [0, 0.6, 1], ease: "easeOut" }}
              className="block"
            >
              <Heart className={cn(iconSize, 'fill-felovy-rose text-felovy-rose')} />
            </motion.span>
          ) : (
            <motion.span
              key="empty"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="block"
            >
              <Heart className={cn(iconSize, 'text-gray-300')} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Burst particles */}
      <AnimatePresence>
        {burst && burstAngles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const tx  = Math.cos(rad) * burstDist;
          const ty  = Math.sin(rad) * burstDist;
          return (
            <motion.span
              key={i}
              className="pointer-events-none absolute rounded-full bg-felovy-rose"
              style={{ width: dotSize, height: dotSize, top: '50%', left: '50%', marginTop: -dotSize / 2, marginLeft: -dotSize / 2 }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
              transition={{ duration: 0.42, ease: 'easeOut', delay: i * 0.015 }}
              onAnimationComplete={() => { if (i === BURST_COUNT - 1) setBurst(false); }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

