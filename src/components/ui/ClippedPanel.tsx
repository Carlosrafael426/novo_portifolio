import { useEffect, useRef, useState } from 'react';
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
  /** Pulso neon que percorre o contorno — ligado por padrão, desligável quando muitos painéis
   *  juntos (ex: um grid de cards) ficam visualmente carregados com todos pulsando ao mesmo tempo. */
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}

/** Polígono responsivo (mistura % e px) — usado no clip-path das duas camadas, que já são do
 *  tamanho do próprio painel, então a resolução em % é sempre correta pra elas. */
function clipPolygon(corners: ClippedCorners, cut: number): string {
  if (corners === 'opposite') {
    return `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`;
  }
  return `polygon(${cut}px 0, calc(100% - ${cut}px) 0, 100% ${cut}px, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, ${cut}px 100%, 0 calc(100% - ${cut}px), 0 ${cut}px)`;
}

/** Mesmo polígono, mas em px absolutos a partir do tamanho medido do painel — necessário pro
 *  offset-path do pulso, cujo elemento precisa ser pequeno (não do tamanho do painel), então não
 *  pode depender de "%" resolvendo contra o próprio box dele. */
function clipPolygonPx(corners: ClippedCorners, cut: number, width: number, height: number): string {
  if (corners === 'opposite') {
    return `polygon(${cut}px 0, ${width}px 0, ${width}px ${height - cut}px, ${width - cut}px ${height}px, 0 ${height}px, 0 ${cut}px)`;
  }
  return `polygon(${cut}px 0, ${width - cut}px 0, ${width}px ${cut}px, ${width}px ${height - cut}px, ${width - cut}px ${height}px, ${cut}px ${height}px, 0 ${height - cut}px, 0 ${cut}px)`;
}

/**
 * Painel com cantos cortados em diagonal (visual "HUD"/painel técnico) — a borda de 1px vem de
 * duas camadas recortadas com o mesmo polígono (a de fora um pouco maior), já que `clip-path`
 * sozinho não desenha borda ao longo da diagonal cortada. Por cima, um pulso neon percorre esse
 * mesmo contorno via `offset-path` — mesma linguagem visual do pulso que viaja pelas linhas do
 * fundo do Hero (base contínua discreta + trecho brilhante em movimento), não um ponto isolado.
 */
export function ClippedPanel({
  corners = 'all',
  cut = 20,
  wrapperClassName,
  pulse = true,
  className,
  children,
}: ClippedPanelProps) {
  const clip = clipPolygon(corners, cut);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!pulse) return;

    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [pulse]);

  return (
    <div ref={wrapperRef} className={cn('relative', wrapperClassName)}>
      <div className={cn('p-px', pulse ? 'bg-accent/40' : 'bg-accent')} style={{ clipPath: clip }}>
        <div className={cn('bg-background', className)} style={{ clipPath: clip }}>
          {children}
        </div>
      </div>
      {/* Fora da camada com clip-path — assim o brilho do pulso não é cortado pelo contorno e
          aparece pros dois lados da borda (pra dentro e pra fora). O elemento em si fica no
          tamanho de 1px (não do tamanho do painel): como `offset-rotate: auto` gira o próprio
          box pra acompanhar a direção do contorno, um box do tamanho do painel giraria e sua
          bounding box varreria bem além do painel (e da página) em certos pontos do percurso.
          Sem `offset-rotate` (nunca gira): nos cantos retos (não cortados, ex. `corners="opposite"`)
          a tangente muda de direção de forma abrupta e o Chromium chega a desenhar um frame com a
          rotação dessincronizada da posição — o pulso "sumia" bem no canto. Um brilho redondo (sem
          direção) não depende de rotação nenhuma, então não tem esse ponto de falha. */}
      {pulse && size ? (
        <div
          aria-hidden="true"
          className="animate-border-travel motion-reduce:animate-none pointer-events-none absolute top-0 left-0 h-px w-px"
          style={{
            offsetPath: clipPolygonPx(corners, cut, size.width, size.height),
            offsetAnchor: '0 0',
            offsetDistance: '0%',
          }}
        >
          <span className="bg-accent absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[3px] shadow-[0_0_6px_1px_rgba(198,255,69,0.9),0_0_18px_6px_rgba(198,255,69,0.45)]" />
        </div>
      ) : null}
    </div>
  );
}
