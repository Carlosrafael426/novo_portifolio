import { navItems } from '@/data/nav';
import { useActiveSection } from '@/hooks/useActiveSection';
import { cn } from '@/utils/cn';

const sectionIds = navItems.map((item) => item.sectionId);

/** Indicador decorativo de progresso: reflete a seção ativa real via useActiveSection. */
export function SectionIndexRail() {
  const activeId = useActiveSection(sectionIds);
  const activeIndex = Math.max(0, sectionIds.indexOf(activeId ?? sectionIds[0]));

  return (
    <div
      aria-hidden="true"
      className="text-muted absolute top-1/2 right-6 hidden -translate-y-1/2 flex-col items-center gap-4 font-mono text-xs lg:right-10 xl:flex"
    >
      <span className="text-foreground">{String(activeIndex + 1).padStart(2, '0')}</span>

      <div className="relative flex h-40 w-px flex-col items-center justify-between">
        <span className="bg-border absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" />
        {sectionIds.map((id, index) => (
          <span
            key={id}
            className={cn(
              'relative h-1.5 w-1.5 rounded-full transition-colors',
              index === activeIndex ? 'bg-accent' : 'bg-border-strong',
            )}
          />
        ))}
      </div>

      <span>{String(sectionIds.length).padStart(2, '0')}</span>
    </div>
  );
}
