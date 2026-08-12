import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';

/**
 * Anima um elemento "saindo da tela" (escala + leve rotação em profundidade + fade-in) na
 * primeira vez que ele entra na viewport. Roda uma única vez, respeita prefers-reduced-motion,
 * e nunca mexe em display/visibility (só opacity/transform).
 */
export function useReveal3D<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let observer: IntersectionObserver | undefined;

    const ctx = gsap.context(() => {
      gsap.set(element, { opacity: 0, scale: 0.82, rotateX: 14, y: 32, transformPerspective: 1000 });

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          gsap.to(element, {
            opacity: 1,
            scale: 1,
            rotateX: 0,
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
          });
          observer?.disconnect();
        },
        { threshold: 0.2 },
      );
      observer.observe(element);
    });

    return () => {
      observer?.disconnect();
      ctx.revert();
    };
  }, []);

  return ref;
}
