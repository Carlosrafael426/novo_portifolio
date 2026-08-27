import { lazy, Suspense } from 'react';

const HeroCanvas = lazy(() => import('@/components/common/HeroCanvas'));

/**
 * Fundo do site inteiro — fixo na tela (não rola com a página), então a rede de conexões fica
 * parada enquanto o resto do conteúdo se move por cima ao rolar. Renderizado uma única vez no
 * RootLayout, não em cada seção. Isola o bundle do Three.js/WebGL do resto do app.
 */
export function SiteBackgroundSlot() {
  return (
    <div aria-hidden="true" className="fixed inset-0 z-(--z-canvas)">
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>
    </div>
  );
}
