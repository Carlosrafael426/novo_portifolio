import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { aboutContent } from '@/data/about';
import type { RichText } from '@/types/about';
import headMeshJson from '@/assets/face/head-mesh.json';

const ACCENT_HEX = '#c6ff45';
const ACCENT_COLOR = new THREE.Color(ACCENT_HEX);

interface HeadMeshData {
  /** 1.601 × 3 floats: x, y, z de cada vértice, já centrados na origem e escalados pra 2 de altura. */
  nodes: number[];
  /** 4.797 × 2 ints: pares de índice formando cada aresta única do wireframe. */
  edges: number[];
}
const headMesh = headMeshJson as HeadMeshData;

const POINT_SIZE = 0.042;
const POINT_SPRITE_SIZE = 64;

// Enquadramento: a cabeça (y de 0 a 1 na malha) ocupa o miolo da tela e os ombros ficam cortados
// pela borda de baixo — mesmo enquadramento da referência. No mobile a escala cai bastante: a
// câmera mantém o FOV vertical, então numa tela em pé a largura visível encolhe muito e os ombros
// (bem mais largos que a cabeça) vazariam pelas laterais.
const HEAD_SCALE = 1.7;
const MOBILE_HEAD_SCALE = 1.15;

/** Mantém o centro da cabeça (y≈0.5 na malha) sempre no mesmo ponto da tela, qualquer que seja a
 *  escala. */
function groupYOffset(scale: number): number {
  return 0.1 - 0.5 * scale;
}

// No mobile os pontos encolhem um pouco (sprite com halo é fill-rate bound) — mas a contagem de
// vértices é a mesma: não dá pra ralar vértices de uma malha triangulada, porque cada um que sai
// leva junto todas as arestas que tocava e o wireframe aparece rasgado. 1.601 pontos e 4.797
// linhas são baratos; o que custa é área pintada, e isso o tamanho do ponto resolve.
const MOBILE_POINT_SIZE_FACTOR = 0.75;

// A cabeça é fechada (z de -0.65 a 0.65), então existe um lado de trás de verdade: pontos e
// arestas da frente acendem mais que os de trás. Sem isso a nuca aparece com o mesmo peso do
// rosto e a leitura vira confusão — mas some por completo também não pode, porque a
// transparência do wireframe (enxergar o outro lado) faz parte do visual.
const ALPHA_BACK = 0.55;
const ALPHA_FRONT = 1;
const LINE_ALPHA_BACK = 0.22;
const LINE_ALPHA_FRONT = 0.68;

// Enquanto o texto está visível, os estilhaços não somem — recuam pra essa fração da opacidade
// de repouso e continuam à deriva atrás do texto, como plano de fundo vivo.
const DISSOLVED_ALPHA_FACTOR = 0.28;

// Cintilância: parte dos vértices pulsa de brilho, virando as "estrelas" mais fortes do wireframe.
// Brilho pulsando lê como malha viva; oscilar posição leria como tremor.
const TWINKLE_FRACTION = 0.16;
const TWINKLE_AMPLITUDE = 0.5;
const TWINKLE_SPEED_MIN = 0.6;
const TWINKLE_SPEED_MAX = 1.8;
// Os pontos que cintilam também são desenhados maiores — são eles que dão o aspecto de nó
// brilhante da referência, em vez de todos os vértices terem o mesmo peso.
const TWINKLE_SIZE_BOOST = 2.1;

// Amplitude e velocidade do movimento lento dos estilhaços enquanto o texto está visível — pra
// ler como uma constelação de estrelas flutuando devagar pela seção inteira, não como ruído.
const DRIFT_AMPLITUDE = 0.18;
const DRIFT_FREQ_X = 0.09;
const DRIFT_FREQ_Y = 0.07;
const DRIFT_FREQ_Z = 0.06;

// Rotação acompanhando o mouse (só desktop com ponteiro fino). Agora que a cabeça é fechada e
// tem volume de verdade, girar mais compensa: mostra que é um objeto 3D, não um recorte.
const MAX_ROTATE_Y = 24;
const MAX_ROTATE_X = 10;
const ROTATE_RANGE_PX = 420;
const ROTATE_DAMPING = 0.06;

const EXPLODE_NODE_DURATION = 0.7;
const EXPLODE_NODE_MAX_DELAY = 0.25;
const EXPLODE_TOTAL = EXPLODE_NODE_DURATION + EXPLODE_NODE_MAX_DELAY;
const EXPLODE_PUSH_MIN = 1.6;
const EXPLODE_PUSH_MAX = 4.5;
// As arestas apagam bem antes dos pontos terminarem de voar: esticadas até o fim da dispersão,
// elas viram um emaranhado de linhas atravessando a seção inteira. Some cedo, e o que resta é o
// campo de estrelas.
const EXPLODE_LINES_DURATION = 0.3;

const REFORM_NODE_DURATION = 0.8;
const REFORM_NODE_MAX_DELAY = 0.2;
const REFORM_TOTAL = REFORM_NODE_DURATION + REFORM_NODE_MAX_DELAY;
// Na volta as linhas só reaparecem depois que os pontos já estão quase no lugar, senão elas
// reaparecem esticadas.
const REFORM_LINES_DELAY = 0.55;
const REFORM_LINES_DURATION = 0.45;

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

let pointSprite: THREE.CanvasTexture | null = null;

/**
 * Sprite radial (branco opaco no centro → transparente na borda) usado como `map` dos pontos. Sem
 * ele o `PointsMaterial` desenha quadrados duros, que leem como malha de colisão em vez de
 * constelação. A textura é branca de propósito: quem tinge é a cor por vértice.
 *
 * Singleton de módulo — os dois materiais compartilham a mesma textura, e ela vive enquanto a aba
 * viver (não é descartada no unmount justamente pra não refazer o canvas a cada remontagem).
 */
function getPointSprite(): THREE.CanvasTexture {
  if (pointSprite) return pointSprite;

  const canvas = document.createElement('canvas');
  canvas.width = POINT_SPRITE_SIZE;
  canvas.height = POINT_SPRITE_SIZE;

  const context = canvas.getContext('2d');
  if (context) {
    const center = POINT_SPRITE_SIZE / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, POINT_SPRITE_SIZE, POINT_SPRITE_SIZE);
  }

  pointSprite = new THREE.CanvasTexture(canvas);
  return pointSprite;
}

/** Monta vértices e arestas a partir da malha fixa, inteira: a topologia do wireframe não pode ser
 *  reduzida em runtime sem rasgar a malha. */
function buildMeshNodeSet() {
  const totalNodes = headMesh.nodes.length / 3;

  const nodes: HeadNode[] = [];
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 0; i < totalNodes; i++) {
    const x = headMesh.nodes[i * 3];
    const y = headMesh.nodes[i * 3 + 1];
    const z = headMesh.nodes[i * 3 + 2];
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
    nodes.push(makeNode(x, y, z));
  }

  const connections: Array<[number, number]> = [];
  for (let i = 0; i < headMesh.edges.length; i += 2) {
    connections.push([headMesh.edges[i], headMesh.edges[i + 1]]);
  }

  return { nodes, connections, zMin, zMax };
}

/** Alpha de repouso por profundidade: frente acesa, nuca recuada — mas nunca zerada, porque
 *  enxergar o outro lado através do wireframe faz parte do visual. */
function buildNodeAlpha(nodes: HeadNode[], zMin: number, zMax: number): number[] {
  const span = zMax - zMin || 1;
  return nodes.map((node) => {
    const depth = (node.baseZ - zMin) / span;
    return lerp(ALPHA_BACK, ALPHA_FRONT, depth);
  });
}

interface TwinkleData {
  /** 1 nos vértices que cintilam (desenhados maiores, viram os nós brilhantes), 0 no resto. */
  isTwinkle: Uint8Array;
  phase: Float32Array;
  speed: Float32Array;
}

/** Sorteia quais vértices cintilam, com fase e velocidade próprias pra não pulsarem em bloco. */
function buildTwinkle(nodeCount: number): TwinkleData {
  const isTwinkle = new Uint8Array(nodeCount);
  const phase = new Float32Array(nodeCount);
  const speed = new Float32Array(nodeCount);

  // Fisher-Yates parcial: sorteia sem repetir, sem embaralhar a lista inteira.
  const pool = Array.from({ length: nodeCount }, (_, i) => i);
  const count = Math.round(nodeCount * TWINKLE_FRACTION);
  for (let i = 0; i < count; i++) {
    const pick = i + Math.floor(Math.random() * (pool.length - i));
    const nodeIndex = pool[pick];
    pool[pick] = pool[i];
    pool[i] = nodeIndex;

    isTwinkle[nodeIndex] = 1;
    phase[nodeIndex] = Math.random() * Math.PI * 2;
    speed[nodeIndex] = TWINKLE_SPEED_MIN + Math.random() * (TWINKLE_SPEED_MAX - TWINKLE_SPEED_MIN);
  }

  return { isTwinkle, phase, speed };
}

/** Centro de massa de verdade, não o (0,0,0) da malha: explodir a partir do centroide espalha os
 *  vértices de forma coerente ao redor de um ponto só. */
function computeCentroid(nodes: HeadNode[]): THREE.Vector3 {
  const sum = new THREE.Vector3();
  for (const node of nodes) sum.add(new THREE.Vector3(node.baseX, node.baseY, node.baseZ));
  return sum.divideScalar(nodes.length || 1);
}

function buildFace() {
  const { nodes, connections, zMin, zMax } = buildMeshNodeSet();
  const nodeAlpha = buildNodeAlpha(nodes, zMin, zMax);
  const twinkle = buildTwinkle(nodes.length);
  const centroid = computeCentroid(nodes);

  // Dois grupos porque `PointsMaterial` tem um `size` só: os vértices que cintilam precisam ser
  // desenhados maiores, então vão num `points` próprio em vez de um tamanho por vértice (que
  // exigiria shader custom).
  const starIndices: number[] = [];
  const plainIndices: number[] = [];
  nodes.forEach((_, i) => (twinkle.isTwinkle[i] ? starIndices : plainIndices).push(i));

  return { nodes, connections, nodeAlpha, twinkle, starIndices, plainIndices, zMin, zMax, centroid };
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
  coarse: boolean;
  onDissolvedChange: (dissolved: boolean) => void;
}

function HeadScene({ data, modeRef, controlsRef, wrapperRef, reducedMotion, fine, coarse, onDissolvedChange }: HeadSceneProps) {
  const { nodes, connections, nodeAlpha, twinkle, starIndices, plainIndices, zMin, zMax, centroid } = data;
  const invalidate = useThree((state) => state.invalidate);
  const pointSize = coarse ? POINT_SIZE * MOBILE_POINT_SIZE_FACTOR : POINT_SIZE;
  const headScale = coarse ? MOBILE_HEAD_SCALE : HEAD_SCALE;

  const groupRef = useRef<THREE.Group>(null);
  const plainGeometryRef = useRef<THREE.BufferGeometry>(null);
  const starGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const linesMaterialRef = useRef<THREE.LineBasicMaterial>(null);

  // Fator de estado único: 1 em repouso, DISSOLVED_ALPHA_FACTOR com a bio aberta. O GSAP tweena
  // *este número*, nunca o atributo de cor — ver writeAttributes, que é o único escritor de alpha.
  const stateFactorRef = useRef(1);
  // As linhas têm um fator próprio porque apagam bem mais rápido que os pontos na explosão.
  const lineFadeRef = useRef(1);

  const buffers = useMemo(() => {
    const plainPositions = new Float32Array(plainIndices.length * 3);
    const plainColors = new Float32Array(plainIndices.length * 4);
    const starPositions = new Float32Array(starIndices.length * 3);
    const starColors = new Float32Array(starIndices.length * 4);
    const linePositions = new Float32Array(connections.length * 2 * 3);
    const lineColors = new Float32Array(connections.length * 2 * 4);

    function fillGroup(indices: number[], positions: Float32Array, colors: Float32Array) {
      indices.forEach((nodeIndex, i) => {
        const node = nodes[nodeIndex];
        positions[i * 3] = node.x;
        positions[i * 3 + 1] = node.y;
        positions[i * 3 + 2] = node.z;
        colors[i * 4] = ACCENT_COLOR.r;
        colors[i * 4 + 1] = ACCENT_COLOR.g;
        colors[i * 4 + 2] = ACCENT_COLOR.b;
        colors[i * 4 + 3] = nodeAlpha[nodeIndex];
      });
    }
    fillGroup(plainIndices, plainPositions, plainColors);
    fillGroup(starIndices, starPositions, starColors);

    // Posição inicial das linhas precisa vir preenchida daqui: em repouso o writeAttributes não
    // reescreve posições (nada se move), então sem isso as arestas nasceriam degeneradas na origem
    // e só apareceriam depois da primeira explosão.
    //
    // A cor delas é escrita uma vez só: a variação por profundidade é estática, e o escurecimento
    // de estado entra depois via `material.opacity` (que multiplica o alpha do vértice) — bem mais
    // barato que reescrever ~9.600 alphas por frame.
    const span = zMax - zMin || 1;
    connections.forEach(([a, b], i) => {
      for (const [slot, nodeIndex] of [
        [0, a],
        [1, b],
      ] as const) {
        const node = nodes[nodeIndex];
        const vertex = i * 2 + slot;
        linePositions[vertex * 3] = node.x;
        linePositions[vertex * 3 + 1] = node.y;
        linePositions[vertex * 3 + 2] = node.z;

        const at = vertex * 4;
        const depth = (node.baseZ - zMin) / span;
        lineColors[at] = ACCENT_COLOR.r;
        lineColors[at + 1] = ACCENT_COLOR.g;
        lineColors[at + 2] = ACCENT_COLOR.b;
        lineColors[at + 3] = lerp(LINE_ALPHA_BACK, LINE_ALPHA_FRONT, depth);
      }
    });

    return { plainPositions, plainColors, starPositions, starColors, linePositions, lineColors };
  }, [nodes, connections, nodeAlpha, starIndices, plainIndices, zMin, zMax]);

  useEffect(() => {
    for (const geometry of [plainGeometryRef.current, starGeometryRef.current, linesGeometryRef.current]) {
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

  /**
   * Único escritor dos BufferAttribute. O alpha final de cada ponto é composto de três fontes
   * independentes em vez de cada sistema escrever por cima do outro:
   *
   *     alphaFinal = alphaDeRepouso × stateFactor × cintilância
   *
   * Sem isso, a cintilância (que roda todo frame) brigaria com os tweens de explosão/reconstrução
   * e com o estado escurecido — todos disputando o mesmo canal.
   *
   * `writePositions` fica falso em repouso, onde os pontos não se movem (a oscilação de posição
   * saiu de cena em favor da cintilância): aí só a cor precisa subir pra GPU.
   */
  function writeAttributes(elapsed: number, writePositions: boolean) {
    const stateFactor = stateFactorRef.current;

    function writeGroup(indices: number[], geometry: THREE.BufferGeometry | null) {
      if (!geometry) return;
      const position = geometry.attributes.position as THREE.BufferAttribute;
      const color = geometry.attributes.color as THREE.BufferAttribute;

      indices.forEach((nodeIndex, i) => {
        if (writePositions) {
          const node = nodes[nodeIndex];
          position.setXYZ(i, node.x, node.y, node.z);
        }

        let alpha = nodeAlpha[nodeIndex] * stateFactor;
        if (!reducedMotion && twinkle.isTwinkle[nodeIndex]) {
          const pulse = Math.sin(elapsed * twinkle.speed[nodeIndex] + twinkle.phase[nodeIndex]);
          alpha *= 1 + TWINKLE_AMPLITUDE * pulse;
        }
        color.setW(i, Math.max(0, Math.min(1, alpha)));
      });

      if (writePositions) position.needsUpdate = true;
      color.needsUpdate = true;
    }

    writeGroup(plainIndices, plainGeometryRef.current);
    writeGroup(starIndices, starGeometryRef.current);

    // As linhas só precisam das posições: a cor delas é estática e o estado entra pela opacidade
    // do material, aplicada abaixo.
    if (writePositions) {
      const linePosition = linesGeometryRef.current?.attributes.position as THREE.BufferAttribute | undefined;
      if (linePosition) {
        connections.forEach(([a, b], i) => {
          const na = nodes[a];
          const nb = nodes[b];
          linePosition.setXYZ(i * 2, na.x, na.y, na.z);
          linePosition.setXYZ(i * 2 + 1, nb.x, nb.y, nb.z);
        });
        linePosition.needsUpdate = true;
      }
    }

    if (linesMaterialRef.current) linesMaterialRef.current.opacity = lineFadeRef.current;
  }

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const elapsed = state.clock.elapsedTime;
    const mode = modeRef.current;

    if (mode === 'idle') {
      // Posições ficam paradas em repouso: o que dá vida agora é o brilho (cintilância), não o
      // deslocamento — num retrato, oscilar posição lê como tremor.
      if (!reducedMotion) writeAttributes(elapsed, false);

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
          targetX = Math.max(-1, Math.min(1, dy / ROTATE_RANGE_PX)) * MAX_ROTATE_X;
        }
        rotation.current.y += (targetY - rotation.current.y) * ROTATE_DAMPING;
        rotation.current.x += (targetX - rotation.current.x) * ROTATE_DAMPING;
        group.rotation.y = THREE.MathUtils.degToRad(rotation.current.y);
        group.rotation.x = THREE.MathUtils.degToRad(rotation.current.x);
      }
    } else if (mode === 'dissolved' && !reducedMotion) {
      // Estilhaços continuam à deriva bem devagar no fundo, atrás do texto, em vez de
      // congelarem no ponto exato onde a explosão parou.
      const targets = explodedTargetsRef.current;
      if (targets) {
        nodes.forEach((node, i) => {
          const target = targets[i];
          node.x = target.x + Math.sin(elapsed * DRIFT_FREQ_X + i) * DRIFT_AMPLITUDE;
          node.y = target.y + Math.cos(elapsed * DRIFT_FREQ_Y + i * 1.3) * DRIFT_AMPLITUDE;
          node.z = target.z + Math.sin(elapsed * DRIFT_FREQ_Z + i * 0.7) * DRIFT_AMPLITUDE;
        });

        writeAttributes(elapsed, true);
      }
    } else if (mode === 'transitioning') {
      // O GSAP já mutou node.x/y/z e stateFactorRef neste frame; aqui só transcrevemos pra GPU.
      writeAttributes(elapsed, true);
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

      // Só os fatores de estado: a escrita no atributo é do writeAttributes, via useFrame.
      stateFactorRef.current = lerp(1, DISSOLVED_ALPHA_FACTOR, easeExplode(t));
      const lineT = Math.max(0, Math.min(1, globalTime / EXPLODE_LINES_DURATION));
      lineFadeRef.current = lerp(1, 0, easeLines(lineT));
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

      stateFactorRef.current = lerp(DISSOLVED_ALPHA_FACTOR, 1, easeReform(t));
      const lineT = Math.max(0, Math.min(1, (globalTime - REFORM_LINES_DELAY) / REFORM_LINES_DURATION));
      lineFadeRef.current = lerp(0, 1, easeLines(lineT));
    }

    // Sem animação (usado só em prefers-reduced-motion): aplica o estado final na hora, sem tween
    // — senão os fragmentos ficam presos na opacidade cheia atrás do texto, já que o caminho
    // normal que os apaga é o próprio tween do GSAP. O invalidate() é obrigatório aqui: nesse
    // caminho o frameloop é 'demand', então sem ele a mudança nunca vira pixel.
    function applyInstantState(dimmed: boolean) {
      stateFactorRef.current = dimmed ? DISSOLVED_ALPHA_FACTOR : 1;
      lineFadeRef.current = dimmed ? 0 : 1;
      writeAttributes(0, true);
      invalidate();
    }

    function explode() {
      if (modeRef.current !== 'idle') return;
      modeRef.current = 'transitioning';
      onDissolvedChange(true);

      if (reducedMotion) {
        applyInstantState(true);
        modeRef.current = 'dissolved';
        return;
      }

      const delays = nodes.map(() => Math.random() * EXPLODE_NODE_MAX_DELAY);
      const targets = nodes.map((node) => {
        const dx = node.baseX - centroid.x;
        const dy = node.baseY - centroid.y;
        const dz = node.baseZ - centroid.z;
        const dist = Math.hypot(dx, dy, dz) || 1;
        const push = EXPLODE_PUSH_MIN + Math.random() * (EXPLODE_PUSH_MAX - EXPLODE_PUSH_MIN);
        return new THREE.Vector3(
          node.baseX + (dx / dist) * push,
          node.baseY + (dy / dist) * push,
          node.baseZ + (dz / dist) * push,
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
          stateFactorRef.current = DISSOLVED_ALPHA_FACTOR;
          lineFadeRef.current = 0;
          modeRef.current = 'dissolved';
        },
      });
    }

    function reform() {
      if (modeRef.current !== 'dissolved') return;
      modeRef.current = 'transitioning';
      onDissolvedChange(false);

      if (reducedMotion) {
        applyInstantState(false);
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
          stateFactorRef.current = 1;
          lineFadeRef.current = 1;
          // O modo 'idle' não reescreve posição (os pontos ficam parados de propósito), então a
          // posição-base final precisa ser transcrita aqui — senão os pontos congelariam no
          // último frame do tween, a um fio de distância do lugar certo.
          writeAttributes(0, true);
          modeRef.current = 'idle';
        },
      });
    }

    controlsRef.current = { explode, reform };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dados/refs são estáveis (lazy-init), não precisam entrar nas deps
  }, []);

  return (
    <group ref={groupRef} position={[0, groupYOffset(headScale), 0]} scale={headScale}>
      {/* Wireframe por baixo dos pontos: são as arestas que dão a forma da cabeça; os vértices
          brilhantes por cima é que dão o aspecto de constelação. */}
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.lineColors, 4]} />
        </bufferGeometry>
        <lineBasicMaterial ref={linesMaterialRef} vertexColors transparent depthWrite={false} />
      </lineSegments>

      <points>
        <bufferGeometry ref={plainGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.plainPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.plainColors, 4]} />
        </bufferGeometry>
        {/* `map` com o sprite radial é o que tira o quadrado duro do ponto. `alphaTest` fica no
            padrão (0) de propósito: qualquer valor acima recortaria o halo suave num disco de
            borda dura, que é justamente o que se quer evitar. */}
        <pointsMaterial
          map={getPointSprite()}
          vertexColors
          transparent
          sizeAttenuation
          depthWrite={false}
          size={pointSize}
        />
      </points>

      <points>
        <bufferGeometry ref={starGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.starPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.starColors, 4]} />
        </bufferGeometry>
        <pointsMaterial
          map={getPointSprite()}
          vertexColors
          transparent
          sizeAttenuation
          depthWrite={false}
          size={pointSize * TWINKLE_SIZE_BOOST}
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

type AboutBlock =
  | { kind: 'paragraph'; segments: RichText }
  | { kind: 'transition'; text: string }
  | { kind: 'belief'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'expectation'; title: string; description: string };

const ABOUT_BLOCKS: AboutBlock[] = [
  ...aboutContent.paragraphs.map((segments): AboutBlock => ({ kind: 'paragraph', segments })),
  { kind: 'transition', text: aboutContent.transition },
  { kind: 'belief', text: aboutContent.belief },
  { kind: 'paragraph', segments: aboutContent.practice },
  { kind: 'heading', text: aboutContent.expectationsHeading },
  ...aboutContent.expectations.map(
    (item): AboutBlock => ({ kind: 'expectation', title: item.title, description: item.description }),
  ),
  ...aboutContent.closing.map((segments): AboutBlock => ({ kind: 'paragraph', segments })),
];

/** Comprimento aproximado do texto de um bloco — usado só pra balancear as duas colunas abaixo. */
function estimateBlockLength(block: AboutBlock): number {
  switch (block.kind) {
    case 'paragraph':
      return block.segments.reduce((total, segment) => total + segment.text.length, 0);
    case 'expectation':
      return block.title.length + block.description.length;
    case 'transition':
    case 'belief':
    case 'heading':
      return block.text.length;
  }
}

interface IndexedAboutBlock {
  block: AboutBlock;
  /** Posição no array original — mantém a ordem de leitura na revelação em cascata mesmo depois
   *  de dividir em duas colunas. */
  index: number;
}

/** Divide os blocos em duas colunas manualmente, balanceando pelo comprimento estimado — evita
 *  `columns-*` (CSS multicolumn), que tem bugs reais de renderização no Chromium com esse tipo de
 *  conteúdo (blocos sobrepostos/cortados, ver comentário mais abaixo onde era usado antes). */
function splitIntoColumns(blocks: AboutBlock[]): [IndexedAboutBlock[], IndexedAboutBlock[]] {
  const indexed = blocks.map((block, index) => ({ block, index }));
  const total = blocks.reduce((sum, block) => sum + estimateBlockLength(block), 0);
  const half = total / 2;

  let running = 0;
  let splitIndex = indexed.length;
  for (let i = 0; i < blocks.length; i++) {
    running += estimateBlockLength(blocks[i]);
    if (running >= half) {
      splitIndex = i + 1;
      break;
    }
  }

  return [indexed.slice(0, splitIndex), indexed.slice(splitIndex)];
}

const ABOUT_COLUMNS = splitIntoColumns(ABOUT_BLOCKS);

/** Renderiza um trecho de texto com os pedaços marcados como `strong` em destaque. */
function RichTextSpan({ segments }: { segments: RichText }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.strong ? (
          <strong key={index} className="text-foreground font-semibold">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

interface AboutBlockLineProps {
  block: AboutBlock;
}

/** Cada bloco mantém a linguagem visual de "comentário de código" já usada aqui (// e um bloco
 *  estilo docblock pra frase de destaque), só varia o tratamento por tipo de bloco. */
function AboutBlockLine({ block }: AboutBlockLineProps) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <p className="text-foreground/90">
          {'// '}
          <RichTextSpan segments={block.segments} />
        </p>
      );
    case 'transition':
      return <p className="text-muted mt-0.5 sm:mt-1">{`// ${block.text}`}</p>;
    case 'belief':
      return (
        <p className="text-accent mt-1 sm:mt-2">
          {'/** '}
          {block.text}
          {' */'}
        </p>
      );
    case 'heading':
      return (
        <p className="text-accent mt-1.5 tracking-wide uppercase sm:mt-3">{`// === ${block.text} ===`}</p>
      );
    case 'expectation':
      return (
        <p className="text-muted mt-0.5 sm:mt-1">
          {'// - '}
          <strong className="text-foreground font-semibold">{block.title}</strong>
          {` — ${block.description}`}
        </p>
      );
  }
}

interface FaceGraphicProps {
  className?: string;
  /** Avisa a seção quando o texto abre/fecha — usado pra esconder o título estático da seção
   *  enquanto o texto (bem maior agora, em duas colunas) ocupa esse mesmo espaço, já que o painel
   *  não tem scrim de fundo (os estilhaços continuam visíveis atrás de propósito). */
  onDissolvedChange?: (dissolved: boolean) => void;
}

/**
 * Rosto humano em 3D (Three.js/R3F), constelação sobre uma malha fixa (938 nós, 3.259 arestas)
 * extraída da referência visual, com profundidade Z exagerada pra ler como volume de verdade.
 *
 * É uma nuvem de pontos pura: as 3.259 arestas da malha não são desenhadas. Elas formavam uma
 * teia triangulada (a malha não traz contorno de olho/boca/silhueta endereçável, só triangulação)
 * que encobria o rosto em vez de descrevê-lo. Sem arestas, a leitura fica por conta da hierarquia
 * de tamanho e brilho: os 491 nós anatômicos são bem maiores e mais fortes que o preenchimento,
 * que vira poeira escura dando volume. Todos os pontos são brancos, menos um punhado sorteado que
 * cintila em lime. Acompanha o mouse virando em 3D — com amplitude curta, porque a malha é uma
 * casca frontal e girar muito denuncia a máscara plana. Um clique — ou
 * Enter/Espaço no controle focável — dispara a explosão: os nós se espalham pela seção inteira
 * como uma constelação de estrelas à deriva lenta (não somem, só recuam de opacidade) e o texto
 * "sobre mim" aparece na própria seção — não como modal, sem scroll da página enquanto visível.
 * Clicar no texto ou no botão "voltar" reconstrói o rosto. Nunca toca o cursor nativo, só o
 * próprio desenho.
 */
export function FaceGraphic({ className, onDissolvedChange }: FaceGraphicProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dissolved, setDissolved] = useState(false);

  useEffect(() => {
    onDissolvedChange?.(dissolved);
  }, [dissolved, onDissolvedChange]);

  const [coarse] = useState(() => isCoarsePointer());

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

  const panelRef = useRef<HTMLDivElement>(null);

  // Trava o scroll da página enquanto o texto está visível — ele agora vive na própria seção, não
  // num modal separado, então sem isso o usuário rolaria a página "por baixo" do texto revelado.
  useEffect(() => {
    if (!dissolved) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    // `<html>` tem overflow-x:hidden fixo (globals.css) — isso tira o `<body>` do papel de rolador
    // da página, então travar só o body não é mais suficiente; precisa travar o overflow-y do
    // `<html>` também, senão a página ainda rola por baixo do painel.
    const previousHtmlOverflowY = document.documentElement.style.overflowY;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    // `overflow: hidden` no body não é suficiente em iOS Safari — o scroll "elástico" ainda
    // consegue mover a página por baixo. Bloqueia touch/wheel fora do próprio painel (que precisa
    // continuar rolável nele mesmo, como rede de segurança em telas bem baixas).
    function blockOutsidePanel(event: TouchEvent | WheelEvent) {
      if (panelRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
    }
    document.addEventListener('touchmove', blockOutsidePanel, { passive: false });
    document.addEventListener('wheel', blockOutsidePanel, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.documentElement.style.overflowY = previousHtmlOverflowY;
      document.removeEventListener('touchmove', blockOutsidePanel);
      document.removeEventListener('wheel', blockOutsidePanel);
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
            // Sprite com halo é fill-rate bound: no mobile o DPR trava em 1, e mesmo no desktop
            // não vale pagar 2x (o ganho visual num ponto borrado de propósito é quase nulo).
            dpr={coarse ? 1 : [1, 1.5]}
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
              coarse={coarse}
              onDissolvedChange={setDissolved}
            />
          </Canvas>
        </div>
      </button>

      {/* fixed na tela (não na seção) — centraliza sempre no meio do viewport visível, não importa
          em que ponto da seção (bem mais alta que 100vh) o clique aconteceu. Sem scrim de tela
          cheia: os estilhaços continuam visíveis e à deriva atrás do texto (eles vivem no canvas
          da seção, essa camada só cuida do texto por cima), só a coluna de texto ganha um véu
          localizado. */}
      <div
        onClick={() => controlsRef.current.reform()}
        className={`fixed inset-0 z-10 flex items-center justify-center p-1 transition-opacity duration-500 sm:p-8 ${dissolved ? 'pointer-events-auto cursor-pointer opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {/* O texto é bem mais longo agora (bio completa) — cabe sem rolar a página inteira em duas
            colunas, inclusive no mobile (só a partir de sm que o texto cresce e o espaçamento
            relaxa — telas bem pequenas precisam do máximo de altura útil). Nada de `columns-*`
            (CSS multicolumn): testado e o Chromium renderiza os blocos cortados/sobrepostos com
            esse conteúdo — em vez disso, os blocos já vêm divididos em duas listas balanceadas por
            tamanho (splitIntoColumns) e cada uma vira uma coluna comum de verdade (`grid-cols-2`).
            O max-h + overflow-y-auto aqui dentro é só uma rede de segurança pra telas realmente
            fora do comum; o card inteiro "emerge" de leve escala/profundidade em vez de só
            aparecer, pra reforçar a sensação de vir de trás da explosão. */}
        <div
          ref={panelRef}
          className={`relative max-h-[calc(100vh-0.5rem)] w-full max-w-5xl overflow-x-hidden overflow-y-auto transition-all duration-500 ease-out-expo sm:max-h-[calc(100vh-4rem)] ${dissolved ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}
        >
          {dissolved && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                controlsRef.current.reform();
              }}
              aria-label="Voltar para a visualização do rosto"
              className="outline-none sticky top-0 right-0 float-right -mt-1 -mr-1 mb-1 font-mono text-[10px] tracking-wide text-muted uppercase hover:text-foreground focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-xs"
            >
              Voltar ×
            </button>
          )}

          <p
            className={`text-accent clear-both hidden text-left font-mono text-[10px] transition-all duration-500 ease-out-expo sm:block sm:text-xs ${dissolved ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
            style={{ transitionDelay: dissolved ? '180ms' : '0ms' }}
          >
            // sobre-mim.ts
          </p>

          <div className="clear-both grid grid-cols-2 gap-x-3 text-left font-mono text-[9px] leading-tight sm:clear-none sm:gap-x-10 sm:text-xs sm:leading-relaxed">
            {ABOUT_COLUMNS.map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-0">
                {column.map(({ block, index }) => (
                  <div
                    key={index}
                    className={`transition-opacity duration-500 ease-out-expo ${dissolved ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transitionDelay: dissolved ? `${220 + index * 35}ms` : '0ms' }}
                  >
                    <AboutBlockLine block={block} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
