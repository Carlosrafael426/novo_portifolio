import { ArrowRight } from 'lucide-react';
import logoLimpa from '@/assets/logo/logo-limpa.png';
import { HeroCanvasSlot } from '@/components/common/HeroCanvasSlot';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { scrollToSection } from '@/hooks/useHashScroll';

export function Hero() {
  return (
    <section
      id="inicio"
      aria-label="Início"
      className="relative flex min-h-screen scroll-mt-24 items-center overflow-hidden"
    >
      <HeroCanvasSlot />

      <Container className="relative flex flex-col items-center text-center">
        {/* H1 real (SEO/acessibilidade) — visualmente a logo já carrega nome e cargo. */}
        <VisuallyHidden>
          <h1>Carlos Rafael — Desenvolvedor Full Stack</h1>
        </VisuallyHidden>

        {/* Logo completa (ícone + nome + cargo), já com fundo transparente —
            o fundo de partículas por trás é o do próprio HeroCanvasSlot. */}
        <img src={logoLimpa} alt="" aria-hidden="true" className="w-96 sm:w-120 md:w-2xl" />

        <p className="text-muted mt-2 max-w-md text-xl sm:text-2xl">
          Eu construo sistemas digitais, interfaces e experiências que resolvem problemas reais.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            href="#projetos"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('projetos');
            }}
          >
            Ver projetos
            <ArrowRight aria-hidden="true" size={14} />
          </Button>
          <Button
            size="lg"
            href="#contato"
            variant="secondary"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('contato');
            }}
          >
            Entrar em contato
          </Button>
        </div>
      </Container>
    </section>
  );
}
