import { createPortal } from 'react-dom';
import logoMarcaSrc from '@/assets/logo/logo-marca.png';
import logoLimpaSrc from '@/assets/logo/logo-limpa.png';
import type { HeroIntroRefs } from '@/hooks/useHeroIntro';

interface HeroIntroOverlayProps {
  flipTarget: HeroIntroRefs['flipTarget'];
  logoMarca: HeroIntroRefs['logoMarca'];
  logoLimpa: HeroIntroRefs['logoLimpa'];
}

/**
 * A "logo voadora" da sequência de abertura — só existe enquanto a intro roda.
 * Portal pro document.body: escapa de qualquer overflow-hidden/transform de ancestral
 * que quebraria o position:fixed ou os cálculos do Flip.fit (ver useHeroIntro).
 */
export function HeroIntroOverlay({ flipTarget, logoMarca, logoLimpa }: HeroIntroOverlayProps) {
  return createPortal(
    <div
      ref={flipTarget}
      aria-hidden="true"
      className="pointer-events-none fixed top-1/2 left-1/2 z-(--z-hero-intro-overlay) size-56 -translate-x-1/2 -translate-y-1/2 sm:size-72"
    >
      <img
        ref={logoMarca}
        src={logoMarcaSrc}
        alt=""
        className="absolute inset-0 size-full object-contain opacity-0"
      />
      <img
        ref={logoLimpa}
        src={logoLimpaSrc}
        alt=""
        className="absolute inset-0 size-full object-contain opacity-0"
      />
    </div>,
    document.body,
  );
}
