import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const POINT_COUNT = 140;
const CONNECT_DISTANCE = 2.1;
const ACCENT_COLOR = '#c6ff45';

function buildField() {
  const positions = new Float32Array(POINT_COUNT * 3);

  for (let i = 0; i < POINT_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }

  const segments: number[] = [];

  for (let i = 0; i < POINT_COUNT; i++) {
    for (let j = i + 1; j < POINT_COUNT; j++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < CONNECT_DISTANCE) {
        segments.push(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2],
          positions[j * 3],
          positions[j * 3 + 1],
          positions[j * 3 + 2],
        );
      }
    }
  }

  return { positions, lines: new Float32Array(segments) };
}

function ParticleField() {
  const groupRef = useRef<THREE.Group>(null);
  const { positions, lines } = useMemo(() => buildField(), []);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += 0.0005;
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, state.pointer.y * 0.1, 0.02);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, group.rotation.y + state.pointer.x * 0.015, 0.02);
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={ACCENT_COLOR} size={0.045} sizeAttenuation transparent opacity={0.85} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={ACCENT_COLOR} transparent opacity={0.1} />
      </lineSegments>
    </group>
  );
}

/**
 * Fundo do Hero: campo de partículas conectadas (Three.js), com leve resposta ao mouse.
 * Carregado via React.lazy a partir de HeroCanvasSlot — isolado do bundle principal.
 */
export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Evita gastar ciclo de renderização com o Hero fora da tela (scroll passado).
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        frameloop={isVisible ? 'always' : 'never'}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}
