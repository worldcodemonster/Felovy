import {
  STORYSET_ILLUSTRATIONS,
  type StorysetIllustrationName,
} from '@/lib/storyset';
import { cn } from '@/lib/utils';

interface IllustrationProps {
  name: StorysetIllustrationName;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Illustration({
  name,
  className,
  width = 320,
  height = 240,
  priority = false,
}: IllustrationProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={STORYSET_ILLUSTRATIONS[name]}
      alt=""
      width={width}
      height={height}
      aria-hidden
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('select-none pointer-events-none', className)}
    />
  );
}
