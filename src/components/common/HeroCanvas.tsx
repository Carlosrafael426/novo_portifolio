import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ACCENT_COLOR = new THREE.Color('#c6ff45');
const CONNECT_DISTANCE = 2.4;
const NEIGHBORS_PER_NODE = 6;
const MOUSE_RADIUS = 2.2;
const DAMPING = 0.06;

const FADE_IN_S = 0.6;
const FADE_OUT_S = 0.8;
const HOLD_S = 2.2;
const HOLD_JITTER_S = 2.5;
const IDLE_JITTER_S = 1.2;

type Layer = 0 | 1 | 2;

const LAYER_CONFIG: Record<Layer, { zMin: number; zMax: number; size: number; amp: number; mouse: number }> = {
  0: { zMin: 1.2, zMax: 3, size: 0.11, amp: 0.35, mouse: 1 },
  1: { zMin: -1, zMax: 1.2, size: 0.07, amp: 0.22, mouse: 0.55 },
  2: { zMin: -3.6, zMax: -1, size: 0.045, amp: 0.14, mouse: 0.25 },
};

interface Tier {
  nodeCount: number;
  slotCount: number;
  dpr: number | [number, number];
}

function getPerfTier(width: number): Tier {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (coarse || width < 768) {
    return { nodeCount: 45, slotCount: 22, dpr: 1 };
  }
  if (cores >= 8 && width >= 1280) {
    return { nodeCount: 150, slotCount: 75, dpr: [1, 1.75] };
  }
  return { nodeCount: 90, slotCount: 45, dpr: [1, 1.5] };
}

interface NodeData {
  basePos: THREE.Vector3;
  phase: [number, number, number];
  freq: [number, number, number];
  amp: number;
  layer: Layer;
  neighbors: number[];
  displacement: THREE.Vector3;
}

type SlotState = 'idle' | 'fadeIn' | 'hold' | 'fadeOut';

interface LineSlot {
  state: SlotState;
  nodeA: number;
  nodeB: number;
  timer: number;
  alpha: number;
}

interface FieldData {
  nodes: NodeData[];
  slots: LineSlot[];
  positions: Float32Array;
  sizes: Float32Array;
  linePositions: Float32Array;
  lineColors: Float32Array;
}

function buildField(nodeCount: number, slotCount: number): FieldData {
  const nodes = buildNodes(nodeCount);
  const slots = buildSlots(slotCount, nodes);

  const positions = new Float32Array(nodeCount * 3);
  const sizes = new Float32Array(nodeCount);
  nodes.forEach((node, i) => {
    positions[i * 3] = node.basePos.x;
    positions[i * 3 + 1] = node.basePos.y;
    positions[i * 3 + 2] = node.basePos.z;
    sizes[i] = LAYER_CONFIG[node.layer].size * (0.7 + Math.random() * 0.6);
  });

  const linePositions = new Float32Array(slotCount * 6);
  const lineColors = new Float32Array(slotCount * 8);
  slots.forEach((slot, i) => {
    for (let vertex = 0; vertex < 2; vertex++) {
      const offset = i * 8 + vertex * 4;
      lineColors[offset] = ACCENT_COLOR.r;
      lineColors[offset + 1] = ACCENT_COLOR.g;
      lineColors[offset + 2] = ACCENT_COLOR.b;
      lineColors[offset + 3] = slot.alpha;
    }
  });

  return { nodes, slots, positions, sizes, linePositions, lineColors };
}

function buildNodes(count: number): NodeData[] {
  const nodes: NodeData[] = [];

  for (let i = 0; i < count; i++) {
    const layer = (i % 3) as Layer;
    const config = LAYER_CONFIG[layer];

    nodes.push({
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 9,
        config.zMin + Math.random() * (config.zMax - config.zMin),
      ),
      phase: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
      freq: [0.15 + Math.random() * 0.2, 0.12 + Math.random() * 0.18, 0.1 + Math.random() * 0.15],
      amp: config.amp * (0.6 + Math.random() * 0.8),
      layer,
      neighbors: [],
      displacement: new THREE.Vector3(),
    });
  }

  // Vizinhança pré-computada uma única vez — a topologia não muda depois (posições-base são fixas).
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].neighbors = nodes
      .map((node, j) => ({ j, d: j === i ? Infinity : nodes[i].basePos.distanceTo(node.basePos) }))
      .filter((entry) => entry.d < CONNECT_DISTANCE)
      .sort((a, b) => a.d - b.d)
      .slice(0, NEIGHBORS_PER_NODE)
      .map((entry) => entry.j);
  }

  return nodes;
}

function pickSlotPartner(nodes: NodeData[]): [number, number] | null {
  const start = Math.floor(Math.random() * nodes.length);
  for (let attempt = 0; attempt < nodes.length; attempt++) {
    const a = (start + attempt) % nodes.length;
    const neighbors = nodes[a].neighbors;
    if (neighbors.length > 0) {
      const b = neighbors[Math.floor(Math.random() * neighbors.length)];
      return [a, b];
    }
  }
  return null;
}

function buildSlots(count: number, nodes: NodeData[]): LineSlot[] {
  const slots: LineSlot[] = [];

  for (let i = 0; i < count; i++) {
    const pair = pickSlotPartner(nodes);
    slots.push({
      state: 'hold',
      nodeA: pair?.[0] ?? 0,
      nodeB: pair?.[1] ?? 0,
      timer: HOLD_S + Math.random() * HOLD_JITTER_S,
      // Seed já "conectado" (alpha 1) — evita o campo começar vazio e ir enchendo aos poucos.
      alpha: pair ? 1 : 0,
    });
  }

  return slots;
}

interface ParticleFieldProps {
  nodeCount: number;
  slotCount: number;
  reducedMotion: boolean;
}

function ParticleField({ nodeCount, slotCount, reducedMotion }: ParticleFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);

  // Dados mutáveis da simulação (mutados por dentro do useFrame, nunca via setState) —
  // por isso vivem num ref com inicialização preguiçosa, não em useMemo/useState.
  const fieldRef = useRef<FieldData | null>(null);
  if (fieldRef.current === null) {
    fieldRef.current = buildField(nodeCount, slotCount);
  }
  const { nodes, slots, positions, sizes, linePositions, lineColors } = fieldRef.current;

  const pointUniforms = useMemo(
    () => ({
      uColor: { value: ACCENT_COLOR },
      uOpacity: { value: 0.85 },
    }),
    [],
  );

  const mouseWorld = useRef(new THREE.Vector3(0, 0, LAYER_CONFIG[0].zMin));
  const scratchTarget = useRef(new THREE.Vector3());
  const scratchToMouse = useRef(new THREE.Vector3());
  const scratchFinal = useRef(new THREE.Vector3());

  useEffect(() => {
    const geometry = pointsGeometryRef.current;
    const lines = linesGeometryRef.current;
    const attrs = [geometry?.attributes.position, lines?.attributes.position, lines?.attributes.color];

    for (const attr of attrs) {
      if (attr instanceof THREE.BufferAttribute) {
        attr.setUsage(THREE.DynamicDrawUsage);
      }
    }
  }, [nodeCount, slotCount]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const pointsGeometry = pointsGeometryRef.current;
    const linesGeometry = linesGeometryRef.current;
    if (!group || !pointsGeometry || !linesGeometry) return;

    if (!reducedMotion) {
      group.rotation.y += 0.0004;
    }

    // Cursor mapeado pro plano da camada near (aproximação — não precisa de raycasting real).
    const camera = state.camera as THREE.PerspectiveCamera;
    const targetZ = LAYER_CONFIG[0].zMin;
    const distance = camera.position.z - targetZ;
    const vFov = (camera.fov * Math.PI) / 180;
    const halfHeight = Math.tan(vFov / 2) * distance;
    const halfWidth = halfHeight * (state.size.width / state.size.height);
    scratchTarget.current.set(state.pointer.x * halfWidth, state.pointer.y * halfHeight, targetZ);
    mouseWorld.current.lerp(scratchTarget.current, reducedMotion ? 1 : 0.08);

    const positionAttr = pointsGeometry.attributes.position as THREE.BufferAttribute;
    const elapsed = state.clock.elapsedTime;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (reducedMotion) {
        positionAttr.setXYZ(i, node.basePos.x, node.basePos.y, node.basePos.z);
        continue;
      }

      const oscX = Math.sin(elapsed * node.freq[0] + node.phase[0]) * node.amp;
      const oscY = Math.cos(elapsed * node.freq[1] + node.phase[1]) * node.amp;
      const oscZ = Math.sin(elapsed * node.freq[2] + node.phase[2]) * node.amp * 0.5;

      scratchToMouse.current.subVectors(mouseWorld.current, node.basePos);
      const dist = scratchToMouse.current.length();
      const strength = LAYER_CONFIG[node.layer].mouse;

      if (dist < MOUSE_RADIUS && dist > 0.0001) {
        const pull = (1 - dist / MOUSE_RADIUS) * strength * 0.6;
        scratchToMouse.current.normalize().multiplyScalar(pull);
        node.displacement.lerp(scratchToMouse.current, DAMPING);
      } else {
        node.displacement.lerp(scratchTarget.current.set(0, 0, 0), DAMPING);
      }

      scratchFinal.current
        .set(node.basePos.x + oscX, node.basePos.y + oscY, node.basePos.z + oscZ)
        .add(node.displacement);

      positionAttr.setXYZ(i, scratchFinal.current.x, scratchFinal.current.y, scratchFinal.current.z);
    }
    positionAttr.needsUpdate = true;

    const linePosAttr = linesGeometry.attributes.position as THREE.BufferAttribute;
    const lineColorAttr = linesGeometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];

      if (!reducedMotion) {
        slot.timer -= delta;

        switch (slot.state) {
          case 'idle': {
            if (slot.timer <= 0) {
              const pair = pickSlotPartner(nodes);
              if (pair) {
                slot.nodeA = pair[0];
                slot.nodeB = pair[1];
                slot.state = 'fadeIn';
                slot.timer = FADE_IN_S;
              } else {
                slot.timer = IDLE_JITTER_S;
              }
            }
            break;
          }
          case 'fadeIn': {
            slot.alpha = 1 - Math.max(slot.timer, 0) / FADE_IN_S;
            if (slot.timer <= 0) {
              slot.alpha = 1;
              slot.state = 'hold';
              slot.timer = HOLD_S + Math.random() * HOLD_JITTER_S;
            }
            break;
          }
          case 'hold': {
            if (slot.timer <= 0) {
              slot.state = 'fadeOut';
              slot.timer = FADE_OUT_S;
            }
            break;
          }
          case 'fadeOut': {
            slot.alpha = Math.max(slot.timer, 0) / FADE_OUT_S;
            if (slot.timer <= 0) {
              slot.alpha = 0;
              slot.state = 'idle';
              slot.timer = Math.random() * IDLE_JITTER_S;
            }
            break;
          }
        }
      }

      const a = positionAttr.count > slot.nodeA ? slot.nodeA : 0;
      const b = positionAttr.count > slot.nodeB ? slot.nodeB : 0;

      linePosAttr.setXYZ(i * 2, positionAttr.getX(a), positionAttr.getY(a), positionAttr.getZ(a));
      linePosAttr.setXYZ(
        i * 2 + 1,
        positionAttr.getX(b),
        positionAttr.getY(b),
        positionAttr.getZ(b),
      );
      lineColorAttr.setXYZW(i * 2, ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b, slot.alpha);
      lineColorAttr.setXYZW(i * 2 + 1, ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b, slot.alpha);
    }

    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry ref={pointsGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={pointUniforms}
          vertexShader={POINT_VERTEX_SHADER}
          fragmentShader={POINT_FRAGMENT_SHADER}
        />
      </points>
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.1} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

const POINT_VERTEX_SHADER = /* glsl */ `
  attribute float aSize;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (360.0 / -mvPosition.z);
  }
`;

const POINT_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    float delta = fwidth(r);
    float mask = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    if (mask <= 0.0) discard;
    gl_FragColor = vec4(uColor, uOpacity * mask);
  }
`;

function useIsHeroVisible(containerRef: React.RefObject<HTMLDivElement | null>): boolean {
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(element);

    function handleVisibilityChange() {
      setIsTabVisible(!document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [containerRef]);

  return isIntersecting && isTabVisible;
}

/**
 * Fundo do Hero: sistema neural vivo (Three.js/R3F) — nós em várias escalas e profundidades,
 * conexões que nascem e morrem, movimento orgânico e resposta amortecida ao mouse.
 * Carregado via React.lazy a partir de HeroCanvasSlot — isolado do bundle principal.
 */
export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsHeroVisible(containerRef);

  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [tier] = useState(() => getPerfTier(window.innerWidth));

  const frameloop = !isVisible ? 'never' : reducedMotion ? 'demand' : 'always';

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={tier.dpr}
        gl={{ antialias: true, alpha: true }}
        frameloop={frameloop}
      >
        <ParticleField
          nodeCount={tier.nodeCount}
          slotCount={tier.slotCount}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
