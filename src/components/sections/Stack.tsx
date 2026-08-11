import { Section } from '@/components/ui/Section';
import { TechnologyGroup } from '@/components/common/TechnologyGroup';
import { technologies } from '@/data/technologies';
import { groupBy } from '@/utils/groupBy';
import type { TechnologyCategory } from '@/types/technology';

const categoryOrder: TechnologyCategory[] = ['frontend', 'backend', 'database', 'infrastructure'];

export function Stack() {
  const grouped = groupBy(technologies, (technology) => technology.category);

  return (
    <Section id="stack" eyebrow="03 / Stack" title="As tecnologias">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {categoryOrder.map((category) => (
          <TechnologyGroup
            key={category}
            category={category}
            technologies={grouped[category] ?? []}
          />
        ))}
      </div>
    </Section>
  );
}
