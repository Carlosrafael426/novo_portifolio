import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Section } from '@/components/ui/Section';
import { TechnologyGroup } from '@/components/common/TechnologyGroup';
import { technologies } from '@/data/technologies';
import { groupBy } from '@/utils/groupBy';
import { useInView } from '@/hooks/useInView';
import type { TechnologyCategory } from '@/types/technology';

const categoryOrder: TechnologyCategory[] = ['frontend', 'backend', 'database', 'infrastructure'];

// Ordem pedida: frontend de cima, backend de baixo, database de cima, tools de baixo.
const cardDirection: Record<TechnologyCategory, 'up' | 'down'> = {
  frontend: 'up',
  backend: 'down',
  database: 'up',
  infrastructure: 'down',
};

const TITLE_TEXT = 'As tecnologias';
const LETTER_STAGGER_MS = 35;
const LETTER_DURATION_MS = 320;
// A frase some depois que a última letra termina de entrar.
const TITLE_TOTAL_MS = (TITLE_TEXT.length - 1) * LETTER_STAGGER_MS + LETTER_DURATION_MS;
const SUBTITLE_DELAY_MS = TITLE_TOTAL_MS + 150;
const SUBTITLE_DURATION_MS = 600;
// Os cards só começam depois que título + subtítulo terminam de entrar — "em seguida", não junto.
const HEADER_SEQUENCE_MS = SUBTITLE_DELAY_MS + SUBTITLE_DURATION_MS;
const CARD_STAGGER_MS = 160;
const CARD_DURATION_MS = 650;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Opacidade + transform reveal com timing controlado via JS — não dá pra confiar em variantes
 *  motion-reduce: aqui porque o transform/opacity já vem por style inline (que sempre vence a
 *  classe), então prefers-reduced-motion precisa zerar os próprios valores, não só a classe. */
function revealStyle(
  visible: boolean,
  hiddenTransform: string,
  duration: number,
  delayMs: number,
  reducedMotion: boolean,
): CSSProperties {
  const shown = reducedMotion || visible;
  return {
    opacity: shown ? 1 : 0,
    transform: shown ? 'translate(0, 0)' : hiddenTransform,
    transition: reducedMotion ? 'none' : `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
    transitionDelay: reducedMotion ? '0ms' : `${delayMs}ms`,
  };
}

interface AnimatedTitleProps {
  inView: boolean;
  reducedMotion: boolean;
}

/** "As tecnologias" surge letra por letra, da esquerda pra direita. */
function AnimatedTitle({ inView, reducedMotion }: AnimatedTitleProps) {
  const shown = reducedMotion || inView;

  return (
    <span aria-label={TITLE_TEXT}>
      {TITLE_TEXT.split('').map((char, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="inline-block"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateY(0)' : 'translateY(0.35em)',
            transition: reducedMotion ? 'none' : `opacity ${LETTER_DURATION_MS}ms ease-out, transform ${LETTER_DURATION_MS}ms ease-out`,
            transitionDelay: reducedMotion ? '0ms' : `${index * LETTER_STAGGER_MS}ms`,
          }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}

interface TitleConnectorProps {
  inView: boolean;
  reducedMotion: boolean;
}

/** Traço decorativo tipo trilha de circuito, saindo do título — desenha a si mesmo depois que
 *  o título termina de aparecer, em vez de animar escondido acima da dobra. */
function TitleConnector({ inView, reducedMotion }: TitleConnectorProps) {
  const draw = reducedMotion || inView;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 24"
      className="text-accent/50 hidden h-6 min-w-24 flex-1 sm:block"
    >
      <path
        d="M0 12H96L112 20H148"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="220"
        style={{
          strokeDashoffset: draw ? 0 : 220,
          transition: reducedMotion ? 'none' : `stroke-dashoffset 700ms ease-out ${TITLE_TOTAL_MS}ms`,
        }}
      />
      <circle
        cx="154"
        cy="20"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        style={{
          opacity: draw ? 1 : 0,
          transition: reducedMotion ? 'none' : `opacity 400ms ease-out ${TITLE_TOTAL_MS + 500}ms`,
        }}
      />
    </svg>
  );
}

export function Stack() {
  const grouped = groupBy(technologies, (technology) => technology.category);
  const [reducedMotion] = useState(prefersReducedMotion);
  // O cabeçalho (título/traço/subtítulo) e o grid disparam a revelação de forma independente:
  // numa seção bem mais alta que a tela (4 cards empilhados no mobile), o cabeçalho já teria
  // saído de vista antes do grid entrar, então um gatilho só no grid nunca revelaria o texto.
  const { ref: headerRef, inView: headerInView } = useInView<HTMLDivElement>();
  const { ref: gridRef, inView: gridInView } = useInView<HTMLDivElement>(0.05);

  return (
    <Section
      id="stack"
      eyebrow="03 / Stack"
      title={
        <span className="flex flex-wrap items-center gap-4">
          <AnimatedTitle inView={headerInView} reducedMotion={reducedMotion} />
          <TitleConnector inView={headerInView} reducedMotion={reducedMotion} />
        </span>
      }
    >
      <div ref={headerRef} className="flex gap-4">
        <span aria-hidden="true" className="bg-accent w-0.5 shrink-0 self-stretch" />
        <p
          className="text-muted max-w-xl text-sm"
          style={revealStyle(headerInView, 'translate(2rem, 0)', SUBTITLE_DURATION_MS, SUBTITLE_DELAY_MS, reducedMotion)}
        >
          Ferramentas e tecnologias que utilizo para construir soluções modernas, escaláveis e
          eficientes.
        </p>
      </div>

      <div ref={gridRef} className="mt-8 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {categoryOrder.map((category, index) => {
          const hidden = cardDirection[category] === 'up' ? 'translate(0, -2rem)' : 'translate(0, 2rem)';
          // Se o cabeçalho já disparou (caso normal), os cards esperam a sequência dele terminar
          // antes de começar a própria — "em seguida", não ao mesmo tempo. Se só o grid disparou
          // (cabeçalho nunca chegou a ficar visível, ex: um pulo direto de scroll), os cards não
          // ficam presos esperando uma sequência que nunca vai rodar.
          const delay = (headerInView ? HEADER_SEQUENCE_MS : 0) + index * CARD_STAGGER_MS;
          const revealed = headerInView || gridInView;

          return (
            <div key={category} style={revealStyle(revealed, hidden, CARD_DURATION_MS, delay, reducedMotion)}>
              <TechnologyGroup
                category={category}
                technologies={grouped[category] ?? []}
                revealed={revealed}
                startDelayMs={delay + CARD_DURATION_MS}
                reducedMotion={reducedMotion}
              />
            </div>
          );
        })}
      </div>
    </Section>
  );
}
