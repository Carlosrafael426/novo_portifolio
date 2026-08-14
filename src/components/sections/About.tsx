import { Section } from '@/components/ui/Section';
import { FaceGraphicSlot } from '@/components/common/FaceGraphicSlot';

export function About() {
  return (
    <Section
      id="sobre"
      eyebrow="02 / Identidade"
      title={<span className="sr-only">Quem sou eu</span>}
      className="flex min-h-screen flex-col justify-center"
    >
      <div className="flex flex-col items-center text-center">
        <p
          aria-hidden="true"
          className="font-display text-2xl leading-none font-normal whitespace-nowrap uppercase sm:text-3xl"
        >
          Quem sou{' '}
          <span className="text-accent">
            eu<span className="animate-cursor-blink">_</span>
          </span>
        </p>

        <FaceGraphicSlot className="mt-8 aspect-4/5 h-[55vh] max-h-160 sm:h-[65vh]" />
      </div>
    </Section>
  );
}
