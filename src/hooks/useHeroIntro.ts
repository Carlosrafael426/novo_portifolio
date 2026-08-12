import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const SESSION_KEY = 'hero_intro_seen';
const SAFETY_TIMEOUT_MS = 3000;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function alreadySeenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // sessionStorage indisponível (modo privado etc.) — só não persiste entre navegações.
  }
}

export interface HeroIntroRefs {
  root: RefObject<HTMLElement | null>;
  canvasWrapper: RefObject<HTMLDivElement | null>;
  flipTarget: RefObject<HTMLDivElement | null>;
  logoMarca: RefObject<HTMLImageElement | null>;
  logoLimpa: RefObject<HTMLImageElement | null>;
  carlos: RefObject<HTMLSpanElement | null>;
  rafael: RefObject<HTMLSpanElement | null>;
  label: RefObject<HTMLParagraphElement | null>;
  phraseLine1: RefObject<HTMLSpanElement | null>;
  phraseLine2: RefObject<HTMLSpanElement | null>;
  tertiary: RefObject<HTMLParagraphElement | null>;
  ctaGroup: RefObject<HTMLDivElement | null>;
  status: RefObject<HTMLDivElement | null>;
  scrollHint: RefObject<HTMLDivElement | null>;
}

interface UseHeroIntroResult {
  /** Se a sequência decorativa deve rodar (falso = reduced-motion ou já vista nesta sessão). */
  shouldPlayIntro: boolean;
  refs: HeroIntroRefs;
}

/**
 * Orquestra a sequência de abertura do Hero (GSAP + Flip da logo pra navbar).
 * Roda no máximo uma vez por sessão, respeita prefers-reduced-motion, nunca bloqueia
 * scroll/teclado, e nunca usa display/visibility (só opacity/transform) pra não quebrar
 * leitor de tela nem causar layout shift.
 */
export function useHeroIntro(): UseHeroIntroResult {
  const [shouldPlayIntro] = useState(() => !prefersReducedMotion() && !alreadySeenThisSession());

  const root = useRef<HTMLElement>(null);
  const canvasWrapper = useRef<HTMLDivElement>(null);
  const flipTarget = useRef<HTMLDivElement>(null);
  const logoMarca = useRef<HTMLImageElement>(null);
  const logoLimpa = useRef<HTMLImageElement>(null);
  const carlos = useRef<HTMLSpanElement>(null);
  const rafael = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const phraseLine1 = useRef<HTMLSpanElement>(null);
  const phraseLine2 = useRef<HTMLSpanElement>(null);
  const tertiary = useRef<HTMLParagraphElement>(null);
  const ctaGroup = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const scrollHint = useRef<HTMLDivElement>(null);

  const refs: HeroIntroRefs = {
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
  };

  useLayoutEffect(() => {
    const revealTargets = [
      canvasWrapper.current,
      carlos.current,
      rafael.current,
      label.current,
      phraseLine1.current,
      phraseLine2.current,
      tertiary.current,
      ctaGroup.current,
      status.current,
      scrollHint.current,
    ].filter((el): el is HTMLElement => el !== null);

    if (!shouldPlayIntro) {
      const ctx = gsap.context(() => {
        gsap.from(revealTargets, { opacity: 0, duration: 0.25, ease: 'sine.out' });
      }, root);

      return () => ctx.revert();
    }

    let finishNow = () => {};
    let safetyTimeout: number | undefined;

    const ctx = gsap.context((_self, contextSafe) => {
      const navbarLogo = document.getElementById('navbar-logo');

      function runFlip() {
        if (navbarLogo && flipTarget.current) {
          Flip.fit(flipTarget.current, navbarLogo, {
            scale: true,
            absolute: true,
            duration: 0.5,
            ease: 'expo.out',
            onComplete: () => {
              gsap.to(flipTarget.current, { opacity: 0, duration: 0.1 });
              gsap.to(navbarLogo, { opacity: 1, duration: 0.1 });
            },
          });
        } else if (flipTarget.current) {
          gsap.to(flipTarget.current, { opacity: 0, duration: 0.3 });
        }
      }

      // Flip.fit() é chamado depois, dentro do callback da timeline (assíncrono) — contextSafe
      // garante que esse tween criado "tarde" ainda seja rastreado e revertido no cleanup.
      const safeRunFlip = (contextSafe ? contextSafe(runFlip) : runFlip) as () => void;

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: markSeen,
      });

      tl.set(revealTargets, { opacity: 0 })
        .set([carlos.current, rafael.current], { y: 24 })
        .set(label.current, { y: 10 })
        .set([phraseLine1.current, phraseLine2.current], { y: 16 })
        .set(logoLimpa.current, { opacity: 0 })
        // A logo real da navbar só aparece depois que o FLIP termina (senão fica
        // duplicada/fantasma junto com a logo voadora durante a transição).
        .set(navbarLogo, { opacity: 0 })
        .fromTo(logoMarca.current, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4 }, 0)
        .to(
          canvasWrapper.current,
          { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'sine.out' },
          0.15,
        )
        .to(logoMarca.current, { opacity: 0, duration: 0.3 }, 0.65)
        .to(logoLimpa.current, { opacity: 1, duration: 0.3 }, 0.65)
        .call(safeRunFlip, undefined, 0.85)
        .to(carlos.current, { opacity: 1, y: 0, duration: 0.4 }, 1.3)
        .to(rafael.current, { opacity: 1, y: 0, duration: 0.4 }, 1.45)
        .to(label.current, { opacity: 1, y: 0, duration: 0.3 }, 1.65)
        .to(phraseLine1.current, { opacity: 1, y: 0, duration: 0.3 }, 1.8)
        .to(phraseLine2.current, { opacity: 1, y: 0, duration: 0.3 }, 1.92)
        .to([tertiary.current, ctaGroup.current], { opacity: 1, duration: 0.25, stagger: 0.05 }, 2.0)
        .to([status.current, scrollHint.current], { opacity: 1, duration: 0.2, ease: 'sine.out' }, 2.1);

      finishNow = () => tl.progress(1);
      window.addEventListener('scroll', finishNow, { passive: true, once: true });
      window.addEventListener('keydown', finishNow, { once: true });
      safetyTimeout = window.setTimeout(finishNow, SAFETY_TIMEOUT_MS);
    }, root);

    return () => {
      window.removeEventListener('scroll', finishNow);
      window.removeEventListener('keydown', finishNow);
      if (safetyTimeout !== undefined) window.clearTimeout(safetyTimeout);
      ctx.revert();
    };
  }, [shouldPlayIntro]);

  return { shouldPlayIntro, refs };
}
