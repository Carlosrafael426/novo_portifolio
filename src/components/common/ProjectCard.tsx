import { ArrowUpRight, Building2, Church, ExternalLink, Gamepad2, Hexagon, Joystick } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { Link } from 'react-router';
import type { Project } from '@/types/project';
import { Badge } from '@/components/ui/Badge';
import { ClippedPanel } from '@/components/ui/ClippedPanel';

/** Ícone por projeto, não por categoria — cada card tem uma identidade própria. */
const projectIcons: Record<string, LucideIcon> = {
  'missao-santa-faustina': Church,
  shinra: Building2,
  'historias-para-a-vida': Building2,
  'devclub-concurso': Building2,
  freeway: Joystick,
  pong: Gamepad2,
};

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const Icon = projectIcons[project.id] ?? Gamepad2;

  return (
    <li>
      <ClippedPanel
        corners="all"
        cut={16}
        pulse={false}
        wrapperClassName="h-full"
        className="group relative flex h-112 flex-col overflow-hidden p-0"
      >
        <Link
          to={`/projects/${project.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`Ver detalhes de ${project.title}`}
        />

        {project.image ? (
          <div className="relative h-40 w-full shrink-0 overflow-hidden">
            <img
              src={project.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="from-background pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between">
            <span className="text-accent font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
            <div className="relative z-20 flex items-center gap-3">
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ver código de ${project.title} no GitHub`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  <SiGithub aria-hidden="true" size={15} />
                </a>
              ) : null}
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${project.title} no ar`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              ) : null}
              <ArrowUpRight
                aria-hidden="true"
                size={16}
                className="text-muted group-hover:text-accent transition-colors"
              />
            </div>
          </div>

          <span className="relative mt-4 flex h-10 w-10 shrink-0 items-center justify-center">
            <Hexagon
              aria-hidden="true"
              strokeWidth={1}
              className="text-accent/70 animate-hex-spin motion-reduce:animate-none absolute inset-0 h-full w-full"
            />
            <Icon
              aria-hidden="true"
              size={16}
              strokeWidth={1.5}
              className="text-accent animate-system-pulse motion-reduce:animate-none relative"
            />
          </span>

          <p className="text-muted mt-3 font-mono text-xs tracking-wide uppercase">
            {project.category} · {project.year}
          </p>
          <h3 className="font-display text-foreground mt-2 text-lg font-normal tracking-widest uppercase">
            {project.title}
          </h3>
          <p className="text-muted mt-2 line-clamp-2 flex-1 text-sm">{project.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
        </div>
      </ClippedPanel>
    </li>
  );
}
