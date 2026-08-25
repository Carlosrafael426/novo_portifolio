import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type ClippedCorners = 'all' | 'opposite';

interface ClippedPanelProps {
  /** "all" corta os 4 cantos igualmente; "opposite" só o superior-esquerdo e o inferior-direito. */
  corners?: ClippedCorners;
  /** Tamanho do corte, em px. */
  cut?: number;
  /** Classes na camada externa (a cor da borda) — usar para margin/posicionamento do painel inteiro. */
  wrapperClassName?: string;
  className?: string;
  children: ReactNode;
}

function clipPolygon(corners: ClippedCorners, cut: number): string {
  if (corners === 'opposite') {
    return `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`;
  }
  return `polygon(${cut}px 0, calc(100% - ${cut}px) 0, 100% ${cut}px, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, ${cut}px 100%, 0 calc(100% - ${cut}px), 0 ${cut}px)`;
}

/**
 * Painel com cantos cortados em diagonal (visual "HUD"/painel técnico) — a borda de 1px vem de
 * duas camadas recortadas com o mesmo polígono (a de fora um pouco maior), já que `clip-path`
 * sozinho não desenha borda ao longo da diagonal cortada. Um ponto neon percorre esse mesmo
 * contorno via `offset-path` (mesmo polígono usado no clip-path).
 */
export function ClippedPanel({ corners = 'all', cut = 20, wrapperClassName, className, children }: ClippedPanelProps) {
  const clip = clipPolygon(corners, cut);

  return (
    <div className={cn('bg-accent relative p-px', wrapperClassName)} style={{ clipPath: clip }}>
      <div className={cn('bg-background', className)} style={{ clipPath: clip }}>
        {children}
      </div>
      <div
        aria-hidden="true"
        className="animate-border-travel motion-reduce:animate-none pointer-events-none absolute inset-0"
        style={{ offsetPath: clip, offsetAnchor: '0 0', offsetDistance: '0%' }}
      >
        <span className="bg-accent shadow-[0_0_6px_2px_var(--color-accent)] absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>
    </div>
  );
}
