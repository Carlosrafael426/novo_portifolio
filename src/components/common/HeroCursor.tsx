import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { cn } from '@/utils/cn';

interface HeroCursorProps {
  /** Elemento cujo pointermove é observado — escopa o cursor customizado só ao Hero. */
  containerRef: RefObject<HTMLElement | null>;
}

function isFinePointer(): boolean {
  return window.matchMedia('(pointer: fine)').matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Cursor customizado, escopo só Hero. Regra de segurança: o cursor nativo só é escondido
 * (classe `cursor-none` no container) depois que este componente confirma que está de fato
 * recebendo pointermove — nunca incondicionalmente, pra nunca deixar o usuário sem cursor.
 */
export function HeroCursor({ containerRef }: HeroCursorProps) {
  const [enabled] = useState(() => isFinePointer() && !prefersReducedMotion());
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const dotRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 });
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    function handleMove(event: PointerEvent) {
      position.current = { x: event.clientX, y: event.clientY };
      setReady((current) => current || true);

      const target = event.target instanceof Element ? event.target.closest('[data-cursor]') : null;
      const nextLabel = target?.getAttribute('data-cursor') || null;
      setLabel((current) => (current === nextLabel ? current : nextLabel));
    }

    function handleLeave() {
      setLabel(null);
    }

    container.addEventListener('pointermove', handleMove);
    container.addEventListener('pointerleave', handleLeave);

    function loop() {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
      }
      frame.current = requestAnimationFrame(loop);
    }
    frame.current = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener('pointermove', handleMove);
      container.removeEventListener('pointerleave', handleLeave);
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [enabled, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || !ready) return;

    container.classList.add('cursor-none');
    return () => container.classList.remove('cursor-none');
  }, [enabled, ready, containerRef]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-(--z-hero-intro-overlay) -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <div
        className={cn(
          'bg-accent flex items-center justify-center rounded-full transition-[width,height] duration-200',
          label ? 'size-14' : 'size-2',
        )}
      >
        {label ? (
          <span className="text-accent-foreground font-mono text-[10px] tracking-wide uppercase">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
