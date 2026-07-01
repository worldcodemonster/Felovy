'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
}

export function Loading({ text, size = 'md', fullPage = false, className }: LoadingProps) {
  const iconSize = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-10 w-10' }[size];
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage ? 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm' : 'py-14',
        className,
      )}
    >
      <Loader2 className={cn(iconSize, 'animate-spin text-felovy-red')} />
      {text && (
        <p className={cn(textSize, 'text-gray-400 font-medium tracking-wide')}>{text}</p>
      )}
    </div>
  );
}
