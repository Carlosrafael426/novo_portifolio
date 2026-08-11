import { Section } from '@/components/ui/Section';
import { TimelineItem } from '@/components/common/TimelineItem';
import { timeline } from '@/data/timeline';

export function Trajetoria() {
  return (
    <Section id="trajetoria" eyebrow="06 / Trajetória" title="Como cheguei aqui">
      <ul>
        {timeline.map((entry) => (
          <TimelineItem key={entry.id} entry={entry} />
        ))}
      </ul>
    </Section>
  );
}
