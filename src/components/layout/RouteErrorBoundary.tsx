import { ArrowLeft } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Container } from '@/components/ui/Container';

export function RouteErrorBoundary() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : 'Ocorreu um erro inesperado.';

  return (
    <Container className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Algo deu errado</h1>
      <p className="text-muted mt-2">{message}</p>
      <Link to="/" className="text-accent mt-8 inline-flex items-center gap-2 font-mono text-sm">
        <ArrowLeft aria-hidden="true" size={14} />
        Voltar ao início
      </Link>
    </Container>
  );
}
