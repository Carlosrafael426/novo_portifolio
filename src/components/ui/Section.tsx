import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { cn } from '@/utils/cn';

interface SectionProps {
  id: string;
  title: ReactNode;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
  /** Conteúdo full-bleed atrás do Container — não fica preso ao max-width/padding do conteúdo,
   *  útil pra fundos que precisam ocupar a seção inteira (ex: um canvas 3D). */
  background?: ReactNode;
}

export function Section({ id, title, eyebrow, className, children, background }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('border-border relative scroll-mt-24 border-t py-16 sm:py-24', className)}
    >
      {background}
      <Container className="relative">
        <SectionTitle id={headingId} eyebrow={eyebrow}>
          {title}
        </SectionTitle>
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}
