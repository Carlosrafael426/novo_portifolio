import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { getProjectBySlug } from '@/data/projects';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;

  useDocumentTitle(
    project ? `${project.title} — Carlos Rafael` : 'Projeto não encontrado — Carlos Rafael',
  );

  if (!project) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-2xl font-bold">Projeto não encontrado</h1>
        <p className="text-muted mt-2">O projeto que você procura não existe ou foi removido.</p>
        <Link to="/" className="text-accent mt-6 inline-flex items-center gap-2 font-mono text-sm">
          <ArrowLeft aria-hidden="true" size={14} />
          Voltar ao início
        </Link>
      </Container>
    );
  }

  return (
    <article className="py-24">
      <Container>
        <p className="text-accent font-mono text-xs tracking-[0.2em] uppercase">
          {project.category} · {project.year}
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight uppercase sm:text-5xl">
          {project.title}
        </h1>
        <p className="text-muted mt-2 text-lg">{project.subtitle}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {project.liveUrl ? (
            <Button href={project.liveUrl} variant="primary">
              Ver online
            </Button>
          ) : null}
          {project.githubUrl ? (
            <Button href={project.githubUrl} variant="secondary">
              Ver repositório
            </Button>
          ) : null}
        </div>

        <p className="text-muted border-border mt-10 max-w-2xl border-t pt-8">
          {project.description}
        </p>

        {project.caseStudy ? (
          <dl className="mt-12 grid gap-10 sm:grid-cols-2">
            <div>
              <dt className="text-accent font-mono text-xs tracking-wide uppercase">Problema</dt>
              <dd className="text-muted mt-2">{project.caseStudy.problem}</dd>
            </div>
            <div>
              <dt className="text-accent font-mono text-xs tracking-wide uppercase">Solução</dt>
              <dd className="text-muted mt-2">{project.caseStudy.solution}</dd>
            </div>
            <div>
              <dt className="text-accent font-mono text-xs tracking-wide uppercase">Processo</dt>
              <dd className="text-muted mt-2">{project.caseStudy.process}</dd>
            </div>
            <div>
              <dt className="text-accent font-mono text-xs tracking-wide uppercase">Resultado</dt>
              <dd className="text-muted mt-2">{project.caseStudy.result}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted mt-12 font-mono text-sm">Case study em breve.</p>
        )}

        <Link
          to="/"
          className="text-accent mt-16 inline-flex items-center gap-2 font-mono text-sm"
        >
          <ArrowLeft aria-hidden="true" size={14} />
          Voltar ao início
        </Link>
      </Container>
    </article>
  );
}
