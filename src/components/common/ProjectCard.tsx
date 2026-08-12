import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import type { Project } from '@/types/project';
import { Badge } from '@/components/ui/Badge';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <li>
      <Link
        to={`/projects/${project.slug}`}
        className="group border-border hover:border-accent/60 block h-full overflow-hidden rounded-lg border transition-colors"
      >
        <div className="from-card via-background to-background relative flex aspect-video items-end justify-between bg-linear-to-br p-4">
          <span className="text-accent font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
          <ArrowUpRight
            aria-hidden="true"
            size={16}
            className="text-muted group-hover:text-accent transition-colors"
          />
        </div>

        <div className="p-6">
          <p className="text-muted font-mono text-xs tracking-wide uppercase">
            {project.category} · {project.year}
          </p>
          <h3 className="font-display text-foreground mt-2 text-lg font-normal tracking-widest uppercase">
            {project.title}
          </h3>
          <p className="text-muted mt-2 text-sm">{project.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
        </div>
      </Link>
    </li>
  );
}
