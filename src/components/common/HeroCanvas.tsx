import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ACCENT_COLOR = new THREE.Color('#c6ff45');
const WHITE_COLOR = new THREE.Color('#f5f5f2');
const CONNECT_DISTANCE = 2.4;
const NEIGHBORS_PER_NODE = 6;

const FADE_IN_S = 0.6;
const FADE_OUT_S = 0.8;
const HOLD_S = 2.2;
const HOLD_JITTER_S = 2.5;
const IDLE_JITTER_S = 1.2;

const SEGMENTS_PER_LINE = 10;
const VERTS_PER_LINE = SEGMENTS_PER_LINE * 2;
const PULSE_WIDTH = 0.16;
const BASE_ALPHA = 0.08;
const PEAK_ALPHA = 0.85;
const PULSE_SPEED_MIN = 0.12;
const PULSE_SPEED_MAX = 0.3;

type Layer = 0 | 1 | 2;

const LAYER_CONFIG: Record<Layer, { zMin: number; zMax: number; amp: number }> = {
  0: { zMin: 1.2, zMax: 3, amp: 0.35 },
  1: { zMin: -1, zMax: 1.2, amp: 0.22 },
  2: { zMin: -3.6, zMax: -1, amp: 0.14 },
};

interface Tier {
  nodeCount: number;
  slotCount: number;
  dpr: number | [number, number];
}

// Contagens bem menores que antes: isso deixou de ser um flourish só do Hero (que parava de
// renderizar assim que saía de vista) e virou o fundo do site inteiro, sempre ativo enquanto a
// aba está visível — o custo de GPU agora é contínuo pela sessão toda, não só nos primeiros
// segundos. Menos nós/linhas e um dpr mais baixo reduzem esse custo, e evitam a pressão de
// composição que fazia outros elementos da página (bordas SVG dos painéis) falharem ao repintar
// durante o scroll.
function getPerfTier(width: number): Tier {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (coarse || width < 768) {
    return { nodeCount: 26, slotCount: 20, dpr: 1 };
  }
  if (cores >= 8 && width >= 1280) {
    return { nodeCount: 85, slotCount: 65, dpr: 1 };
  }
  return { nodeCount: 55, slotCount: 42, dpr: 1 };
}

interface NodeData {
  basePos: THREE.Vector3;
  phase: [number, number, number];
  freq: [number, number, number];
  amp: number;
  layer: Layer;
  neighbors: number[];
}

type SlotState = 'idle' | 'fadeIn' | 'hold' | 'fadeOut';

interface LineSlot {
  state: SlotState;
  nodeA: number;
  nodeB: number;
  timer: number;
  alpha: number;
  pulsePos: number;
  pulseSpeed: number;
  /** 0 = lima puro, 1 = branco puro — cada linha recebe um tom próprio nesse intervalo. */
  colorMix: number;
}

interface FieldData {
  nodes: NodeData[];
  slots: LineSlot[];
  nodeWorldPos: Float32Array;
  linePositions: Float32Array;
  lineColors: Float32Array;
}

function randomPulseSpeed(): number {
  return PULSE_SPEED_MIN + Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN);
}

function buildField(nodeCount: number, slotCount: number): FieldData {
  const nodes = buildNodes(nodeCount);
  const slots = buildSlots(slotCount, nodes);

  const nodeWorldPos = new Float32Array(nodeCount * 3);
  nodes.forEach((node, i) => {
    nodeWorldPos[i * 3] = node.basePos.x;
    nodeWorldPos[i * 3 + 1] = node.basePos.y;
    nodeWorldPos[i * 3 + 2] = node.basePos.z;
  });

  const linePositions = new Float32Array(slotCount * VERTS_PER_LINE * 3);
  const lineColors = new Float32Array(slotCount * VERTS_PER_LINE * 4);

  return { nodes, slots, nodeWorldPos, linePositions, lineColors };
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
      pulsePos: Math.random(),
      pulseSpeed: randomPulseSpeed(),
      colorMix: Math.random(),
    });
  }

  return slots;
}

/** Distância ao longo do laço 0..1, já considerando o wraparound do pulso. */
function loopDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

interface ConnectionFieldProps {
  nodeCount: number;
  slotCount: number;
  reducedMotion: boolean;
}

function ConnectionField({ nodeCount, slotCount, reducedMotion }: ConnectionFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);

  // Dados mutáveis da simulação (mutados por dentro do useFrame, nunca via setState) —
  // por isso vivem num ref com inicialização preguiçosa, não em useMemo/useState.
  const fieldRef = useRef<FieldData | null>(null);
  if (fieldRef.current === null) {
    fieldRef.current = buildField(nodeCount, slotCount);
  }
  const { nodes, slots, nodeWorldPos, linePositions, lineColors } = fieldRef.current;

  useEffect(() => {
    const lines = linesGeometryRef.current;
    const attrs = [lines?.attributes.position, lines?.attributes.color];

    for (const attr of attrs) {
      if (attr instanceof THREE.BufferAttribute) {
        attr.setUsage(THREE.DynamicDrawUsage);
      }
    }
  }, [nodeCount, slotCount]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const linesGeometry = linesGeometryRef.current;
    if (!group || !linesGeometry) return;

    if (!reducedMotion) {
      group.rotation.y += 0.0004;
    }

    const elapsed = state.clock.elapsedTime;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (reducedMotion) {
        nodeWorldPos[i * 3] = node.basePos.x;
        nodeWorldPos[i * 3 + 1] = node.basePos.y;
        nodeWorldPos[i * 3 + 2] = node.basePos.z;
        continue;
      }

      const oscX = Math.sin(elapsed * node.freq[0] + node.phase[0]) * node.amp;
      const oscY = Math.cos(elapsed * node.freq[1] + node.phase[1]) * node.amp;
      const oscZ = Math.sin(elapsed * node.freq[2] + node.phase[2]) * node.amp * 0.5;

      nodeWorldPos[i * 3] = node.basePos.x + oscX;
      nodeWorldPos[i * 3 + 1] = node.basePos.y + oscY;
      nodeWorldPos[i * 3 + 2] = node.basePos.z + oscZ;
    }

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
                slot.pulsePos = Math.random();
                slot.pulseSpeed = randomPulseSpeed();
                slot.colorMix = Math.random();
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

        slot.pulsePos = (slot.pulsePos + slot.pulseSpeed * delta) % 1;
      }

      const a = nodes.length > slot.nodeA ? slot.nodeA : 0;
      const b = nodes.length > slot.nodeB ? slot.nodeB : 0;

      const ax = nodeWorldPos[a * 3];
      const ay = nodeWorldPos[a * 3 + 1];
      const az = nodeWorldPos[a * 3 + 2];
      const bx = nodeWorldPos[b * 3];
      const by = nodeWorldPos[b * 3 + 1];
      const bz = nodeWorldPos[b * 3 + 2];

      const lineBase = i * VERTS_PER_LINE;

      // Tom de base da linha (fixo por slot) — varia entre lima puro e branco.
      const baseR = ACCENT_COLOR.r + (WHITE_COLOR.r - ACCENT_COLOR.r) * slot.colorMix;
      const baseG = ACCENT_COLOR.g + (WHITE_COLOR.g - ACCENT_COLOR.g) * slot.colorMix;
      const baseB = ACCENT_COLOR.b + (WHITE_COLOR.b - ACCENT_COLOR.b) * slot.colorMix;

      for (let seg = 0; seg < SEGMENTS_PER_LINE; seg++) {
        const t0 = seg / SEGMENTS_PER_LINE;
        const t1 = (seg + 1) / SEGMENTS_PER_LINE;

        const vertIndex = lineBase + seg * 2;
        linePosAttr.setXYZ(vertIndex, ax + (bx - ax) * t0, ay + (by - ay) * t0, az + (bz - az) * t0);
        linePosAttr.setXYZ(vertIndex + 1, ax + (bx - ax) * t1, ay + (by - ay) * t1, az + (bz - az) * t1);

        for (let v = 0; v < 2; v++) {
          const t = v === 0 ? t0 : t1;
          const pulse = reducedMotion
            ? 0
            : Math.max(0, 1 - loopDistance(t, slot.pulsePos) / PULSE_WIDTH);
          const glow = pulse * pulse;

          // O pulso clareia a linha em direção ao branco, por cima do tom de base.
          const r = baseR + (WHITE_COLOR.r - baseR) * glow;
          const g = baseG + (WHITE_COLOR.g - baseG) * glow;
          const bCol = baseB + (WHITE_COLOR.b - baseB) * glow;
          const alpha = (BASE_ALPHA + (PEAK_ALPHA - BASE_ALPHA) * glow) * slot.alpha;

          lineColorAttr.setXYZW(vertIndex + v, r, g, bCol, alpha);
        }
      }
    }

    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} />
      </lineSegments>
    </group>
  );
}

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
 * Fundo do site inteiro (Three.js/R3F): rede de conexões — sem nós visíveis, só linhas que
 * nascem e morrem, com um pulso neon viajando por cada uma. Renderizado uma única vez, fixo atrás
 * de todas as seções via SiteBackgroundSlot no RootLayout — não é mais exclusivo do Hero, apesar
 * do nome do arquivo. Carregado via React.lazy, isolado do bundle principal. Sem qualquer resposta
 * ao mouse (ver memória do usuário: efeitos reativos ao cursor não devem voltar a este site).
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
        <ConnectionField
          nodeCount={tier.nodeCount}
          slotCount={tier.slotCount}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
