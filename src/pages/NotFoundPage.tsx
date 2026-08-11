import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada — Carlos Rafael');

  return (
    <Container className="py-32 text-center">
      <p className="text-accent font-mono text-sm tracking-[0.2em]">404</p>
      <h1 className="font-display mt-3 text-3xl font-bold tracking-tight uppercase">
        Página não encontrada
      </h1>
      <p className="text-muted mt-2">A página que você procura não existe.</p>
      <Link to="/" className="text-accent mt-8 inline-flex items-center gap-2 font-mono text-sm">
        <ArrowLeft aria-hidden="true" size={14} />
        Voltar ao início
      </Link>
    </Container>
  );
}
