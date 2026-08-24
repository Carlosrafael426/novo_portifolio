import { Database, Hexagon, Monitor, Server, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Technology, TechnologyCategory } from '@/types/technology';
import { TechnologyCard } from '@/components/common/TechnologyCard';

const categoryLabels: Record<TechnologyCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  infrastructure: 'Tools & Infra',
};

/** Ícone universal da categoria, não de uma ferramenta específica — a marca de cada tecnologia
 *  já aparece na linha dela mesma, na lista abaixo. */
const categoryIcons: Record<TechnologyCategory, LucideIcon> = {
  frontend: Monitor,
  backend: Server,
  database: Database,
  infrastructure: Wrench,
};

const ROW_FILL_STAGGER_MS = 80;

interface TechnologyGroupProps {
  category: TechnologyCategory;
  technologies: Technology[];
  /** Se o card já começou a aparecer (herdado do Stack) — as barras só enchem depois disso. */
  revealed: boolean;
  /** Quando o card termina de deslizar pro lugar — as barras começam a encher a partir daqui. */
  startDelayMs: number;
  reducedMotion: boolean;
}

export function TechnologyGroup({
  category,
  technologies,
  revealed,
  startDelayMs,
  reducedMotion,
}: TechnologyGroupProps) {
  const Icon = categoryIcons[category];

  return (
    <div className="border-border bg-card hover:border-accent/60 rounded-lg border p-6 transition-colors duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Hexagon
            aria-hidden="true"
            strokeWidth={1}
            className="text-accent/70 animate-hex-spin motion-reduce:animate-none absolute inset-0 h-full w-full"
          />
          <Icon
            aria-hidden="true"
            strokeWidth={1.5}
            size={22}
            className="text-accent animate-system-pulse motion-reduce:animate-none relative"
          />
        </div>
        <h3 className="font-display mt-3 text-sm font-normal tracking-[0.15em] uppercase">
          {categoryLabels[category]}
        </h3>
      </div>

      <ul className="mt-5">
        {technologies.map((technology, index) => (
          <TechnologyCard
            key={technology.id}
            technology={technology}
            revealed={revealed}
            fillDelayMs={startDelayMs + index * ROW_FILL_STAGGER_MS}
            reducedMotion={reducedMotion}
          />
        ))}
      </ul>
    </div>
  );
}
