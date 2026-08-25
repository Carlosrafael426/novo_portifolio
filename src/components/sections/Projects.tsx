import { Code2, Hexagon } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { ClippedPanel } from '@/components/ui/ClippedPanel';
import { HeroCta } from '@/components/common/HeroCta';
import { ProjectList } from '@/components/common/ProjectList';
import { projects } from '@/data/projects';
import { scrollToSection } from '@/hooks/useHashScroll';

function TitleConnector() {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 24" className="text-accent/50 hidden h-6 min-w-20 flex-1 sm:block">
      <path d="M0 12H80L96 20H132" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="138" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function Projects() {
  return (
    <Section
      id="projetos"
      eyebrow="04 / Projetos"
      title={
        <span className="flex flex-wrap items-center gap-4">
          <span>O que eu construí</span>
          <TitleConnector />
        </span>
      }
    >
      <div className="flex gap-4">
        <span aria-hidden="true" className="bg-accent w-0.5 shrink-0 self-stretch" />
        <p className="text-muted max-w-xl text-sm">
          Uma seleção de projetos que desenvolvi com foco em performance, experiência do usuário e
          código de qualidade.
        </p>
      </div>

      <div className="mt-8">
        <ProjectList projects={projects} />
      </div>

      <ClippedPanel
        corners="opposite"
        cut={24}
        wrapperClassName="mt-10"
        className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <Hexagon
              aria-hidden="true"
              strokeWidth={1}
              className="text-accent/70 animate-hex-spin motion-reduce:animate-none absolute inset-0 h-full w-full"
            />
            <Code2
              aria-hidden="true"
              size={20}
              strokeWidth={1.5}
              className="text-accent animate-system-pulse motion-reduce:animate-none relative"
            />
          </span>
          <div>
            <p className="text-foreground text-sm">
              Cada projeto representa um desafio, uma solução e um aprendizado.
            </p>
            <p className="text-accent font-display mt-1 text-sm font-normal tracking-widest uppercase">
              Vamos construir o próximo juntos?
            </p>
          </div>
        </div>

        <HeroCta
          href="#contato"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection('contato');
          }}
        >
          Vamos conversar →
        </HeroCta>
      </ClippedPanel>
    </Section>
  );
}
