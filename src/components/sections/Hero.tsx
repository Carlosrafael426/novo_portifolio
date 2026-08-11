import { ArrowRight } from 'lucide-react';
import { HeroCanvasSlot } from '@/components/common/HeroCanvasSlot';
import { SectionIndexRail } from '@/components/common/SectionIndexRail';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
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
        {/* Ícone da marca — recorte apenas do símbolo, sem o nome/cargo embutidos no PNG,
            mesclado (mix-blend-screen) pra mesclar com o fundo de partículas atrás dele. */}
        <div aria-hidden="true" className="aspect-1200/390 w-55 overflow-hidden sm:w-75 md:w-90">
          <img
            src="/Logo.png"
            alt=""
            className="mix-blend-lighten w-full object-cover object-top"
          />
        </div>

        <p className="text-accent -mt-2 flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase sm:-mt-4">
          <span className="bg-accent h-1.5 w-1.5 rounded-full" aria-hidden="true" />
          Desenvolvedor Full Stack
        </p>

        <h1 className="font-display mt-6 text-5xl leading-[0.95] font-bold tracking-tight uppercase sm:text-7xl">
          Carlos
          <br />
          Rafael
        </h1>

        <p className="text-muted mt-6 max-w-md text-base sm:text-lg">
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
