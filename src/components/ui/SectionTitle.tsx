import type { ReactNode } from 'react';

interface SectionTitleProps {
  id?: string;
  eyebrow?: string;
  as?: 'h2' | 'h3';
  children: ReactNode;
}

export function SectionTitle({ id, eyebrow, as: Heading = 'h2', children }: SectionTitleProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-accent font-mono text-xs tracking-[0.2em] uppercase">{eyebrow}</p>
      ) : null}
      <Heading
        id={id}
        className="font-display mt-3 text-3xl font-normal tracking-[0.08em] uppercase sm:text-4xl"
      >
        {children}
      </Heading>
    </div>
  );
}
