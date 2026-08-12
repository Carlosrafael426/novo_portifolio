import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

/** Canto inferior esquerdo do Hero — some no primeiro scroll do usuário. */
export function ScrollIndicator() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setDismissed(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'text-muted flex flex-col items-start gap-3 font-mono text-[10px] tracking-[0.15em] uppercase transition-opacity duration-500',
        dismissed && 'opacity-0',
      )}
    >
      <span>Role para explorar</span>
      <span className="bg-border relative h-10 w-px overflow-hidden">
        <span className="bg-accent animate-scroll-hint absolute inset-x-0 top-0 h-1/2" />
      </span>
    </div>
  );
}
