import { Section } from '@/components/ui/Section';
import { ProjectList } from '@/components/common/ProjectList';
import { projects } from '@/data/projects';

export function Projects() {
  return (
    <Section id="projetos" eyebrow="04 / Projetos" title="O que eu construí">
      <ProjectList projects={projects} />
    </Section>
  );
}
