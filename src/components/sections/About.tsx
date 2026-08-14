import { Section } from '@/components/ui/Section';
import { FaceGraphic } from '@/components/common/FaceGraphic';

export function About() {
  return (
    <Section id="sobre" eyebrow="02 / Identidade" title={<span className="sr-only">Quem sou eu</span>}>
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

        <FaceGraphic className="mt-8 w-[70%] min-w-65" />
      </div>
    </Section>
  );
}
