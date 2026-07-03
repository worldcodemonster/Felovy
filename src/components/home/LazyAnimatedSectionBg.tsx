'use client';

import dynamic from 'next/dynamic';
import { LazyWhenVisible } from './LazyWhenVisible';
import type { BgVariant } from './AnimatedSectionBg';

const AnimatedSectionBg = dynamic(
  () => import('./AnimatedSectionBg').then((m) => ({ default: m.AnimatedSectionBg })),
  { ssr: false },
);

interface Props {
  variant: BgVariant;
  opacity?: number;
  color?: string;
  secondary?: string;
  className?: string;
}

export function LazyAnimatedSectionBg(props: Props) {
  return (
    <LazyWhenVisible rootMargin="300px 0px">
      <AnimatedSectionBg {...props} />
    </LazyWhenVisible>
  );
}
