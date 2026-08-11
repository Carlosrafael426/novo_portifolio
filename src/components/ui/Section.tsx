import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { cn } from '@/utils/cn';

interface SectionProps {
  id: string;
  title: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}

export function Section({ id, title, eyebrow, className, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('border-border scroll-mt-24 border-t py-16 sm:py-24', className)}
    >
      <Container>
        <SectionTitle id={headingId} eyebrow={eyebrow}>
          {title}
        </SectionTitle>
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}
