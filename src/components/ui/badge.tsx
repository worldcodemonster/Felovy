import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-felovy-ink bg-felovy-light text-felovy-ink',
        secondary: 'border border-felovy-ink bg-white text-felovy-ink',
        destructive: 'border border-felovy-ink bg-destructive text-destructive-foreground',
        outline: 'border border-felovy-ink text-felovy-ink bg-white',
        success: 'border border-felovy-ink bg-green-100 text-green-800',
        warning: 'border border-felovy-ink bg-yellow-100 text-yellow-900',
        purple: 'border border-felovy-ink bg-purple-100 text-purple-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
