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
 * sozinho não desenha borda ao longo da diagonal cortada. Por cima, um pulso neon percorre esse
 * mesmo contorno via `offset-path` — mesma linguagem visual do pulso que viaja pelas linhas do
 * fundo do Hero (base contínua discreta + trecho brilhante em movimento), não um ponto isolado.
 */
export function ClippedPanel({ corners = 'all', cut = 20, wrapperClassName, className, children }: ClippedPanelProps) {
  const clip = clipPolygon(corners, cut);

  return (
    <div className={cn('relative', wrapperClassName)}>
      <div className="bg-accent/40 p-px" style={{ clipPath: clip }}>
        <div className={cn('bg-background', className)} style={{ clipPath: clip }}>
          {children}
        </div>
      </div>
      {/* Fora da camada com clip-path — assim o brilho do pulso não é cortado pelo contorno e
          aparece pros dois lados da borda (pra dentro e pra fora). */}
      <div
        aria-hidden="true"
        className="animate-border-travel motion-reduce:animate-none pointer-events-none absolute inset-0"
        style={{ offsetPath: clip, offsetAnchor: '0 0', offsetRotate: 'auto', offsetDistance: '0%' }}
      >
        <span className="via-accent absolute h-px w-12 -translate-x-1/2 -translate-y-1/2 bg-linear-to-r from-transparent to-transparent shadow-[0_0_6px_1px_rgba(198,255,69,0.9),0_0_18px_6px_rgba(198,255,69,0.45)]" />
      </div>
    </div>
  );
}
