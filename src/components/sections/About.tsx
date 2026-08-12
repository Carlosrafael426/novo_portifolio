import type { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { BrainGraphic } from '@/components/common/BrainGraphic';
import { aboutContent } from '@/data/about';
import { cn } from '@/utils/cn';

const HIGHLIGHTS = ['Full Stack', 'projeto atrás de projeto', 'React, TypeScript e Tailwind', 'Node, Express e PostgreSQL'];

const LOADING_SEGMENTS = 18;
const LOADING_FILLED = 13;

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
  return (
    <Section id="sobre" eyebrow="02 / Identidade" title={<span className="sr-only">Quem sou eu</span>}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <p
            aria-hidden="true"
            className="font-display text-4xl leading-[0.95] font-normal uppercase sm:text-5xl"
          >
            Quem sou
            <br />
            <span className="text-accent">
              eu<span className="animate-cursor-blink">_</span>
            </span>
          </p>

          <BrainGraphic className="mt-6 h-auto w-full max-w-115" />

          <div className="mt-6 font-mono text-xs">
            <p className="text-muted tracking-wide uppercase">System.info</p>
            <p className="text-muted mt-1 tracking-wide uppercase">Identity.loading</p>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {Array.from({ length: LOADING_SEGMENTS }).map((_, i) => (
                <span key={i} className={cn('h-2.5 w-1.5', i < LOADING_FILLED ? 'bg-accent' : 'bg-border')} />
              ))}
            </div>
          </div>

          <p className="text-muted mt-8 flex items-center gap-2 font-mono text-xs tracking-wide uppercase">
            <span aria-hidden="true">⊙</span> Scroll to explore
          </p>
        </div>

        <div>
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
    </Section>
  );
}
