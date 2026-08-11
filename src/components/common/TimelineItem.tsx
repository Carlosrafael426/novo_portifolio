import type { TimelineEntry } from '@/types/timeline';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface TimelineItemProps {
  entry: TimelineEntry;
}

export function TimelineItem({ entry }: TimelineItemProps) {
  return (
    <li
      className={cn(
        'border-border border-b py-8 first:pt-0 last:border-b-0',
        entry.highlight && 'border-accent/40',
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-foreground text-lg font-bold">
          {entry.title}
          {entry.highlight ? (
            <span className="text-accent ml-3 align-middle font-mono text-xs tracking-wide uppercase">
              Marco
            </span>
          ) : null}
        </h3>
        <span className="text-muted font-mono text-xs tracking-wide uppercase">
          {entry.period}
        </span>
      </div>
      <p className="text-muted mt-3 text-sm">{entry.description}</p>
      {entry.technologies && entry.technologies.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.technologies.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>
      ) : null}
    </li>
  );
}
