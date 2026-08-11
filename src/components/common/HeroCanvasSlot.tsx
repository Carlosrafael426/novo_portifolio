import { lazy, Suspense } from 'react';

const HeroCanvas = lazy(() => import('@/components/common/HeroCanvas'));

/** Isola o bundle do Three.js/WebGL do restante do app — só carrega quando o Hero monta. */
export function HeroCanvasSlot() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>
    </div>
  );
}
