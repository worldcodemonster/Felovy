import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface FelovyLogoProps {
  className?: string;
  size?: number;
  /** Kept for API compatibility — same asset for both variants. */
  variant?: 'mark' | 'badge';
}

const LOGO_SRC = '/logo.png';

/** Felovy logo — user's hand-drawn leaf artwork. */
export function FelovyLogo({
  className,
  size = 32,
}: FelovyLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn('select-none shrink-0 object-contain', className)}
      priority={size >= 48}
    />
  );
}

export { LOGO_SRC as FELOVY_LOGO_SRC };
