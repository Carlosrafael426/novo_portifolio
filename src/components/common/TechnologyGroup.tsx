import { Hexagon } from 'lucide-react';
import { SiGit, SiNodedotjs, SiPostgresql, SiReact } from 'react-icons/si';
import type { Technology, TechnologyCategory } from '@/types/technology';
import { TechnologyCard } from '@/components/common/TechnologyCard';
import type { IconComponent } from '@/components/common/TechnologyCard';

const categoryLabels: Record<TechnologyCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  infrastructure: 'Tools & Infra',
};

/** Ícone oficial da tecnologia mais representativa de cada categoria, não mais um ícone
 *  genérico — mesmo critério do resto da stack (Simple Icons). */
const categoryIcons: Record<TechnologyCategory, IconComponent> = {
  frontend: SiReact,
  backend: SiNodedotjs,
  database: SiPostgresql,
  infrastructure: SiGit,
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
