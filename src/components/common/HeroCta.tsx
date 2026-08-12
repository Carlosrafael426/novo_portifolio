import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface HeroCtaProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

/**
 * CTA bespoke — texto + linha, sem o Button pill do design system.
 * A linha cresce a partir da origem no hover/:focus-visible; o texto desloca poucos pixels.
 */
export function HeroCta({ children, variant = 'primary', className, ...props }: HeroCtaProps) {
  return (
    <a
      {...props}
      className={cn(
        'group relative inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase',
        'outline-none transition-transform duration-300 hover:translate-x-1 focus-visible:translate-x-1',
        'focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-4',
        variant === 'primary'
          ? 'text-foreground'
          : 'text-muted hover:text-foreground focus-visible:text-foreground',
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="bg-accent absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </a>
  );
}
