import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';

const SESSION_KEY = 'hero_intro_seen';
const SAFETY_TIMEOUT_MS = 7500;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function alreadySeenThisSession(): boolean {
  // Em dev a intro sempre roda de novo a cada reload — senão, ao iterar no navegador,
  // a sessionStorage do primeiro load "gruda" e some pro resto da sessão de trabalho.
  if (import.meta.env.DEV) return false;

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
  introLabel: RefObject<HTMLParagraphElement | null>;
  logo: RefObject<HTMLDivElement | null>;
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
 * Orquestra a sequência de abertura do Hero: só o fundo (canvas) aparece de cara; a logo emerge
 * devagar e suave, com o header junto; só depois o restante do conteúdo entra em pares alternando
 * de lado, um de cada vez. Roda no máximo uma vez por sessão, respeita prefers-reduced-motion,
 * nunca bloqueia scroll/teclado, e nunca usa display/visibility (só opacity/transform/filter) pra
 * não quebrar leitor de tela nem causar layout shift.
 */
export function useHeroIntro(): UseHeroIntroResult {
  const [shouldPlayIntro] = useState(() => !prefersReducedMotion() && !alreadySeenThisSession());

  const root = useRef<HTMLElement>(null);
  const canvasWrapper = useRef<HTMLDivElement>(null);
  const introLabel = useRef<HTMLParagraphElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const phraseLine1 = useRef<HTMLSpanElement>(null);
  const phraseLine2 = useRef<HTMLSpanElement>(null);
  const tertiary = useRef<HTMLParagraphElement>(null);
  const ctaGroup = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const scrollHint = useRef<HTMLDivElement>(null);

  const refs: HeroIntroRefs = {
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
  };

  useLayoutEffect(() => {
    const revealTargets = [
      canvasWrapper.current,
      introLabel.current,
      logo.current,
      phraseLine1.current,
      phraseLine2.current,
      tertiary.current,
      ctaGroup.current,
      status.current,
      scrollHint.current,
    ].filter((el): el is HTMLElement => el !== null);

    if (!shouldPlayIntro) {
      // Fallback rápido (reduced-motion ou já vista nesta sessão): só o conteúdo do próprio Hero
      // — o header é persistente entre navegações e não deve ser tocado/re-animado aqui.
      const ctx = gsap.context(() => {
        gsap.from(revealTargets, { opacity: 0, duration: 0.25, ease: 'sine.out' });
      }, root);

      return () => ctx.revert();
    }

    let finishNow = () => {};
    let safetyTimeout: number | undefined;

    const ctx = gsap.context(() => {
      const header = document.getElementById('navbar');

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: markSeen,
      });

      tl.set(revealTargets, { opacity: 0 })
        .set(header, { opacity: 0 })
        .set(logo.current, { scale: 0.55, filter: 'blur(10px)' })
        .set(phraseLine1.current, { x: -32 })
        .set(phraseLine2.current, { x: 32 })
        .set(tertiary.current, { x: -24 })
        .set(ctaGroup.current, { x: 24 })
        .to(canvasWrapper.current, { opacity: 1, duration: 1.1, ease: 'sine.out' }, 0)
        // A logo "vem do fundo da tela": nasce pequena/desfocada/transparente e cresce, devagar e
        // suave, até o tamanho final — o header aparece junto, no mesmo ritmo.
        .to(logo.current, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2.6, ease: 'sine.out' }, 0.3)
        .to([header, introLabel.current], { opacity: 1, duration: 2.6, ease: 'sine.out' }, 0.3)
        .to(phraseLine1.current, { opacity: 1, x: 0, duration: 0.9 }, 3.0)
        .to(phraseLine2.current, { opacity: 1, x: 0, duration: 0.9 }, 3.45)
        .to(tertiary.current, { opacity: 1, x: 0, duration: 0.8 }, 3.9)
        .to(ctaGroup.current, { opacity: 1, x: 0, duration: 0.8 }, 4.35)
        .to([status.current, scrollHint.current], { opacity: 1, duration: 0.6, ease: 'sine.out' }, 4.9);

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
