import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

type BadgeProps = ComponentPropsWithoutRef<'span'>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'border-border text-muted inline-flex items-center rounded-md border px-3 py-1 font-mono text-xs tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  );
}
