import { Section } from '@/components/ui/Section';
import { FaceGraphicSlot } from '@/components/common/FaceGraphicSlot';

export function About() {
  return (
    <Section
      id="sobre"
      eyebrow="02 / Identidade"
      title={<span className="sr-only">Quem sou eu</span>}
      className="min-h-screen"
      background={<FaceGraphicSlot className="absolute inset-0" />}
    >
      <p
        aria-hidden="true"
        className="font-display text-center text-2xl leading-none font-normal whitespace-nowrap uppercase sm:text-3xl"
      >
        Quem sou{' '}
        <span className="text-accent">
          eu<span className="animate-cursor-blink">_</span>
        </span>
      </p>
    </Section>
  );
}
