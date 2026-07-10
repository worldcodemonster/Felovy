import { FelovyLogo } from '@/components/shared/FelovyLogo';
import { cn } from '@/lib/utils';

interface GrowingLeavesIllustrationProps {
  className?: string;
  size?: number;
}

/** Full badge illustration — profile / growth empty states. */
export function GrowingLeavesIllustration({
  className,
  size = 160,
}: GrowingLeavesIllustrationProps) {
  return <FelovyLogo variant="badge" size={size} className={cn('pointer-events-none', className)} />;
}
