import { lazy, Suspense } from 'react';

const FaceGraphic = lazy(() =>
  import('@/components/common/FaceGraphic').then((module) => ({ default: module.FaceGraphic })),
);

interface FaceGraphicSlotProps {
  className?: string;
}

/** Isola o bundle do Three.js/WebGL do restante do app — só carrega quando a seção monta. */
export function FaceGraphicSlot({ className }: FaceGraphicSlotProps) {
  return (
    <Suspense fallback={null}>
      <FaceGraphic className={className} />
    </Suspense>
  );
}
