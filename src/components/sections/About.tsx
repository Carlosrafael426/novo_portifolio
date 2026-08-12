import type { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { BrainGraphic } from '@/components/common/BrainGraphic';
import { TechBackdrop } from '@/components/common/TechBackdrop';
import { useReveal3D } from '@/hooks/useReveal3D';
import { aboutContent } from '@/data/about';

const HIGHLIGHTS = ['Full Stack', 'projeto atrás de projeto', 'React, TypeScript e Tailwind', 'Node, Express e PostgreSQL'];

function highlightBio(text: string): ReactNode[] {
  const pattern = new RegExp(`(${HIGHLIGHTS.join('|')})`, 'g');
  return text.split(pattern).map((part, index) =>
    HIGHLIGHTS.includes(part) ? (
      <span key={index} className="text-accent">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function About() {
  const boxRef = useReveal3D<HTMLDivElement>();

  return (
    <Section id="sobre" eyebrow="02 / Identidade" title={<span className="sr-only">Quem sou eu</span>}>
      <div className="relative">
        <TechBackdrop className="pointer-events-none absolute inset-0 -z-10 opacity-70" />

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p
              aria-hidden="true"
              className="font-display text-2xl leading-none font-normal whitespace-nowrap uppercase sm:text-3xl"
            >
              Quem sou{' '}
              <span className="text-accent">
                eu<span className="animate-cursor-blink">_</span>
              </span>
            </p>

            <BrainGraphic className="mt-6 h-auto w-[70%] min-w-[220px]" />
          </div>

          <div ref={boxRef} className="border-border bg-card rounded-lg border p-6 sm:p-8" style={{ transformStyle: 'preserve-3d' }}>
            {aboutContent.bio.map((paragraph, index) => (
              <p key={index} className="text-muted mt-4 leading-relaxed first:mt-0">
                {highlightBio(paragraph)}
              </p>
            ))}

            <p className="text-foreground border-accent mt-6 border-l-2 pl-4 italic">
              {aboutContent.philosophy}
            </p>

            <ul className="text-muted mt-6 space-y-1 text-sm">
              {aboutContent.lookingFor.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent" aria-hidden="true">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
