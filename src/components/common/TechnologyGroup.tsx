import type { Technology, TechnologyCategory } from '@/types/technology';
import { TechnologyCard } from '@/components/common/TechnologyCard';

const categoryLabels: Record<TechnologyCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  infrastructure: 'Tools & Infra',
};

interface TechnologyGroupProps {
  category: TechnologyCategory;
  technologies: Technology[];
}

export function TechnologyGroup({ category, technologies }: TechnologyGroupProps) {
  return (
    <div>
      <h3 className="text-accent font-mono text-xs tracking-[0.15em] uppercase">
        {categoryLabels[category]}
      </h3>
      <ul className="mt-4 space-y-2">
        {technologies.map((technology) => (
          <TechnologyCard key={technology.id} technology={technology} />
        ))}
      </ul>
    </div>
  );
}
