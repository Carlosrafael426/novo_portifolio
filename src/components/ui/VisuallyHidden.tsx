import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

type VisuallyHiddenProps = ComponentPropsWithoutRef<'span'>;

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return <span className={cn('sr-only', className)} {...props} />;
}
