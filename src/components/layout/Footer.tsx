import { Container } from '@/components/ui/Container';
import { SocialLinks } from '@/components/common/SocialLinks';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border border-t py-8">
      <Container className="text-muted flex flex-col items-center gap-4 font-mono text-xs tracking-wide sm:flex-row sm:justify-between">
        <p>© {year} CARLOS RAFAEL</p>
        <SocialLinks />
      </Container>
    </footer>
  );
}
