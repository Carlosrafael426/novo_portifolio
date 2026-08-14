import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { aboutContent } from '@/data/about';

const ACCENT_HEX = '#c6ff45';
const WHITE_HEX = '#f5f5f2';
const ACCENT_COLOR = new THREE.Color(ACCENT_HEX);
const WHITE_COLOR = new THREE.Color(WHITE_HEX);

// Perfil da cabeça (raio máximo em função da altura Y), do topo do crânio até a base do pescoço —
// os mesmos números validados na silhueta 2D anterior, só reescalados pra unidades de mundo 3D.
// A cabeça é gerada girando esse perfil em torno do eixo Y (um "torno"), o que garante uma forma
// arredondada e sem auto-interseção por construção — não depende de acertar um polígono à mão.
// Recentralizado em Y (o corte do pescoço deslocou o meio geométrico da cabeça pra cima — sem
// isso, a cabeça gira fora do próprio centro e fica baixa no enquadramento da câmera).
const PROFILE: Array<{ y: number; r: number }> = [
  { y: 0.98, r: 0 }, // topo do crânio
  { y: 0.86, r: 0.44 },
  { y: 0.58, r: 0.8 }, // têmpora, ponto mais largo do crânio
  { y: 0.24, r: 0.83 },
  { y: -0.08, r: 0.76 },
  { y: -0.38, r: 0.68 }, // zigomático — mais largo do rosto
  { y: -0.64, r: 0.54 }, // ângulo da mandíbula
  { y: -0.88, r: 0.34 }, // queixo, mais definido
  { y: -0.98, r: 0 }, // fecha logo abaixo do queixo — sem pescoço
];

const DEPTH_SCALE = 0.86; // a cabeça é um pouco mais achatada de frente pra trás do que de lado a lado

const EYE_ANGLE = 0.5;
const EYE_Y = -0.24;
const EYE_ANGLE_R = 0.28;
const EYE_Y_R = 0.16;

const BROW_Y = -0.06;
const BROW_ANGLE_R = 0.6;
const BROW_Y_R = 0.09;
const BROW_STRENGTH = 0.12;

const MOUTH_Y = -0.66;
const MOUTH_ANGLE_R = 0.15;
const MOUTH_Y_R = 0.06;

const NOSE_Y = -0.41;
const NOSE_ANGLE_R = 0.19;
const NOSE_Y_R = 0.22;
const NOSE_STRENGTH_BRIDGE = 0.34;
const NOSE_STRENGTH_TIP = 0.66;

const EAR_SIDES = [-1, 1] as const;
const EAR_Y = -0.34;
const EAR_RADIUS = 0.15;
const EAR_RING_POINTS = 11;
const EAR_LOBE_POINTS = 4;

const HEAD_NODE_COUNT = 480;
const NEIGHBORS_PER_NODE = 2;
const MAX_CONNECT_DISTANCE = 0.14;
const INTERSECTION_DEGREE = 4;
const PARTICLE_COUNT = 22;
const PARTICLE_SPEED_MIN = 0.09;
const PARTICLE_SPEED_MAX = 0.22;

const NODE_SIZE = 0.028;
const INTERSECTION_NODE_SIZE = 0.045; // ~50% menor que a versão anterior do desenho neural
const PARTICLE_SIZE = 0.045;
// Opacidade por nó varia com frontness (ver HeadNode) — lado do rosto bem mais visível que a
// nuca, senão a nuvem de pontos lê como uma esfera genérica em vez de uma cabeça com um lado de
// frente. Corte não-linear (só o hemisfério da frente ganha gradiente; o resto vai direto pro
// alpha de fundo) pra criar um limite de silhueta mais nítido, não um degradê suave.
const NODE_ALPHA_FRONT = 0.6;
const NODE_ALPHA_BACK = 0.05;
const INTERSECTION_ALPHA_FRONT = 0.9;
const INTERSECTION_ALPHA_BACK = 0.15;

function idleAlphaFor(frontness: number, isIntersection: boolean): number {
  const blend = Math.max(0, frontness);
  return isIntersection
    ? lerp(INTERSECTION_ALPHA_BACK, INTERSECTION_ALPHA_FRONT, blend)
    : lerp(NODE_ALPHA_BACK, NODE_ALPHA_FRONT, blend);
}
const IDLE_JITTER = 0.01;
// Amplitude do movimento lento dos estilhaços enquanto o texto está visível — bem maior e mais
// lento que o jitter ambiente do rosto montado, pra ler como destroços flutuando, não como ruído.
const DRIFT_AMPLITUDE = 0.07;

// Rotação da cabeça acompanhando o mouse (só desktop com ponteiro fino) — mesmos ângulos/damping
// da versão anterior, agora aplicados como rotação 3D real em vez de um tilt de CSS simulado.
const MAX_ROTATE_Y = 18;
const MAX_ROTATE_X = 8;
const ROTATE_RANGE_PX = 420;
const ROTATE_DAMPING = 0.06;

// Timings/eases idênticos à animação de explosão/reconstrução anterior (só reimplementados pra
// atualizar buffers Three.js em vez de atributos SVG) — não foram alterados.
const EXPLODE_NODE_DURATION = 0.7;
const EXPLODE_NODE_MAX_DELAY = 0.25;
const EXPLODE_TOTAL = EXPLODE_NODE_DURATION + EXPLODE_NODE_MAX_DELAY;
const EXPLODE_LINES_DURATION = 0.35;
const EXPLODE_PUSH_MIN = 0.55;
const EXPLODE_PUSH_MAX = 1.05;

const REFORM_NODE_DURATION = 0.8;
const REFORM_NODE_MAX_DELAY = 0.2;
const REFORM_TOTAL = REFORM_NODE_DURATION + REFORM_NODE_MAX_DELAY;
const REFORM_LINES_DELAY = 0.3;
const REFORM_LINES_DURATION = 0.6;

// Opacidade "de repouso" das linhas/partículas — o fade de explosão/reconstrução anima um fator
// 0..1 que multiplica por cima desse valor, nunca substitui (senão elas ficam presas em opacidade
// máxima depois de reconstruir).
const LINES_BASE_OPACITY = 0.16;
const PARTICLES_BASE_OPACITY = 0.9;

const easeExplode = gsap.parseEase('power2.out');
const easeReform = gsap.parseEase('power3.out');
const easeLines = gsap.parseEase('power1.out');

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function radiusAtHeight(y: number): number {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const a = PROFILE[i];
    const b = PROFILE[i + 1];
    if (y <= a.y && y >= b.y) {
      const t = (a.y - y) / (a.y - b.y || 1);
      return a.r + (b.r - a.r) * t;
    }
  }
  return y > PROFILE[0].y ? PROFILE[0].r : PROFILE[PROFILE.length - 1].r;
}

function insideEyeSocket(angle: number, y: number): boolean {
  for (const side of [-1, 1]) {
    const da = (angle - side * EYE_ANGLE) / EYE_ANGLE_R;
    const dy = (y - EYE_Y) / EYE_Y_R;
    if (da * da + dy * dy < 1) return true;
  }
  return false;
}

function insideMouth(angle: number, y: number): boolean {
  const da = angle / (MOUTH_ANGLE_R * 1.6);
  const dy = (y - MOUTH_Y) / (MOUTH_Y_R * 1.6);
  return da * da + dy * dy < 1;
}

/** Empurra o ponto pra fora — cria o nariz sem precisar de uma malha à parte. Mais saliente
 *  embaixo (ponta) do que em cima (ponte), pra não ficar um bulbo simétrico. */
function noseBulge(angle: number, y: number): number {
  const da = angle / NOSE_ANGLE_R;
  const dy = (y - NOSE_Y) / NOSE_Y_R;
  const d2 = da * da + dy * dy;
  if (d2 >= 1) return 0;
  const strength = y > NOSE_Y ? NOSE_STRENGTH_BRIDGE : NOSE_STRENGTH_TIP;
  return (1 - d2) * strength;
}

/** Leve saliência acima dos olhos — sem isso o rosto fica liso demais entre a testa e os olhos. */
function browBulge(angle: number, y: number): number {
  const da = angle / BROW_ANGLE_R;
  const dy = (y - BROW_Y) / BROW_Y_R;
  const d2 = da * da + dy * dy;
  if (d2 >= 1) return 0;
  return (1 - d2) * BROW_STRENGTH;
}

interface HeadNode {
  baseX: number;
  baseY: number;
  baseZ: number;
  x: number;
  y: number;
  z: number;
  /** cos(angle) no momento em que o nó foi gerado: 1 = rosto (frente), -1 = nuca (fundo do
   *  crânio) — fixo por nó e gira junto com a cabeça, usado só pra dar mais brilho ao lado do
   *  rosto do que ao "fundo" (sem isso, os pontos da nuca aparecem por trás com o mesmo peso
   *  visual dos pontos do rosto e a nuvem lê como uma esfera genérica, não como um rosto). */
  frontness: number;
}

function makeNode(x: number, y: number, z: number, frontness: number): HeadNode {
  return { baseX: x, baseY: y, baseZ: z, x, y, z, frontness };
}

// A maioria dos nós nasce no hemisfério da frente — não é só estética, é o que faz o rosto
// "ganhar" da nuca em densidade de pontos, além do gradiente de opacidade abaixo.
const FRONT_HEMISPHERE_BIAS = 0.82;

function buildHeadShellNodes(count: number): HeadNode[] {
  const nodes: HeadNode[] = [];
  const minY = PROFILE[PROFILE.length - 1].y;
  const maxY = PROFILE[0].y;
  let attempts = 0;

  while (nodes.length < count && attempts < count * 60) {
    attempts += 1;
    const y = minY + Math.random() * (maxY - minY);
    const maxR = radiusAtHeight(y);
    if (maxR < 0.03) continue;

    const angle =
      Math.random() < FRONT_HEMISPHERE_BIAS
        ? (Math.random() * 2 - 1) * (Math.PI / 2)
        : (Math.random() * 2 - 1) * Math.PI;
    if (insideEyeSocket(angle, y) || insideMouth(angle, y)) continue;

    const shellFrac = 0.82 + Math.random() * 0.18 + noseBulge(angle, y) + browBulge(angle, y);
    const r = maxR * shellFrac;

    nodes.push(makeNode(Math.sin(angle) * r, y, Math.cos(angle) * r * DEPTH_SCALE, Math.cos(angle)));
  }

  return nodes;
}

/**
 * Orelha com alguma estrutura reconhecível em vez de um borrão de pontos aleatórios: um "C" (a
 * hélice externa, aberta do lado que encosta na cabeça), um ponto central (concha) e um pequeno
 * aglomerado embaixo (lóbulo).
 */
function buildEarNodes(): HeadNode[] {
  const nodes: HeadNode[] = [];
  const baseR = radiusAtHeight(EAR_Y) * 1.02;

  for (const side of EAR_SIDES) {
    const cx = side * baseR;

    for (let i = 0; i < EAR_RING_POINTS; i++) {
      const t = i / (EAR_RING_POINTS - 1);
      const angle = lerp(-2.3, 2.3, t);
      const ru = Math.cos(angle) * EAR_RADIUS;
      const rv = Math.sin(angle) * EAR_RADIUS * 1.2;
      const jitter = (Math.random() - 0.5) * 0.012;
      nodes.push(makeNode(cx + side * (EAR_RADIUS * 0.4 + ru * 0.6 + jitter), EAR_Y + rv, side * ru * 0.35 + jitter, 0));
    }

    nodes.push(makeNode(cx + side * EAR_RADIUS * 0.35, EAR_Y, side * EAR_RADIUS * 0.12, 0));

    for (let i = 0; i < EAR_LOBE_POINTS; i++) {
      const v = -EAR_RADIUS * 1.1 - Math.random() * 0.05;
      const u = (Math.random() - 0.5) * 0.06;
      nodes.push(makeNode(cx + side * (EAR_RADIUS * 0.3 + u), EAR_Y + v, side * u, 0));
    }
  }

  return nodes;
}

const MOUTH_LINE_POINTS = 9;

/** Boca como uma linha deliberada (não só o vazio deixado pela exclusão) — sutilmente saliente,
 *  com uma leve curvatura pra cima nas pontas, mais "IA estilizada" do que um buraco no rosto. */
function buildMouthNodes(): HeadNode[] {
  const nodes: HeadNode[] = [];
  const maxR = radiusAtHeight(MOUTH_Y);

  for (let i = 0; i < MOUTH_LINE_POINTS; i++) {
    const t = i / (MOUTH_LINE_POINTS - 1) - 0.5;
    const angle = t * MOUTH_ANGLE_R * 2.2;
    const curve = Math.cos(t * Math.PI) * 0.014;
    const y = MOUTH_Y + curve;
    const r = maxR * 1.008;
    nodes.push(makeNode(Math.sin(angle) * r, y, Math.cos(angle) * r * DEPTH_SCALE, Math.cos(angle)));
  }

  for (let i = 0; i < MOUTH_LINE_POINTS - 3; i++) {
    const t = (i + 1) / (MOUTH_LINE_POINTS - 2) - 0.5;
    const angle = t * MOUTH_ANGLE_R * 1.7;
    const y = MOUTH_Y - 0.03;
    const r = maxR * 0.995;
    nodes.push(makeNode(Math.sin(angle) * r, y, Math.cos(angle) * r * DEPTH_SCALE, Math.cos(angle)));
  }

  return nodes;
}

function buildHeadNodes(): HeadNode[] {
  return [...buildHeadShellNodes(HEAD_NODE_COUNT), ...buildEarNodes(), ...buildMouthNodes()];
}

/**
 * Une componentes desconectados ao maior grafo (mesma garantia de "uma peça só" da versão 2D,
 * só que por distância euclidiana 3D — mantido local porque o util compartilhado só entende 2D).
 */
function connectComponents3D(nodes: HeadNode[], pairs: Array<[number, number]>): Array<[number, number]> {
  const parent = nodes.map((_, i) => i);
  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  function union(a: number, b: number) {
    parent[find(a)] = find(b);
  }
  for (const [a, b] of pairs) union(a, b);

  const result = [...pairs];
  for (;;) {
    const groups = new Map<number, number[]>();
    nodes.forEach((_, i) => {
      const root = find(i);
      const group = groups.get(root);
      if (group) group.push(i);
      else groups.set(root, [i]);
    });
    if (groups.size <= 1) break;

    const components = [...groups.values()];
    let best: { i: number; j: number; d: number } | null = null;
    for (let a = 0; a < components.length; a++) {
      for (let b = a + 1; b < components.length; b++) {
        for (const i of components[a]) {
          for (const j of components[b]) {
            const d = Math.hypot(
              nodes[i].baseX - nodes[j].baseX,
              nodes[i].baseY - nodes[j].baseY,
              nodes[i].baseZ - nodes[j].baseZ,
            );
            if (!best || d < best.d) best = { i, j, d };
          }
        }
      }
    }
    if (!best) break;
    result.push([best.i, best.j]);
    union(best.i, best.j);
  }

  return result;
}

function buildConnections(nodes: HeadNode[]): Array<[number, number]> {
  const seen = new Set<string>();
  const pairs: Array<[number, number]> = [];

  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({
        j,
        d: i === j ? Infinity : Math.hypot(node.baseX - other.baseX, node.baseY - other.baseY, node.baseZ - other.baseZ),
      }))
      .filter((entry) => entry.d < MAX_CONNECT_DISTANCE)
      .sort((a, b) => a.d - b.d)
      .slice(0, NEIGHBORS_PER_NODE);

    for (const { j } of nearest) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([i, j]);
    }
  });

  return connectComponents3D(nodes, pairs);
}

interface Particle {
  connectionIndex: number;
  progress: number;
  speed: number;
}

function buildParticles(connectionCount: number): Particle[] {
  return Array.from({ length: Math.min(PARTICLE_COUNT, connectionCount) }, () => ({
    connectionIndex: Math.floor(Math.random() * connectionCount),
    progress: Math.random(),
    speed: PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN),
  }));
}

function buildFace() {
  const nodes = buildHeadNodes();
  const connections = buildConnections(nodes);

  const degree = new Array(nodes.length).fill(0);
  for (const [a, b] of connections) {
    degree[a] += 1;
    degree[b] += 1;
  }
  const intersectionIndices: number[] = [];
  const regularIndices: number[] = [];
  nodes.forEach((_, i) => {
    if (degree[i] >= INTERSECTION_DEGREE) intersectionIndices.push(i);
    else regularIndices.push(i);
  });

  const nodeAlpha = nodes.map((node, i) => idleAlphaFor(node.frontness, degree[i] >= INTERSECTION_DEGREE));

  const particles = buildParticles(connections.length);

  return { nodes, connections, intersectionIndices, regularIndices, nodeAlpha, particles };
}

function isFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function mixToWhite(amount: number): THREE.Color {
  return ACCENT_COLOR.clone().lerp(WHITE_COLOR, amount);
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
  const { nodes, connections, intersectionIndices, regularIndices, nodeAlpha, particles } = data;

  const groupRef = useRef<THREE.Group>(null);
  const regularGeometryRef = useRef<THREE.BufferGeometry>(null);
  const intersectionGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const particlesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const particlesMaterialRef = useRef<THREE.PointsMaterial>(null);

  const buffers = useMemo(() => {
    const regularPositions = new Float32Array(regularIndices.length * 3);
    const regularColors = new Float32Array(regularIndices.length * 4);
    const intersectionPositions = new Float32Array(intersectionIndices.length * 3);
    const intersectionColors = new Float32Array(intersectionIndices.length * 4);
    const linePositions = new Float32Array(connections.length * 2 * 3);
    const particlePositions = new Float32Array(particles.length * 3);

    regularIndices.forEach((nodeIndex, i) => {
      const node = nodes[nodeIndex];
      regularPositions[i * 3] = node.x;
      regularPositions[i * 3 + 1] = node.y;
      regularPositions[i * 3 + 2] = node.z;
      regularColors[i * 4] = ACCENT_COLOR.r;
      regularColors[i * 4 + 1] = ACCENT_COLOR.g;
      regularColors[i * 4 + 2] = ACCENT_COLOR.b;
      regularColors[i * 4 + 3] = nodeAlpha[nodeIndex];
    });

    const intersectionTint = mixToWhite(0.4);
    intersectionIndices.forEach((nodeIndex, i) => {
      const node = nodes[nodeIndex];
      intersectionPositions[i * 3] = node.x;
      intersectionPositions[i * 3 + 1] = node.y;
      intersectionPositions[i * 3 + 2] = node.z;
      intersectionColors[i * 4] = intersectionTint.r;
      intersectionColors[i * 4 + 1] = intersectionTint.g;
      intersectionColors[i * 4 + 2] = intersectionTint.b;
      intersectionColors[i * 4 + 3] = nodeAlpha[nodeIndex];
    });

    return { regularPositions, regularColors, intersectionPositions, intersectionColors, linePositions, particlePositions };
  }, [nodes, connections, intersectionIndices, regularIndices, nodeAlpha, particles]);

  useEffect(() => {
    for (const geometry of [regularGeometryRef.current, intersectionGeometryRef.current, linesGeometryRef.current, particlesGeometryRef.current]) {
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

  function writeNodePosition(nodeIndex: number, listIndex: number, isIntersection: boolean) {
    const geometry = isIntersection ? intersectionGeometryRef.current : regularGeometryRef.current;
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

        regularIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, false));
        intersectionIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, true));
        if (regularGeometryRef.current) regularGeometryRef.current.attributes.position.needsUpdate = true;
        if (intersectionGeometryRef.current) intersectionGeometryRef.current.attributes.position.needsUpdate = true;

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
          node.x = target.x + Math.sin(elapsed * 0.15 + i) * DRIFT_AMPLITUDE;
          node.y = target.y + Math.cos(elapsed * 0.12 + i * 1.3) * DRIFT_AMPLITUDE;
          node.z = target.z + Math.sin(elapsed * 0.1 + i * 0.7) * DRIFT_AMPLITUDE;
        });

        regularIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, false));
        intersectionIndices.forEach((nodeIndex, i) => writeNodePosition(nodeIndex, i, true));
        if (regularGeometryRef.current) regularGeometryRef.current.attributes.position.needsUpdate = true;
        if (intersectionGeometryRef.current) intersectionGeometryRef.current.attributes.position.needsUpdate = true;
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

      regularIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, false);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / EXPLODE_NODE_DURATION));
        const alpha = lerp(nodeAlpha[nodeIndex], 0, easeExplode(localT));
        const color = regularGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });
      intersectionIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, true);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / EXPLODE_NODE_DURATION));
        const alpha = lerp(nodeAlpha[nodeIndex], 0, easeExplode(localT));
        const color = intersectionGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });

      if (regularGeometryRef.current) {
        regularGeometryRef.current.attributes.position.needsUpdate = true;
        regularGeometryRef.current.attributes.color.needsUpdate = true;
      }
      if (intersectionGeometryRef.current) {
        intersectionGeometryRef.current.attributes.position.needsUpdate = true;
        intersectionGeometryRef.current.attributes.color.needsUpdate = true;
      }

      writeConnectionsAndParticles();

      const groupT = Math.max(0, Math.min(1, globalTime / EXPLODE_LINES_DURATION));
      const fade = lerp(1, 0, easeLines(groupT));
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

      regularIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, false);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / REFORM_NODE_DURATION));
        const alpha = lerp(0, nodeAlpha[nodeIndex], easeReform(localT));
        const color = regularGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });
      intersectionIndices.forEach((nodeIndex, i) => {
        writeNodePosition(nodeIndex, i, true);
        const localT = Math.max(0, Math.min(1, (globalTime - delays[nodeIndex]) / REFORM_NODE_DURATION));
        const alpha = lerp(0, nodeAlpha[nodeIndex], easeReform(localT));
        const color = intersectionGeometryRef.current?.attributes.color as THREE.BufferAttribute | undefined;
        color?.setW(i, alpha);
      });

      if (regularGeometryRef.current) {
        regularGeometryRef.current.attributes.position.needsUpdate = true;
        regularGeometryRef.current.attributes.color.needsUpdate = true;
      }
      if (intersectionGeometryRef.current) {
        intersectionGeometryRef.current.attributes.position.needsUpdate = true;
        intersectionGeometryRef.current.attributes.color.needsUpdate = true;
      }

      writeConnectionsAndParticles();

      const groupT = Math.max(0, Math.min(1, (globalTime - REFORM_LINES_DELAY) / REFORM_LINES_DURATION));
      const fade = lerp(0, 1, easeLines(groupT));
      if (linesMaterialRef.current) linesMaterialRef.current.opacity = LINES_BASE_OPACITY * fade;
      if (particlesMaterialRef.current) particlesMaterialRef.current.opacity = PARTICLES_BASE_OPACITY * fade;
    }

    function explode() {
      if (modeRef.current !== 'idle') return;
      modeRef.current = 'transitioning';
      onDissolvedChange(true);

      if (reducedMotion) {
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
    <group ref={groupRef}>
      <points>
        <bufferGeometry ref={regularGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.regularPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.regularColors, 4]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} size={NODE_SIZE} />
      </points>

      <points>
        <bufferGeometry ref={intersectionGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.intersectionPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.intersectionColors, 4]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} size={INTERSECTION_NODE_SIZE} />
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
 * Cabeça humana em 3D (Three.js/R3F) renderizada como constelação — girada em torno do eixo Y a
 * partir de um perfil validado (garante forma redonda sem auto-interseção), com olhos/boca como
 * reentrâncias e nariz como saliência. Acompanha o mouse virando de verdade em 3D — olha pra tela
 * em repouso. Clique dispara a mesma explosão/reconstrução de sempre e revela o texto "sobre
 * mim"; clicar no texto reconstrói. Nunca toca o cursor nativo, só o próprio desenho.
 */
export function FaceGraphic({ className }: FaceGraphicProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dissolved, setDissolved] = useState(false);

  const dataRef = useRef<FaceData | null>(null);
  if (dataRef.current === null) {
    dataRef.current = buildFace();
  }

  const modeRef = useRef<Mode>('idle');
  const controlsRef = useRef<FaceControls>({ explode: () => {}, reform: () => {} });

  const [reducedMotion] = useState(() => prefersReducedMotion());
  const [fine] = useState(() => isFinePointer());
  const isVisible = useIsVisible(wrapperRef);
  const frameloop = !isVisible ? 'never' : reducedMotion ? 'demand' : 'always';

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative' }}>
      <div className="h-full w-full cursor-pointer" onClick={() => controlsRef.current.explode()}>
        <Canvas
          camera={{ position: [0, 0, 2.85], fov: 42 }}
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

      {/* fixed (não absolute dentro do próprio gráfico) pra aparecer no meio da tela — clicável
          quando visível pra reconstruir o rosto. */}
      <div
        onClick={() => controlsRef.current.reform()}
        className={`fixed inset-0 z-(--z-mobile-menu) flex items-center justify-center p-4 transition-opacity duration-500 sm:p-8 ${dissolved ? 'pointer-events-auto cursor-pointer opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div aria-hidden="true" className="bg-background/85 absolute inset-0" />
        <div className="relative max-h-[80vh] max-w-lg overflow-y-auto text-left font-mono text-[10px] leading-relaxed sm:text-xs">
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
  );
}
