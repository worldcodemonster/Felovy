import Link from 'next/link';
import { STORYSET_ATTRIBUTION_URL } from '@/lib/storyset';
import { cn } from '@/lib/utils';

interface StorysetAttributionProps {
  className?: string;
  /** inline = single line; block = centered paragraph */
  variant?: 'inline' | 'block';
}

export function StorysetAttribution({ className, variant = 'inline' }: StorysetAttributionProps) {
  const link = (
    <Link
      href={STORYSET_ATTRIBUTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-gray-600 transition-colors"
    >
      Storyset
    </Link>
  );

  if (variant === 'block') {
    return (
      <p className={cn('text-center text-xs text-gray-400', className)}>
        Illustrations by {link}
      </p>
    );
  }

  return (
    <span className={cn('text-xs text-gray-400', className)}>
      Illustrations by {link}
    </span>
  );
}
