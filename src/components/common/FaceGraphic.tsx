import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { aboutContent } from '@/data/about';
import faceMeshJson from '@/assets/face/face-mesh.json';

const ACCENT_HEX = '#c6ff45';
const WHITE_HEX = '#f5f5f2';
const ACCENT_COLOR = new THREE.Color(ACCENT_HEX);
const WHITE_COLOR = new THREE.Color(WHITE_HEX);

interface FaceMeshData {
  /** 938 × 3 floats: x, y, z de cada nó, já normalizados. */
  nodes: number[];
  /** 3.259 × 2 ints: pares de índice formando cada aresta. */
  edges: number[];
  /** Índices dos nós anatômicos (silhueta, sobrancelhas, olhos, nariz, lábios, mandíbula,
   *  orelhas, linha central) — sempre contíguos, 0 a 490. O resto é preenchimento de malha. */
  bright: number[];
}
const faceMesh = faceMeshJson as FaceMeshData;
const ANATOMICAL_COUNT = faceMesh.bright.length;

const FILL_NODE_SIZE = 0.017;
const ANATOMICAL_NODE_SIZE = 0.03;
const PARTICLE_SIZE = 0.032;

// Exagera o relevo da malha (que por natureza é raso, 0..0.62) — sem isso, o rosto lê como uma
// imagem achatada com relevo sutil em vez de algo genuinamente tridimensional.
const Z_DEPTH_SCALE = 1.9;

// O canvas agora cobre a seção inteira (não só uma caixinha), então o grupo precisa descer no
// espaço local pra não brigar com o título no topo da seção.
const GROUP_Y_OFFSET = -0.55;

// Escala geral do rosto — cresce em volta do próprio centro (a posição do grupo, acima, não é
// afetada pela escala), então isso não briga com o enquadramento já calibrado.
const FACE_SCALE = 1.3;

// Reduz a quantidade total de pontos (só no preenchimento — os 491 anatômicos continuam sempre
// intactos, senão o rosto perde legibilidade). No mobile corta ainda mais, por performance.
const POINT_COUNT_REDUCTION = 0.2;
const MOBILE_EXTRA_FILL_REDUCTION = 0.5;

// Opacidade em função de Z (saliência), não mais de "frontness" — a malha é uma calota frontal
// com relevo, não uma cabeça fechada, então não existe mais um lado "de trás" pra apagar. Nariz,
// testa e maçãs (mais salientes) acendem um pouco mais que o resto do mesmo grupo.
const ANATOMICAL_ALPHA_BASE = 0.52;
const ANATOMICAL_ALPHA_Z_BOOST = 0.32;
const FILL_ALPHA_BASE = 0.09;
const FILL_ALPHA_Z_BOOST = 0.12;

// Enquanto o texto está visível, os estilhaços não somem — recuam pra essa fração da opacidade
// de repouso e continuam à deriva atrás do texto, como plano de fundo vivo.
const DISSOLVED_ALPHA_FACTOR = 0.45;

const IDLE_JITTER = 0.01;
// Amplitude e velocidade do movimento lento dos estilhaços enquanto o texto está visível — bem
// maior e mais lento que o jitter ambiente do rosto montado, pra ler como uma constelação de
// estrelas flutuando devagar pela seção inteira, não como ruído.
const DRIFT_AMPLITUDE = 0.18;
const DRIFT_FREQ_X = 0.09;
const DRIFT_FREQ_Y = 0.07;
const DRIFT_FREQ_Z = 0.06;

// Rotação do rosto acompanhando o mouse (só desktop com ponteiro fino).
const MAX_ROTATE_Y = 26;
const MAX_ROTATE_X = 12;
const ROTATE_RANGE_PX = 420;
const ROTATE_DAMPING = 0.06;

const EXPLODE_NODE_DURATION = 0.7;
const EXPLODE_NODE_MAX_DELAY = 0.25;
const EXPLODE_TOTAL = EXPLODE_NODE_DURATION + EXPLODE_NODE_MAX_DELAY;
const EXPLODE_LINES_DURATION = 0.35;
// Bem maior que o rosto em si — os fragmentos precisam se espalhar pela seção inteira, não só
// pela caixinha onde o rosto vivia.
const EXPLODE_PUSH_MIN = 0.7;
const EXPLODE_PUSH_MAX = 1.9;

const REFORM_NODE_DURATION = 0.8;
const REFORM_NODE_MAX_DELAY = 0.2;
const REFORM_TOTAL = REFORM_NODE_DURATION + REFORM_NODE_MAX_DELAY;
const REFORM_LINES_DELAY = 0.3;
const REFORM_LINES_DURATION = 0.6;

// Opacidade "de repouso" das linhas/partículas — o fade de explosão/reconstrução anima um fator
// que multiplica por cima desse valor, nunca substitui (senão elas ficam presas depois de animar).
const LINES_BASE_OPACITY = 0.16;
const PARTICLES_BASE_OPACITY = 0.9;

const easeExplode = gsap.parseEase('power2.out');
const easeReform = gsap.parseEase('power3.out');
const easeLines = gsap.parseEase('power1.out');

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface HeadNode {
  baseX: number;
  baseY: number;
  baseZ: number;
  x: number;
  y: number;
  z: number;
}

function makeNode(x: number, y: number, z: number): HeadNode {
  return { baseX: x, baseY: y, baseZ: z, x, y, z };
}

function isFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function mixToWhite(amount: number): THREE.Color {
  return ACCENT_COLOR.clone().lerp(WHITE_COLOR, amount);
}

/**
 * Monta os nós/arestas a partir da malha fixa. Os 491 nós anatômicos continuam sempre presentes
 * (índices não mudam de posição no remapeamento, porque são sempre os primeiros a entrar) — só o
 * preenchimento é reduzido: um pouco pra todo mundo (POINT_COUNT_REDUCTION) e mais ainda no
 * mobile, por performance. Distribuição uniforme (tipo Bresenham) em vez de um stride fixo, pra
 * não ralar mais uma região específica do que outra dependendo da ordem dos vértices na malha.
 */
function buildMeshNodeSet(coarse: boolean) {
  const totalNodes = faceMesh.nodes.length / 3;
  const fillCount = totalNodes - ANATOMICAL_COUNT;
  const targetFillCount = Math.round(totalNodes * (1 - POINT_COUNT_REDUCTION)) - ANATOMICAL_COUNT;
  const fillKeepFraction =
    Math.max(0, Math.min(1, targetFillCount / fillCount)) * (coarse ? MOBILE_EXTRA_FILL_REDUCTION : 1);

  const keep = new Uint8Array(totalNodes);
  let fillLocalIndex = 0;
  for (let i = 0; i < totalNodes; i++) {
    if (i < ANATOMICAL_COUNT) {
      keep[i] = 1;
      continue;
    }
    fillLocalIndex += 1;
    const keepThis = Math.floor(fillLocalIndex * fillKeepFraction) !== Math.floor((fillLocalIndex - 1) * fillKeepFraction);
    keep[i] = keepThis ? 1 : 0;
  }

  const remap = new Int32Array(totalNodes).fill(-1);
  const nodes: HeadNode[] = [];
  let zMax = 0.0001;
  for (let i = 0; i < totalNodes; i++) {
    if (!keep[i]) continue;
    remap[i] = nodes.length;
    const x = faceMesh.nodes[i * 3];
    const y = faceMesh.nodes[i * 3 + 1];
    const z = faceMesh.nodes[i * 3 + 2] * Z_DEPTH_SCALE;
    if (z > zMax) zMax = z;
    nodes.push(makeNode(x, y, z));
  }

  const connections: Array<[number, number]> = [];
  for (let i = 0; i < faceMesh.edges.length; i += 2) {
    const a = faceMesh.edges[i];
    const b = faceMesh.edges[i + 1];
    if (keep[a] && keep[b]) connections.push([remap[a], remap[b]]);
  }

  const anatomicalIndices: number[] = [];
  const fillIndices: number[] = [];
  for (let i = 0; i < totalNodes; i++) {
    if (!keep[i]) continue;
    if (i < ANATOMICAL_COUNT) anatomicalIndices.push(remap[i]);
    else fillIndices.push(remap[i]);
  }

  return { nodes, connections, anatomicalIndices, fillIndices, zMax };
}

function buildNodeAlpha(nodeCount: number, anatomicalIndices: number[], nodes: HeadNode[], zMax: number): number[] {
  const isAnatomical = new Uint8Array(nodeCount);
  for (const i of anatomicalIndices) isAnatomical[i] = 1;

  return nodes.map((node, i) => {
    const zFactor = Math.max(0, Math.min(1, node.baseZ / zMax));
    return isAnatomical[i]
      ? ANATOMICAL_ALPHA_BASE + zFactor * ANATOMICAL_ALPHA_Z_BOOST
      : FILL_ALPHA_BASE + zFactor * FILL_ALPHA_Z_BOOST;
  });
}

interface Particle {
  connectionIndex: number;
  progress: number;
  speed: number;
}

const PARTICLE_COUNT = 22;
const PARTICLE_SPEED_MIN = 0.09;
const PARTICLE_SPEED_MAX = 0.22;

function buildParticles(connectionCount: number): Particle[] {
  return Array.from({ length: Math.min(PARTICLE_COUNT, connectionCount) }, () => ({
    connectionIndex: Math.floor(Math.random() * connectionCount),
    progress: Math.random(),
    speed: PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN),
  }));
}

function buildFace(coarse: boolean) {
  const { nodes, connections, anatomicalIndices, fillIndices, zMax } = buildMeshNodeSet(coarse);
  const nodeAlpha = buildNodeAlpha(nodes.length, anatomicalIndices, nodes, zMax);
  const particles = buildParticles(connections.length);

  return { nodes, connections, anatomicalIndices, fillIndices, nodeAlpha, particles };
}

type FaceData = ReturnType<typeof buildFace>;
type Mode = 'idle' | 'dissolved' | 'transitioning';

interface FaceControls {
  explode: () => void;
  reform: () => void;
}

interface HeadSceneProps {
  data: FaceData;
  modeRef: React.RefObject<Mode>;
  controlsRef: React.RefObject<FaceControls>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  fine: boolean;
  onDissolvedChange: (dissolved: boolean) => void;
}

function HeadScene({ data, modeRef, controlsRef, wrapperRef, reducedMotion, fine, onDissolvedChange }: HeadSceneProps) {
  const { nodes, connections, anatomicalIndices, fillIndices, nodeAlpha, particles } = data;

  const groupRef = useRef<THREE.Group>(null);
  const fillGeometryRef = useRef<THREE.BufferGeometry>(null);
  const anatomicalGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const particlesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const particlesMaterialRef = useRef<THREE.PointsMaterial>(null);

  const buffers = useMemo(() => {
    const fillPositions = new Float32Array(fillIndices.length * 3);
    const fillColors = new Float32Array(fillIndices.length * 4);
    const anatomicalPositions = new Float32Array(anatomicalIndices.length * 3);
    const anatomicalColors = new Float32Array(anatomicalIndices.length * 4);
    const linePositions = new Float32Array(connections.length * 2 * 3);
    const particlePositions = new Float32Array(particles.length * 3);

    fillIndices.forEach((nodeIndex, i) => {
      const node = nodes[nodeIndex];
      fillPositions[i * 3] = node.x;
      fillPositions[i * 3 + 1] = node.y;
      fillPositions[i * 3 + 2] = node.z;
      fillColors[i * 4] = ACCENT_COLOR.r;
      fillColors[i * 4 + 1] = ACCENT_COLOR.g;
      fillColors[i * 4 + 2] = ACCENT_COLOR.b;
      fillColors[i * 4 + 3] = nodeAlpha[nodeIndex];
    });

    const anatomicalTint = mixToWhite(0.4);
    anatomicalIndices.forEach((nodeIndex, i) => {
      const node = nodes[nodeIndex];
      anatomicalPositions[i * 3] = node.x;
      anatomicalPositions[i * 3 + 1] = node.y;
      anatomicalPositions[i * 3 + 2] = node.z;
      anatomicalColors[i * 4] = anatomicalTint.r;
      anatomicalColors[i * 4 + 1] = anatomicalTint.g;
      anatomicalColors[i * 4 + 2] = anatomicalTint.b;
      anatomicalColors[i * 4 + 3] = nodeAlpha[nodeIndex];
    });

    return { fillPositions, fillColors, anatomicalPositions, anatomicalColors, linePositions, particlePositions };
  }, [nodes, connections, anatomicalIndices, fillIndices, nodeAlpha, particles]);

  useEffect(() => {
    for (const geometry of [fillGeometryRef.current, anatomicalGeometryRef.current, linesGeometryRef.current, particlesGeometryRef.current]) {
      const position = geometry?.attributes.position;
      if (position instanceof THREE.BufferAttribute) position.setUsage(THREE.DynamicDrawUsage);
      const color = geometry?.attributes.color;
      if (color instanceof THREE.BufferAttribute) color.setUsage(THREE.DynamicDrawUsage);
    }
  }, []);

  const rotation = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0, active: false });
  const explodedTargetsRef = useRef<THREE.Vector3[] | null>(null);

  useEffect(() => {
    if (!fine || reducedMotion) return;
    function handlePointerMove(event: PointerEvent) {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.current.active = true;
    }
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [fine, reducedMotion]);

  function writeConnectionsAndParticles() {
    const linePos = linesGeometryRef.current?.attributes.position as THREE.BufferAttribute | undefined;
    if (linePos) {
      connections.forEach(([a, b], i) => {
        const na = nodes[a];
        const nb = nodes[b];
        linePos.setXYZ(i * 2, na.x, na.y, na.z);
        linePos.setXYZ(i * 2 + 1, nb.x, nb.y, nb.z);
      });
      linePos.needsUpdate = true;
    }

    const particlePos = particlesGeometryRef.current?.attributes.position as THREE.BufferAttribute | undefined;
    if (particlePos) {
      particles.forEach((particle, i) => {
        const [a, b] = connections[particle.connectionIndex];
        const na = nodes[a];
        const nb = nodes[b];
        particlePos.setXYZ(
          i,
          na.x + (nb.x - na.x) * particle.progress,
          na.y + (nb.y - na.y) * particle.progress,
          na.z + (nb.z - na.z) * particle.progress,
        );
      });
      particlePos.needsUpdate = true;
    }
  }

  function writeNodePosition(nodeIndex: number, listIndex: number, isAnatomical: boolean) {
    const geometry = isAnatomical ? anatomicalGeometryRef.current : fillGeometryRef.current;
    const position = geometry?.attributes.position as THREE.BufferAttribute | undefined;
    if (!position) return;
    const node = nodes[nodeIndex];
    position.setXYZ(listIndex, node.x, node.y, node.z);
  }

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (modeRef.current === 'idle') {
      if (!reducedMotion) {
        const elapsed = state.clock.elapsedTime;

        for (const particle of particles) {
          particle.progress = (particle.progress + particle.speed * delta) % 1;
        }

        nodes.forEach((node, i) => {
          node.x = node.baseX + Math.sin(elapsed * 0.4 + i) * IDLE_JITTER;
          node.y = node.baseY + Math.cos(elapsed * 0.35 + i * 1.3) * IDLE_JITTER;
          node.z = node.baseZ + Math.sin(elapsed * 0.3 + i * 0.7) * IDLE_JITTER;
        });

        fillIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, false));
        anatomicalIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, true));
        if (fillGeometryRef.current) fillGeometryRef.current.attributes.position.needsUpdate = true;
        if (anatomicalGeometryRef.current) anatomicalGeometryRef.current.attributes.position.needsUpdate = true;

        writeConnectionsAndParticles();
      }

      if (fine && !reducedMotion) {
        let targetY = 0;
        let targetX = 0;
        const wrapper = wrapperRef.current;
        if (pointer.current.active && wrapper) {
          const rect = wrapper.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dx = pointer.current.x - centerX;
          const dy = pointer.current.y - centerY;
          targetY = Math.max(-1, Math.min(1, dx / ROTATE_RANGE_PX)) * MAX_ROTATE_Y;
          targetX = Math.max(-1, Math.min(1, -dy / ROTATE_RANGE_PX)) * MAX_ROTATE_X;
        }
        rotation.current.y += (targetY - rotation.current.y) * ROTATE_DAMPING;
        rotation.current.x += (targetX - rotation.current.x) * ROTATE_DAMPING;
        group.rotation.y = THREE.MathUtils.degToRad(rotation.current.y);
        group.rotation.x = THREE.MathUtils.degToRad(rotation.current.x);
      }
    } else if (modeRef.current === 'dissolved' && !reducedMotion) {
      // Estilhaços continuam à deriva bem devagar no fundo, atrás do texto, em vez de
      // congelarem no ponto exato onde a explosão parou.
      const targets = explodedTargetsRef.current;
      if (targets) {
        const elapsed = state.clock.elapsedTime;

        nodes.forEach((node, i) => {
          const target = targets[i];
          node.x = target.x + Math.sin(elapsed * DRIFT_FREQ_X + i) * DRIFT_AMPLITUDE;
          node.y = target.y + Math.cos(elapsed * DRIFT_FREQ_Y + i * 1.3) * DRIFT_AMPLITUDE;
          node.z = target.z + Math.sin(elapsed * DRIFT_FREQ_Z + i * 0.7) * DRIFT_AMPLITUDE;
        });

        fillIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, false));
        anatomicalIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, true));
        if (fillGeometryRef.current) fillGeometryRef.current.attributes.position.needsUpdate = true;
        if (anatomicalGeometryRef.current) anatomicalGeometryRef.current.attributes.position.needsUpdate = true;

        writeConnectionsAndParticles();
      }
    }
  });

  useEffect(() => {
    function applyExplodeFrame(t: number, delays: number[], targets: THREE.Vector3[]) {
      const globalTime = t * EXPLODE_TOTAL;

      nodes.forEach((node, i) => {
        const localT = Math.max(0, Math.min(1, (globalTime - delays[i]) / EXPLODE_NODE_DURATION));
        const eased = easeExplode(localT);
        node.x = lerp(node.baseX, targets[i].x, eased);
        node.y = lerp(node.baseY, targets[i].y, eased);
        node.z = lerp(node.baseZ, targets[i].z, eased);
      });

      fillIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, false);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / EXPLODE_NODE_DURATION));
        const alpha = lerp(nodeAlpha[nodeIndex], nodeAlpha[nodeIndex] * DISSOLVED_ALPHA_FACTOR, easeExplode(localT));
        const color = fillGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });
      anatomicalIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, true);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / EXPLODE_NODE_DURATION));
        const alpha = lerp(nodeAlpha[nodeIndex], nodeAlpha[nodeIndex] * DISSOLVED_ALPHA_FACTOR, easeExplode(localT));
        const color = anatomicalGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });

      if (fillGeometryRef.current) {
        fillGeometryRef.current.attributes.position.needsUpdate = true;
        fillGeometryRef.current.attributes.color.needsUpdate = true;
      }
      if (anatomicalGeometryRef.current) {
        anatomicalGeometryRef.current.attributes.position.needsUpdate = true;
        anatomicalGeometryRef.current.attributes.color.needsUpdate = true;
      }

      writeConnectionsAndParticles();

      const groupT = Math.max(0, Math.min(1, globalTime / EXPLODE_LINES_DURATION));
      const fade = lerp(1, DISSOLVED_ALPHA_FACTOR, easeLines(groupT));
      if (linesMaterialRef.current) linesMaterialRef.current.opacity = LINES_BASE_OPACITY * fade;
      if (particlesMaterialRef.current) particlesMaterialRef.current.opacity = PARTICLES_BASE_OPACITY * fade;
    }

    function applyReformFrame(t: number, delays: number[], starts: THREE.Vector3[]) {
      const globalTime = t * REFORM_TOTAL;

      nodes.forEach((node, i) => {
        const localT = Math.max(0, Math.min(1, (globalTime - delays[i]) / REFORM_NODE_DURATION));
        const eased = easeReform(localT);
        node.x = lerp(starts[i].x, node.baseX, eased);
        node.y = lerp(starts[i].y, node.baseY, eased);
        node.z = lerp(starts[i].z, node.baseZ, eased);
      });

      fillIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, false);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / REFORM_NODE_DURATION));
        const alpha = lerp(nodeAlpha[nodeIndex] * DISSOLVED_ALPHA_FACTOR, nodeAlpha[nodeIndex], easeReform(localT));
        const color = fillGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });
      anatomicalIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, true);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / REFORM_NODE_DURATION));
        const alpha = lerp(nodeAlpha[nodeIndex] * DISSOLVED_ALPHA_FACTOR, nodeAlpha[nodeIndex], easeReform(localT));
        const color = anatomicalGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });

      if (fillGeometryRef.current) {
        fillGeometryRef.current.attributes.position.needsUpdate = true;
        fillGeometryRef.current.attributes.color.needsUpdate = true;
      }
      if (anatomicalGeometryRef.current) {
        anatomicalGeometryRef.current.attributes.position.needsUpdate = true;
        anatomicalGeometryRef.current.attributes.color.needsUpdate = true;
      }

      writeConnectionsAndParticles();

      const groupT = Math.max(0, Math.min(1, (globalTime - REFORM_LINES_DELAY) / REFORM_LINES_DURATION));
      const fade = lerp(DISSOLVED_ALPHA_FACTOR, 1, easeLines(groupT));
      if (linesMaterialRef.current) linesMaterialRef.current.opacity = LINES_BASE_OPACITY * fade;
      if (particlesMaterialRef.current) particlesMaterialRef.current.opacity = PARTICLES_BASE_OPACITY * fade;
    }

    // Sem animação (usado só em prefers-reduced-motion): aplica a opacidade de repouso (dimmed
    // ou cheia) na hora, sem tween — senão os fragmentos ficam presos na opacidade cheia atrás
    // do texto, já que o caminho normal que os apaga um pouco é o próprio tween do GSAP.
    function setDimmed(dimmed: boolean) {
      const factor = dimmed ? DISSOLVED_ALPHA_FACTOR : 1;

      fillIndices.forEach((nodeIndex, i) => {
        const color = fillGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, nodeAlpha[nodeIndex] * factor);
      });
      anatomicalIndices.forEach((nodeIndex, i) => {
        const color = anatomicalGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, nodeAlpha[nodeIndex] * factor);
      });
      if (fillGeometryRef.current) fillGeometryRef.current.attributes.color.needsUpdate = true;
      if (anatomicalGeometryRef.current) anatomicalGeometryRef.current.attributes.color.needsUpdate = true;

      if (linesMaterialRef.current) linesMaterialRef.current.opacity = LINES_BASE_OPACITY * factor;
      if (particlesMaterialRef.current) particlesMaterialRef.current.opacity = PARTICLES_BASE_OPACITY * factor;
    }

    function explode() {
      if (modeRef.current !== 'idle') return;
      modeRef.current = 'transitioning';
      onDissolvedChange(true);

      if (reducedMotion) {
        setDimmed(true);
        modeRef.current = 'dissolved';
        return;
      }

      const delays = nodes.map(() => Math.random() * EXPLODE_NODE_MAX_DELAY);
      const targets = nodes.map((node) => {
        const dist = Math.hypot(node.baseX, node.baseY, node.baseZ) || 1;
        const push = EXPLODE_PUSH_MIN + Math.random() * (EXPLODE_PUSH_MAX - EXPLODE_PUSH_MIN);
        return new THREE.Vector3(
          node.baseX + (node.baseX / dist) * push,
          node.baseY + (node.baseY / dist) * push,
          node.baseZ + (node.baseZ / dist) * push,
        );
      });

      const driver = { t: 0 };
      gsap.to(driver, {
        t: 1,
        duration: EXPLODE_TOTAL,
        ease: 'none',
        onUpdate: () => applyExplodeFrame(driver.t, delays, targets),
        onComplete: () => {
          explodedTargetsRef.current = targets;
          modeRef.current = 'dissolved';
        },
      });
    }

    function reform() {
      if (modeRef.current !== 'dissolved') return;
      modeRef.current = 'transitioning';
      onDissolvedChange(false);

      if (reducedMotion) {
        setDimmed(false);
        modeRef.current = 'idle';
        return;
      }

      const delays = nodes.map(() => Math.random() * REFORM_NODE_MAX_DELAY);
      const starts = nodes.map((node) => new THREE.Vector3(node.x, node.y, node.z));

      const driver = { t: 0 };
      gsap.to(driver, {
        t: 1,
        duration: REFORM_TOTAL,
        ease: 'none',
        onUpdate: () => applyReformFrame(driver.t, delays, starts),
        onComplete: () => {
          nodes.forEach((node) => {
            node.x = node.baseX;
            node.y = node.baseY;
            node.z = node.baseZ;
          });
          modeRef.current = 'idle';
        },
      });
    }

    controlsRef.current = { explode, reform };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dados/refs são estáveis (lazy-init), não precisam entrar nas deps
  }, []);

  return (
    <group ref={groupRef} position={[0, GROUP_Y_OFFSET, 0]} scale={FACE_SCALE}>
      <points>
        <bufferGeometry ref={fillGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.fillPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.fillColors, 4]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} size={FILL_NODE_SIZE} />
      </points>

      <points>
        <bufferGeometry ref={anatomicalGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.anatomicalPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.anatomicalColors, 4]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} size={ANATOMICAL_NODE_SIZE} />
      </points>

      <lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={linesMaterialRef} color={ACCENT_HEX} transparent opacity={LINES_BASE_OPACITY} depthWrite={false} />
      </lineSegments>

      <points>
        <bufferGeometry ref={particlesGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={particlesMaterialRef}
          color={WHITE_HEX}
          transparent
          opacity={PARTICLES_BASE_OPACITY}
          sizeAttenuation
          depthWrite={false}
          size={PARTICLE_SIZE}
        />
      </points>
    </group>
  );
}

function useIsVisible(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), { threshold: 0 });
    observer.observe(element);

    function handleVisibilityChange() {
      setIsTabVisible(!document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ref]);

  return isIntersecting && isTabVisible;
}

interface CodeLine {
  text: string;
  className: string;
}

const CODE_LINES: CodeLine[] = [
  { text: '// sobre-mim.ts', className: 'text-accent' },
  ...aboutContent.bio.map((paragraph) => ({ text: `// ${paragraph}`, className: 'text-foreground/90 mt-2' })),
  { text: '/**', className: 'text-accent mt-3' },
  { text: ` * ${aboutContent.philosophy}`, className: 'text-foreground/90 italic' },
  { text: ' */', className: 'text-accent' },
  ...aboutContent.lookingFor.map((item) => ({ text: `// - ${item}`, className: 'text-muted mt-1' })),
];

interface FaceGraphicProps {
  className?: string;
}

/**
 * Rosto humano em 3D (Three.js/R3F), constelação sobre uma malha fixa (938 nós, 3.259 arestas)
 * extraída da referência visual, com profundidade Z exagerada pra ler como volume de verdade.
 * Os 491 nós anatômicos (olhos, nariz, lábios, sobrancelhas, mandíbula, orelhas, silhueta)
 * brilham mais que o preenchimento da malha. Acompanha o mouse virando em 3D. Um clique — ou
 * Enter/Espaço no controle focável — dispara a explosão: os nós se espalham pela seção inteira
 * como uma constelação de estrelas à deriva lenta (não somem, só recuam de opacidade) e o texto
 * "sobre mim" aparece na própria seção — não como modal, sem scroll da página enquanto visível.
 * Clicar no texto ou no botão "voltar" reconstrói o rosto. Nunca toca o cursor nativo, só o
 * próprio desenho.
 */
export function FaceGraphic({ className }: FaceGraphicProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dissolved, setDissolved] = useState(false);

  const dataRef = useRef<FaceData | null>(null);
  if (dataRef.current === null) {
    dataRef.current = buildFace(isCoarsePointer());
  }

  const modeRef = useRef<Mode>('idle');
  const controlsRef = useRef<FaceControls>({ explode: () => {}, reform: () => {} });

  const [reducedMotion] = useState(() => prefersReducedMotion());
  const [fine] = useState(() => isFinePointer());
  const isVisible = useIsVisible(wrapperRef);
  const frameloop = !isVisible ? 'never' : reducedMotion ? 'demand' : 'always';

  // Trava o scroll da página enquanto o texto está visível — ele agora vive na própria seção, não
  // num modal separado, então sem isso o usuário rolaria a página "por baixo" do texto revelado.
  useEffect(() => {
    if (!dissolved) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [dissolved]);

  return (
    <div ref={wrapperRef} className={className}>
      <button
        type="button"
        onClick={() => controlsRef.current.explode()}
        aria-label="Revelar mais sobre Carlos Rafael"
        aria-expanded={dissolved}
        tabIndex={dissolved ? -1 : undefined}
        className="outline-none block h-full w-full cursor-pointer appearance-none border-0 bg-transparent p-0 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <div aria-hidden="true" className="h-full w-full">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            frameloop={frameloop}
          >
            <HeadScene
              data={dataRef.current}
              modeRef={modeRef}
              controlsRef={controlsRef}
              wrapperRef={wrapperRef}
              reducedMotion={reducedMotion}
              fine={fine}
              onDissolvedChange={setDissolved}
            />
          </Canvas>
        </div>
      </button>

      {/* absolute dentro da própria seção (não fixed/tela cheia) — o texto aparece na página, no
          lugar onde o rosto estava, não como um modal flutuando por cima de tudo. Sem scrim de
          tela cheia: os estilhaços continuam visíveis e à deriva atrás do texto, só a coluna de
          texto ganha um véu localizado. */}
      <div
        onClick={() => controlsRef.current.reform()}
        className={`absolute inset-0 z-10 flex items-center justify-center p-4 transition-opacity duration-500 sm:p-8 ${dissolved ? 'pointer-events-auto cursor-pointer opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="relative max-h-[80vh] max-w-lg overflow-y-auto">
          {/* Véu localizado, só atrás do bloco de texto — cantos arredondados generosos em vez de
              uma máscara radial: um degradê elíptico deixa os cantos de um bloco alto e estreito
              (como no mobile) mal cobertos, sem escurecer o suficiente pra manter o contraste. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -inset-y-6 rounded-[2.5rem] sm:-inset-x-12 sm:-inset-y-10"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {dissolved && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                controlsRef.current.reform();
              }}
              aria-label="Voltar para a visualização do rosto"
              className="outline-none relative float-right -mt-1 -mr-1 mb-2 font-mono text-[10px] tracking-wide text-muted uppercase hover:text-foreground focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-xs"
            >
              Voltar ×
            </button>
          )}

          <div className="relative clear-both text-left font-mono text-[10px] leading-relaxed sm:text-xs">
            {CODE_LINES.map((line, index) => (
              <p
                key={index}
                className={`${line.className} transition-opacity duration-400 ease-out ${dissolved ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: dissolved ? `${index * 70}ms` : '0ms' }}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
