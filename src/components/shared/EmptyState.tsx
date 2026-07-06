import { type ReactNode } from 'react';
import { Illustration } from '@/components/shared/Illustration';
import { type IllustrationName } from '@/lib/illustrations';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  illustration,
  title,
  description,
  children,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-12 px-4', className)}>
      <Illustration
        name={illustration}
        className={cn('h-auto mb-5 opacity-95', compact ? 'w-36' : 'w-48')}
        width={compact ? 144 : 192}
        height={compact ? 108 : 144}
      />
      <p className={cn('font-semibold text-gray-600', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
