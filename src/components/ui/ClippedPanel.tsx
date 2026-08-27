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

/** Polígono responsivo (mistura % e px) — usado só como fallback pro clip-path do conteúdo antes
 *  do ResizeObserver medir o painel pela primeira vez (evita um frame sem recorte nenhum). */
function clipPolygonFallback(corners: ClippedCorners, cut: number): string {
  if (corners === 'opposite') {
    return `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`;
  }
  return `polygon(${cut}px 0, calc(100% - ${cut}px) 0, 100% ${cut}px, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, ${cut}px 100%, 0 calc(100% - ${cut}px), 0 ${cut}px)`;
}

/** Os vértices do contorno cortado, em px absolutos a partir do tamanho medido do painel — usados
 *  tanto pro clip-path do conteúdo quanto pro `points` do SVG da borda e pro `offset-path` do
 *  pulso, sempre a partir da mesma fonte (evita qualquer desalinhamento entre eles). */
function cornerPoints(corners: ClippedCorners, cut: number, width: number, height: number): [number, number][] {
  if (corners === 'opposite') {
    return [
      [cut, 0],
      [width, 0],
      [width, height - cut],
      [width - cut, height],
      [0, height],
      [0, cut],
    ];
  }
  return [
    [cut, 0],
    [width - cut, 0],
    [width, cut],
    [width, height - cut],
    [width - cut, height],
    [cut, height],
    [0, height - cut],
    [0, cut],
  ];
}

/**
 * Painel com cantos cortados em diagonal (visual "HUD"/painel técnico). O recorte do conteúdo usa
 * `clip-path: polygon(...)` inline (nunca `url(#id)` — ver comentário abaixo), e a borda é
 * desenhada por cima com um `<svg><polygon>` com stroke, independente do clip-path do conteúdo —
 * técnica bem mais estável no Chromium que a original (duas camadas de `clip-path` sobrepostas com
 * 1px de padding, cujas bordas e cantos sumiam intermitentemente durante scroll/repaint). Por cima,
 * um pulso neon percorre o mesmo contorno via `offset-path`.
 */
export function ClippedPanel({
  corners = 'all',
  cut = 20,
  wrapperClassName,
  pulse = true,
  className,
  children,
}: ClippedPanelProps) {
  const fallbackClip = clipPolygonFallback(corners, cut);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const points = size ? cornerPoints(corners, cut, size.width, size.height) : null;
  const preciseClip = points ? `polygon(${points.map(([x, y]) => `${x}px ${y}px`).join(', ')})` : null;
  const pointsAttr = points ? points.map(([x, y]) => `${x},${y}`).join(' ') : '';

  return (
    <div ref={wrapperRef} className={cn('relative', wrapperClassName)}>
      <div
        className={cn('bg-background', className)}
        // `clip-path: polygon(...)` inline, não `url(#id)` referenciando um `<clipPath>` externo —
        // o Chromium tem bugs de invalidação de cache conhecidos em `clip-path: url()` sob
        // scroll/repaint (o recorte perde efeito por um frame, depois volta sozinho), que não
        // existem numa `polygon()` inline (forma estática, sem recurso SVG externo pra invalidar).
        style={{ clipPath: preciseClip ?? fallbackClip }}
      >
        {children}
      </div>

      {points && size ? (
        <svg
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 h-full w-full',
            pulse ? 'text-accent/80' : 'text-accent',
          )}
          // Sem `width`/`height` como atributos HTML: eles fixariam o tamanho intrínseco do SVG a
          // partir do `size` medido por JS (que pode ficar um frame desatualizado em relação ao
          // layout real). Como o SVG é um elemento substituído, isso faria sua caixa renderizada
          // ter o tamanho do último `size` medido — ficando ancorada em `inset-0` mas cortada nos
          // lados/embaixo sempre que o painel muda de tamanho e o state ainda não pegou o novo
          // valor. Com `w-full h-full` explícitos em CSS, a caixa acompanha o tamanho real do pai
          // sempre (nunca pode ficar dessincronizada); o `viewBox` só define a escala do sistema de
          // coordenadas interno, então mesmo se `size` estiver um pouco desatualizado o resultado é
          // um estiramento proporcional suave, nunca uma borda cortada.
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
          // Promove a borda pra sua própria camada de composição — sem isso ela pode ficar no
          // mesmo "layer" que elementos vizinhos e ser repintada errado junto com eles durante o
          // scroll (visto em teste com sampling de pixel real: a cor da borda some por um frame,
          // mesmo com o DOM/CSSOM reportando tudo certo — sintoma clássico de um bug de
          // composição de GPU, não um bug de CSS/layout).
          style={{ transform: 'translateZ(0)' }}
        >
          <polygon points={pointsAttr} fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      ) : null}

      {/* Fora da camada com clip-path — assim o brilho do pulso não é cortado pelo contorno e
          aparece pros dois lados da borda (pra dentro e pra fora). O elemento em si fica no
          tamanho de 1px (não do tamanho do painel): como `offset-rotate: auto` gira o próprio
          box pra acompanhar a direção do contorno, um box do tamanho do painel giraria e sua
          bounding box varreria bem além do painel (e da página) em certos pontos do percurso.
          Sem `offset-rotate` (nunca gira): nos cantos retos (não cortados, ex. `corners="opposite"`)
          a tangente muda de direção de forma abrupta e o Chromium chega a desenhar um frame com a
          rotação dessincronizada da posição — o pulso "sumia" bem no canto. Um brilho redondo (sem
          direção) não depende de rotação nenhuma, então não tem esse ponto de falha. */}
      {pulse && preciseClip ? (
        <div
          aria-hidden="true"
          className="animate-border-travel motion-reduce:animate-none pointer-events-none absolute top-0 left-0 h-px w-px"
          style={{
            offsetPath: preciseClip,
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
