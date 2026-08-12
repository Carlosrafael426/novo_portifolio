import { ArrowRight } from 'lucide-react';
import { HeroCanvasSlot } from '@/components/common/HeroCanvasSlot';
import { SectionIndexRail } from '@/components/common/SectionIndexRail';
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

      <SectionIndexRail />

      <Container className="relative flex flex-col items-center text-center">
        {/* H1 real (SEO/acessibilidade) — visualmente a logo já carrega nome e cargo. */}
        <VisuallyHidden>
          <h1>Carlos Rafael — Desenvolvedor Full Stack</h1>
        </VisuallyHidden>

        {/* Logo completa (ícone + nome + cargo) — fundo removido via mix-blend-lighten
            pra mesclar com o fundo de partículas atrás dela. */}
        <img
          src="/Logo.png"
          alt=""
          aria-hidden="true"
          className="mix-blend-lighten w-80 sm:w-104 md:w-lg"
        />

        <p className="text-muted -mt-4 max-w-md text-base sm:text-lg">
          Eu construo sistemas digitais, interfaces e experiências que resolvem problemas reais.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
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
