import logoLimpaSrc from '@/assets/logo/logo-limpa.png';
import { HeroCanvasSlot } from '@/components/common/HeroCanvasSlot';
import { HeroCta } from '@/components/common/HeroCta';
import { SystemStatus } from '@/components/common/SystemStatus';
import { ScrollIndicator } from '@/components/common/ScrollIndicator';
import { useHeroIntro } from '@/hooks/useHeroIntro';
import { scrollToSection } from '@/hooks/useHashScroll';

const PHRASE_TEXT_CLASS = 'block text-[clamp(1.575rem,0.9rem+2.88vw,3.375rem)] leading-[1.05]';

export function Hero() {
  const { refs } = useHeroIntro();
  const {
    root,
    canvasWrapper,
    introLabel,
    logo,
    phraseLine1,
    phraseLine2,
    tertiary,
    ctaGroup,
    status,
    scrollHint,
  } = refs;

  return (
    <section
      id="inicio"
      aria-label="Início"
      ref={root}
      className="relative flex min-h-screen scroll-mt-24 flex-col overflow-hidden px-6 pt-12 pb-28 sm:px-10 sm:pt-16 lg:px-16"
    >
      <div ref={canvasWrapper} className="absolute inset-0">
        <HeroCanvasSlot />
      </div>

      {/* Scrim radial sutil, centrado no conteúdo — garante contraste sem virar caixa visível. */}
      <div
        aria-hidden="true"
        className="bg-radial from-background/80 via-background/25 pointer-events-none absolute inset-0 to-transparent"
      />

      {/* Nome real pra leitor de tela/SEO — a identidade visual aqui é a logo, não tipografia. */}
      <h1 className="sr-only">Carlos Rafael — Desenvolvedor Full Stack</h1>

      <p
        ref={introLabel}
        className="text-muted relative z-10 hidden font-mono text-[10px] tracking-[0.15em] uppercase sm:block"
      >
        01 / Intro
      </p>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div ref={logo} className="aspect-[1133/654] w-[clamp(16rem,10rem+22vw,32rem)]">
          <img src={logoLimpaSrc} alt="" className="h-full w-full object-contain" />
        </div>

        <div className="font-display text-foreground mt-8 max-w-2xl font-light uppercase">
          <span ref={phraseLine1} className={PHRASE_TEXT_CLASS}>
            Eu construo
          </span>
          <span ref={phraseLine2} className={PHRASE_TEXT_CLASS}>
            Sistemas digitais.
          </span>
        </div>

        <p ref={tertiary} className="text-muted mt-6 font-mono text-xs tracking-wide sm:text-sm">
          Interfaces · APIs · Produtos · Experiências
        </p>

        <div ref={ctaGroup} className="mt-10 flex flex-wrap items-center justify-center gap-8">
          <HeroCta
            href="#projetos"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('projetos');
            }}
          >
            Ver projetos →
          </HeroCta>
          <HeroCta
            href="#contato"
            variant="secondary"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('contato');
            }}
          >
            Vamos conversar
          </HeroCta>
        </div>
      </div>

      <div className="flex items-end justify-between pb-[env(safe-area-inset-bottom)] sm:relative sm:z-10">
        <div ref={scrollHint} className="relative z-10">
          <ScrollIndicator />
        </div>
        {/* No mobile o status sobe pro canto superior direito, ancorado na section (não nesta
            linha) — no rodapé ele cai na thumb zone. */}
        <div
          ref={status}
          className="absolute top-6 right-6 z-10 sm:static sm:top-auto sm:right-auto"
        >
          <SystemStatus />
        </div>
      </div>
    </section>
  );
}
