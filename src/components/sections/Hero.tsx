import { HeroCanvasSlot } from '@/components/common/HeroCanvasSlot';
import { HeroIntroOverlay } from '@/components/common/HeroIntroOverlay';
import { HeroCta } from '@/components/common/HeroCta';
import { HeroCursor } from '@/components/common/HeroCursor';
import { SystemStatus } from '@/components/common/SystemStatus';
import { ScrollIndicator } from '@/components/common/ScrollIndicator';
import { useHeroIntro } from '@/hooks/useHeroIntro';
import { scrollToSection } from '@/hooks/useHashScroll';

const NAME_TEXT_CLASS = 'block text-[clamp(3rem,0.5rem+10.5vw,10rem)] leading-[0.87] tracking-[-0.025em]';
const PHRASE_TEXT_CLASS = 'block text-[clamp(1.5rem,0.9rem+2.6vw,3.25rem)] leading-[1.05]';

export function Hero() {
  const { shouldPlayIntro, refs } = useHeroIntro();
  const {
    root,
    canvasWrapper,
    flipTarget,
    logoMarca,
    logoLimpa,
    carlos,
    rafael,
    label,
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
      className="relative flex min-h-screen scroll-mt-24 flex-col overflow-hidden px-6 py-28 sm:px-10 lg:px-16"
    >
      <div ref={canvasWrapper} className="absolute inset-0">
        <HeroCanvasSlot />
      </div>

      {/* Scrim radial sutil pra garantir contraste do texto sobre o canvas — sem virar caixa visível. */}
      <div
        aria-hidden="true"
        className="from-background/85 pointer-events-none absolute inset-y-0 left-0 w-full max-w-3xl bg-linear-to-r to-transparent sm:max-w-2xl"
      />

      {shouldPlayIntro ? (
        <HeroIntroOverlay flipTarget={flipTarget} logoMarca={logoMarca} logoLimpa={logoLimpa} />
      ) : null}

      <HeroCursor containerRef={root} />

      <p className="text-muted relative z-10 hidden font-mono text-[10px] tracking-[0.15em] uppercase sm:block">
        01 / Intro
      </p>

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <h1 aria-label="Carlos Rafael" className="font-display font-light uppercase">
          <span ref={carlos} aria-hidden="true" className={NAME_TEXT_CLASS}>
            Carlos
          </span>
          <span ref={rafael} aria-hidden="true" className={NAME_TEXT_CLASS}>
            Rafael
          </span>
        </h1>

        <p ref={label} className="text-accent mt-4 font-mono text-xs tracking-[0.2em] uppercase sm:text-sm">
          Desenvolvedor Full Stack
        </p>

        <div className="font-display text-foreground mt-6 max-w-2xl font-light uppercase">
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

        <div ref={ctaGroup} className="mt-10 flex flex-wrap items-center gap-8">
          <HeroCta
            href="#projetos"
            cursorLabel="Ver"
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
            cursorLabel="Abrir"
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
