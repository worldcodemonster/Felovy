import { cn } from '@/lib/utils';
import { PORTRAIT_NEUTRAL_GRAD } from '@/lib/developer-carousel';

/** Colorful bottom gradient — matches home DeveloperCarousel cards. */
export function DeveloperPortraitColorGrad({
  grad,
  className,
}: {
  grad: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t opacity-90',
        grad,
        'to-transparent',
        className,
      )}
    />
  );
}

/** Black & white bottom gradient for list cards at rest. */
export function DeveloperPortraitNeutralGrad({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent opacity-100',
        PORTRAIT_NEUTRAL_GRAD,
        className,
      )}
    />
  );
}

/** Text readability scrim — shared by carousel and list cards. */
export function DeveloperPortraitTextScrim() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
  );
}
