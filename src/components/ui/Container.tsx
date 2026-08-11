import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

type ContainerProps = ComponentPropsWithoutRef<'div'>;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-(--container-content) px-4 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    />
  );
}
