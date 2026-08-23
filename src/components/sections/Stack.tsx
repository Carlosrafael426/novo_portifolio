import { useState } from 'react';
import { Section } from '@/components/ui/Section';
import { TechnologyGroup } from '@/components/common/TechnologyGroup';
import { technologies } from '@/data/technologies';
import { groupBy } from '@/utils/groupBy';
import { useInView } from '@/hooks/useInView';
import type { TechnologyCategory } from '@/types/technology';

const categoryOrder: TechnologyCategory[] = ['frontend', 'backend', 'database', 'infrastructure'];

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface TitleConnectorProps {
  inView: boolean;
}

/** Traço decorativo tipo trilha de circuito, saindo do título — desenha a si mesmo quando a
 *  seção entra na viewport, em vez de animar escondido acima da dobra. */
function TitleConnector({ inView }: TitleConnectorProps) {
  const [reducedMotion] = useState(prefersReducedMotion);
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
          transition: reducedMotion ? 'none' : 'stroke-dashoffset 1s ease-out 0.2s',
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
          transition: reducedMotion ? 'none' : 'opacity 0.4s ease-out 1s',
        }}
      />
    </svg>
  );
}

export function Stack() {
  const grouped = groupBy(technologies, (technology) => technology.category);
  // Gatilho no próprio grid, não no subtítulo lá em cima — numa seção bem mais alta que a tela
  // (caso do mobile, com os 4 cards empilhados), o subtítulo já saiu de vista antes dos cards
  // aparecerem, e a revelação nunca disparava. Threshold baixo: o card já visível não deve
  // esperar boa parte do grid (bem alto) entrar pra começar a animar.
  const { ref, inView } = useInView<HTMLDivElement>(0.05);

  return (
    <Section
      id="stack"
      eyebrow="03 / Stack"
      title={
        <span className="flex flex-wrap items-center gap-4">
          <span>As tecnologias</span>
          <TitleConnector inView={inView} />
        </span>
      }
    >
      <div className="flex gap-4">
        <span aria-hidden="true" className="bg-accent w-0.5 shrink-0 self-stretch" />
        <p className="text-muted max-w-xl text-sm">
          Ferramentas e tecnologias que utilizo para construir soluções modernas, escaláveis e
          eficientes.
        </p>
      </div>

      <div ref={ref} className="mt-8 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {categoryOrder.map((category, index) => (
          <div
            key={category}
            className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
              inView ? 'opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={{ transitionDelay: inView ? `${index * 120}ms` : '0ms' }}
          >
            <TechnologyGroup category={category} technologies={grouped[category] ?? []} />
          </div>
        ))}
      </div>
    </Section>
  );
}
