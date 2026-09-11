import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { aboutContent } from '@/data/about';
import type { RichText } from '@/types/about';
import headImageUrl from '@/assets/face/head-3d.webp';

const ACCENT_HEX = '#c6ff45';
const ACCENT_COLOR = new THREE.Color(ACCENT_HEX);

// Amostragem da imagem: cada pixel aceso vira uma partícula. O passo controla a densidade — 2
// significa "olhe 1 pixel a cada 2, nos dois eixos". Abaixo do limiar o pixel é fundo e é
// descartado. O teto existe porque cada partícula custa escrita por frame durante a explosão.
const SAMPLE_STEP = 1;
const SAMPLE_THRESHOLD = 26;
const MAX_PARTICLES = 35000;
const MOBILE_MAX_PARTICLES = 15000;

// O brilho do pixel vira opacidade, mas não linearmente: as linhas finas da imagem são bem
// escuras (anti-aliasing as dilui), e cru elas sumiriam. A raiz levanta os tons baixos sem
// estourar os altos, e o piso garante que nenhuma partícula amostrada fique invisível.
const ALPHA_FLOOR = 0.52;

// Acima disso o pixel é um "nó" da malha (os pontos brilhantes da imagem), não linha: ganha
// tamanho maior e entra no sorteio da cintilância.
const STAR_THRESHOLD = 168;

// O tamanho do ponto não é afetado pela escala do grupo (o shader dimensiona pela distância da
// câmera, não pela escala do objeto). Então ao ampliar a cabeça as partículas se afastam mas
// continuam do mesmo tamanho na tela, e o desenho abre buracos — o tamanho precisa crescer junto.
const POINT_SIZE = 0.03;
const POINT_SPRITE_SIZE = 64;

// Enquadramento: a cabeça ocupa o miolo da tela. No mobile a escala cai: a câmera mantém o FOV
// vertical, então numa tela em pé a largura visível encolhe muito e os ombros (bem mais largos que
// a cabeça) vazariam pelas laterais.
const HEAD_SCALE = 1.9;
const MOBILE_HEAD_SCALE = 1.23;

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

// A imagem é plana, então cada partícula ganha um Z aleatório pequeno. Não é profundidade real —
// serve pra que o leve giro com o mouse produza parallax (camadas deslizando entre si) em vez de
// parecer um cartão girando.
const DEPTH_SPREAD = 0.14;

// Enquanto o texto está visível, os estilhaços não somem — recuam pra essa fração da opacidade
// de repouso e continuam à deriva atrás do texto, como plano de fundo vivo.
const DISSOLVED_ALPHA_FACTOR = 0.28;

// Cintilância: parte dos vértices pulsa de brilho, virando as "estrelas" mais fortes do wireframe.
// Brilho pulsando lê como malha viva; oscilar posição leria como tremor.
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

// Balanço próprio, sem seguir o mouse: a cabeça oscila devagar sozinha. Como cada partícula tem
// seu Z, o giro produz parallax entre as camadas — é o que dá a sensação de volume num desenho
// que é plano. Amplitudes curtas e períodos longos, pra ler como respiração e não como giro.
const SWAY_ROTATE_Y = 9;
const SWAY_ROTATE_X = 3.5;
const SWAY_SPEED_Y = 0.17;
const SWAY_SPEED_X = 0.11;
const SWAY_FLOAT_Y = 0.035;
const SWAY_FLOAT_SPEED = 0.23;

// Explosão bem mais longa e mais forte que a de antes: o clique precisa *aparecer*. Boa parte do
// efeito vem de as partículas continuarem acesas durante o voo — só escurecem no fim, quando o
// texto já está entrando.
const EXPLODE_NODE_DURATION = 1.15;
const EXPLODE_NODE_MAX_DELAY = 0.45;
const EXPLODE_TOTAL = EXPLODE_NODE_DURATION + EXPLODE_NODE_MAX_DELAY;
// O empurrão é em espaço local, depois multiplicado pela escala do grupo — e a área visível tem
// cerca de ±2.5 unidades de altura. Valores altos demais jogam tudo pra fora do enquadramento no
// primeiro instante, e a explosão parece que simplesmente apagou o desenho. Estes mantêm os
// estilhaços dentro (ou na borda) da tela durante todo o voo.
const EXPLODE_PUSH_MIN = 0.25;
const EXPLODE_PUSH_MAX = 1.1;
// Fração do tween em que as partículas ainda estão com o brilho cheio. Antes elas apagavam desde
// o primeiro frame, e a explosão praticamente não era vista.
const EXPLODE_BRIGHT_HOLD = 0.45;
// Pico de brilho no instante do estouro — o clarão que anuncia que algo aconteceu.
const EXPLODE_FLASH = 1.5;

const REFORM_NODE_DURATION = 0.9;
const REFORM_NODE_MAX_DELAY = 0.25;
const REFORM_TOTAL = REFORM_NODE_DURATION + REFORM_NODE_MAX_DELAY;

const easeExplode = gsap.parseEase('power2.out');
const easeReform = gsap.parseEase('power3.out');

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Partículas em arrays paralelos, não num array de objetos. São dezenas de milhares delas, e a
 * explosão reescreve todas as posições a cada frame — com objetos isso vira pressão de GC e
 * acesso espalhado pela memória.
 */
interface Particles {
  count: number;
  baseX: Float32Array;
  baseY: Float32Array;
  baseZ: Float32Array;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  /** Opacidade de repouso, vinda do brilho do pixel na imagem. */
  alpha: Float32Array;
  isTwinkle: Uint8Array;
  phase: Float32Array;
  speed: Float32Array;
  /** Índices separados por tamanho de desenho: nós brilhantes vs. pixels de linha. */
  starIndices: Uint32Array;
  plainIndices: Uint32Array;
  centroid: THREE.Vector3;
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

/**
 * Transforma a imagem de referência num campo de partículas: cada pixel aceso vira um ponto, na
 * mesma posição relativa que ocupava na imagem. É por isso que o desenho sai idêntico à
 * referência — a forma não é recriada, é lida dela.
 *
 * A varredura desenha a imagem num canvas fora de tela e lê os pixels de volta. Roda uma vez, no
 * chunk preguiçoso da seção Sobre.
 */
async function sampleImage(url: string, maxParticles: number): Promise<Particles> {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('2D context indisponível para amostrar a imagem do rosto');
  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

  // Primeira passada: quantos pixels passam do limiar. Precisa ser antes de alocar, pra saber o
  // fator de descarte e já dimensionar os arrays certos.
  let candidates = 0;
  for (let y = 0; y < height; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      if (data[(y * width + x) * 4 + 1] >= SAMPLE_THRESHOLD) candidates++;
    }
  }

  const keepRate = candidates > maxParticles ? maxParticles / candidates : 1;
  const count = Math.min(candidates, maxParticles);

  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const baseZ = new Float32Array(count);
  const alpha = new Float32Array(count);
  const isTwinkle = new Uint8Array(count);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);

  // Normaliza pra altura 2 (mesma convenção do resto da cena), largura proporcional.
  const scale = 2 / height;
  const halfW = (width * scale) / 2;

  const starList: number[] = [];
  const plainList: number[] = [];
  let i = 0;
  let carry = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < height && i < count; y += SAMPLE_STEP) {
    for (let x = 0; x < width && i < count; x += SAMPLE_STEP) {
      const green = data[(y * width + x) * 4 + 1];
      if (green < SAMPLE_THRESHOLD) continue;

      // Descarte uniforme por acumulador em vez de sorteio: mantém a densidade pareja pela imagem
      // inteira, sem abrir buracos onde a sorte não ajudou.
      carry += keepRate;
      if (carry < 1) continue;
      carry -= 1;

      const px = x * scale - halfW;
      const py = 1 - y * scale;
      baseX[i] = px;
      baseY[i] = py;
      baseZ[i] = (Math.random() - 0.5) * DEPTH_SPREAD;
      alpha[i] = Math.min(1, ALPHA_FLOOR + Math.sqrt(green / 255) * (1 - ALPHA_FLOOR));
      sumX += px;
      sumY += py;

      if (green >= STAR_THRESHOLD) {
        starList.push(i);
        isTwinkle[i] = 1;
        phase[i] = Math.random() * Math.PI * 2;
        speed[i] = TWINKLE_SPEED_MIN + Math.random() * (TWINKLE_SPEED_MAX - TWINKLE_SPEED_MIN);
      } else {
        plainList.push(i);
      }

      i++;
    }
  }

  return {
    count: i,
    baseX,
    baseY,
    baseZ,
    x: baseX.slice(),
    y: baseY.slice(),
    z: baseZ.slice(),
    alpha,
    isTwinkle,
    phase,
    speed,
    starIndices: Uint32Array.from(starList),
    plainIndices: Uint32Array.from(plainList),
    centroid: new THREE.Vector3(sumX / (i || 1), sumY / (i || 1), 0),
  };
}

type FaceData = Particles;
type Mode = 'idle' | 'dissolved' | 'transitioning';

interface FaceControls {
  explode: () => void;
  reform: () => void;
}

interface HeadSceneProps {
  data: FaceData;
  modeRef: React.RefObject<Mode>;
  controlsRef: React.RefObject<FaceControls>;
  reducedMotion: boolean;
  coarse: boolean;
  onDissolvedChange: (dissolved: boolean) => void;
}

function HeadScene({ data, modeRef, controlsRef, reducedMotion, coarse, onDissolvedChange }: HeadSceneProps) {
  const { starIndices, plainIndices, centroid } = data;
  const invalidate = useThree((state) => state.invalidate);
  const pointSize = coarse ? POINT_SIZE * MOBILE_POINT_SIZE_FACTOR : POINT_SIZE;
  const headScale = coarse ? MOBILE_HEAD_SCALE : HEAD_SCALE;

  const groupRef = useRef<THREE.Group>(null);
  const plainGeometryRef = useRef<THREE.BufferGeometry>(null);
  const starGeometryRef = useRef<THREE.BufferGeometry>(null);

  // Fator de estado único: 1 em repouso, DISSOLVED_ALPHA_FACTOR com a bio aberta. O GSAP tweena
  // *este número*, nunca o atributo de cor — ver writeAttributes, que é o único escritor de alpha.
  const stateFactorRef = useRef(1);

  const buffers = useMemo(() => {
    function makeGroup(indices: Uint32Array) {
      const positions = new Float32Array(indices.length * 3);
      const colors = new Float32Array(indices.length * 4);
      for (let i = 0; i < indices.length; i++) {
        const p = indices[i];
        positions[i * 3] = data.baseX[p];
        positions[i * 3 + 1] = data.baseY[p];
        positions[i * 3 + 2] = data.baseZ[p];
        colors[i * 4] = ACCENT_COLOR.r;
        colors[i * 4 + 1] = ACCENT_COLOR.g;
        colors[i * 4 + 2] = ACCENT_COLOR.b;
        colors[i * 4 + 3] = data.alpha[p];
      }
      return { positions, colors };
    }

    return { plain: makeGroup(plainIndices), star: makeGroup(starIndices) };
  }, [data, plainIndices, starIndices]);

  useEffect(() => {
    for (const geometry of [plainGeometryRef.current, starGeometryRef.current]) {
      const position = geometry?.attributes.position;
      if (position instanceof THREE.BufferAttribute) position.setUsage(THREE.DynamicDrawUsage);
      const color = geometry?.attributes.color;
      if (color instanceof THREE.BufferAttribute) color.setUsage(THREE.DynamicDrawUsage);
    }
  }, []);

  /** Destinos da explosão em array plano (x,y,z por partícula), pelo mesmo motivo dos demais. */
  const explodedTargetsRef = useRef<Float32Array | null>(null);

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

    function writeGroup(indices: Uint32Array, geometry: THREE.BufferGeometry | null) {
      if (!geometry) return;
      const position = geometry.attributes.position as THREE.BufferAttribute;
      const color = geometry.attributes.color as THREE.BufferAttribute;
      // Escreve direto no array subjacente: `setXYZ`/`setW` custam caro repetidos dezenas de
      // milhares de vezes por frame.
      const positions = position.array as Float32Array;
      const colors = color.array as Float32Array;

      for (let i = 0; i < indices.length; i++) {
        const p = indices[i];

        if (writePositions) {
          positions[i * 3] = data.x[p];
          positions[i * 3 + 1] = data.y[p];
          positions[i * 3 + 2] = data.z[p];
        }

        let alpha = data.alpha[p] * stateFactor;
        if (!reducedMotion && data.isTwinkle[p]) {
          alpha *= 1 + TWINKLE_AMPLITUDE * Math.sin(elapsed * data.speed[p] + data.phase[p]);
        }
        colors[i * 4 + 3] = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
      }

      if (writePositions) position.needsUpdate = true;
      color.needsUpdate = true;
    }

    writeGroup(plainIndices, plainGeometryRef.current);
    writeGroup(starIndices, starGeometryRef.current);
  }

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const elapsed = state.clock.elapsedTime;
    const mode = modeRef.current;

    if (mode === 'idle') {
      // Posições das partículas ficam paradas em repouso: o que dá vida é o brilho (cintilância)
      // mais o balanço do grupo inteiro, não o deslocamento individual — num retrato, cada ponto
      // oscilando lê como tremor.
      if (!reducedMotion) {
        writeAttributes(elapsed, false);

        // Balanço próprio, sem mouse. Os dois eixos têm períodos diferentes de propósito: com
        // períodos iguais o movimento fecharia sempre no mesmo ciclo e denunciaria a repetição.
        group.rotation.y = THREE.MathUtils.degToRad(Math.sin(elapsed * SWAY_SPEED_Y) * SWAY_ROTATE_Y);
        group.rotation.x = THREE.MathUtils.degToRad(Math.sin(elapsed * SWAY_SPEED_X) * SWAY_ROTATE_X);
        group.position.y = groupYOffset(headScale) + Math.sin(elapsed * SWAY_FLOAT_SPEED) * SWAY_FLOAT_Y;
      }
    } else if (mode === 'dissolved' && !reducedMotion) {
      // Estilhaços continuam à deriva bem devagar no fundo, atrás do texto, em vez de
      // congelarem no ponto exato onde a explosão parou.
      const targets = explodedTargetsRef.current;
      if (targets) {
        for (let i = 0; i < data.count; i++) {
          data.x[i] = targets[i * 3] + Math.sin(elapsed * DRIFT_FREQ_X + i) * DRIFT_AMPLITUDE;
          data.y[i] = targets[i * 3 + 1] + Math.cos(elapsed * DRIFT_FREQ_Y + i * 1.3) * DRIFT_AMPLITUDE;
          data.z[i] = targets[i * 3 + 2] + Math.sin(elapsed * DRIFT_FREQ_Z + i * 0.7) * DRIFT_AMPLITUDE;
        }

        writeAttributes(elapsed, true);
      }
    } else if (mode === 'transitioning') {
      // O GSAP já mutou as posições e o stateFactor neste frame; aqui só transcrevemos pra GPU.
      writeAttributes(elapsed, true);
    }
  });

  useEffect(() => {
    function applyExplodeFrame(t: number, delays: Float32Array, targets: Float32Array) {
      const globalTime = t * EXPLODE_TOTAL;

      for (let i = 0; i < data.count; i++) {
        const localT = Math.max(0, Math.min(1, (globalTime - delays[i]) / EXPLODE_NODE_DURATION));
        const eased = easeExplode(localT);
        data.x[i] = lerp(data.baseX[i], targets[i * 3], eased);
        data.y[i] = lerp(data.baseY[i], targets[i * 3 + 1], eased);
        data.z[i] = lerp(data.baseZ[i], targets[i * 3 + 2], eased);
      }

      // Brilho em duas fases: um clarão no estouro e brilho cheio enquanto as partículas voam,
      // e só depois o recuo pro nível de fundo. Antes isso era um único lerp começando no frame
      // zero — as partículas apagavam enquanto ainda saíam, e o clique parecia não fazer nada.
      if (t < EXPLODE_BRIGHT_HOLD) {
        const flashT = t / EXPLODE_BRIGHT_HOLD;
        stateFactorRef.current = lerp(EXPLODE_FLASH, 1, easeExplode(flashT));
      } else {
        const fadeT = (t - EXPLODE_BRIGHT_HOLD) / (1 - EXPLODE_BRIGHT_HOLD);
        stateFactorRef.current = lerp(1, DISSOLVED_ALPHA_FACTOR, easeExplode(fadeT));
      }
    }

    function applyReformFrame(t: number, delays: Float32Array, starts: Float32Array) {
      const globalTime = t * REFORM_TOTAL;

      for (let i = 0; i < data.count; i++) {
        const localT = Math.max(0, Math.min(1, (globalTime - delays[i]) / REFORM_NODE_DURATION));
        const eased = easeReform(localT);
        data.x[i] = lerp(starts[i * 3], data.baseX[i], eased);
        data.y[i] = lerp(starts[i * 3 + 1], data.baseY[i], eased);
        data.z[i] = lerp(starts[i * 3 + 2], data.baseZ[i], eased);
      }

      stateFactorRef.current = lerp(DISSOLVED_ALPHA_FACTOR, 1, easeReform(t));
    }

    // Sem animação (usado só em prefers-reduced-motion): aplica o estado final na hora, sem tween
    // — senão os fragmentos ficam presos na opacidade cheia atrás do texto, já que o caminho
    // normal que os apaga é o próprio tween do GSAP. O invalidate() é obrigatório aqui: nesse
    // caminho o frameloop é 'demand', então sem ele a mudança nunca vira pixel.
    function applyInstantState(dimmed: boolean) {
      stateFactorRef.current = dimmed ? DISSOLVED_ALPHA_FACTOR : 1;
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

      const delays = new Float32Array(data.count);
      const targets = new Float32Array(data.count * 3);
      for (let i = 0; i < data.count; i++) {
        delays[i] = Math.random() * EXPLODE_NODE_MAX_DELAY;

        const dx = data.baseX[i] - centroid.x;
        const dy = data.baseY[i] - centroid.y;
        const dz = data.baseZ[i] - centroid.z;
        const dist = Math.hypot(dx, dy, dz) || 1;
        const push = EXPLODE_PUSH_MIN + Math.random() * (EXPLODE_PUSH_MAX - EXPLODE_PUSH_MIN);
        targets[i * 3] = data.baseX[i] + (dx / dist) * push;
        targets[i * 3 + 1] = data.baseY[i] + (dy / dist) * push;
        targets[i * 3 + 2] = data.baseZ[i] + (dz / dist) * push;
      }

      const driver = { t: 0 };
      gsap.to(driver, {
        t: 1,
        duration: EXPLODE_TOTAL,
        ease: 'none',
        onUpdate: () => applyExplodeFrame(driver.t, delays, targets),
        onComplete: () => {
          explodedTargetsRef.current = targets;
          stateFactorRef.current = DISSOLVED_ALPHA_FACTOR;
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

      const delays = new Float32Array(data.count);
      const starts = new Float32Array(data.count * 3);
      for (let i = 0; i < data.count; i++) {
        delays[i] = Math.random() * REFORM_NODE_MAX_DELAY;
        starts[i * 3] = data.x[i];
        starts[i * 3 + 1] = data.y[i];
        starts[i * 3 + 2] = data.z[i];
      }

      const driver = { t: 0 };
      gsap.to(driver, {
        t: 1,
        duration: REFORM_TOTAL,
        ease: 'none',
        onUpdate: () => applyReformFrame(driver.t, delays, starts),
        onComplete: () => {
          data.x.set(data.baseX);
          data.y.set(data.baseY);
          data.z.set(data.baseZ);
          stateFactorRef.current = 1;
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
      <points>
        <bufferGeometry ref={plainGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.plain.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.plain.colors, 4]} />
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
          <bufferAttribute attach="attributes-position" args={[buffers.star.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.star.colors, 4]} />
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

  // A amostragem depende da imagem estar decodificada, então é assíncrona: a cena só monta quando
  // as partículas existem. Até lá a seção fica só com o título, sem buraco de layout (o canvas é
  // posicionado de forma absoluta).
  const [data, setData] = useState<FaceData | null>(null);
  useEffect(() => {
    let cancelled = false;
    sampleImage(headImageUrl, coarse ? MOBILE_MAX_PARTICLES : MAX_PARTICLES)
      .then((particles) => {
        if (!cancelled) setData(particles);
      })
      .catch(() => {
        // Sem partículas a seção continua funcionando: o texto ainda abre pelo botão.
      });
    return () => {
      cancelled = true;
    };
  }, [coarse]);

  const modeRef = useRef<Mode>('idle');
  const controlsRef = useRef<FaceControls>({ explode: () => {}, reform: () => {} });

  const [reducedMotion] = useState(() => prefersReducedMotion());
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
            {data ? (
              <HeadScene
                data={data}
                modeRef={modeRef}
                controlsRef={controlsRef}
                reducedMotion={reducedMotion}
                coarse={coarse}
                onDissolvedChange={setDissolved}
              />
            ) : null}
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
        // Mesmo atraso do painel: sem isso esta camada começaria a clarear já no frame do clique e
        // o texto apareceria (ainda minúsculo) antes da explosão acontecer, quebrando a ligação
        // entre uma coisa e outra.
        style={{ transitionDelay: dissolved ? '340ms' : '0ms' }}
      >
        {/* O texto é bem mais longo agora (bio completa) — cabe sem rolar a página inteira em duas
            colunas, inclusive no mobile (só a partir de sm que o texto cresce e o espaçamento
            relaxa — telas bem pequenas precisam do máximo de altura útil). Nada de `columns-*`
            (CSS multicolumn): testado e o Chromium renderiza os blocos cortados/sobrepostos com
            esse conteúdo — em vez disso, os blocos já vêm divididos em duas listas balanceadas por
            tamanho (splitIntoColumns) e cada uma vira uma coluna comum de verdade (`grid-cols-2`).
            O max-h + overflow-y-auto aqui dentro é só uma rede de segurança pra telas realmente
            fora do comum.

            O texto vem *de dentro* da explosão: nasce pequeno e no centro (escala 0.55), como se
            estivesse lá no fundo, e avança até o tamanho real. O atraso na entrada é o que amarra
            as duas coisas — ele só começa a crescer quando as partículas já estão voando, então
            lê como se tivesse sido cuspido pelo estouro, não como um painel que apareceu por cima.
            Na volta não há atraso: o texto precisa sair da frente antes de o rosto se remontar. */}
        <div
          ref={panelRef}
          className={`relative max-h-[calc(100vh-0.5rem)] w-full max-w-5xl overflow-x-hidden overflow-y-auto transition-all duration-[900ms] ease-out-expo sm:max-h-[calc(100vh-4rem)] ${dissolved ? 'scale-100 opacity-100' : 'scale-[0.55] opacity-0'}`}
          style={{ transitionDelay: dissolved ? '340ms' : '0ms' }}
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
                    // Começa depois do painel já ter emergido (340ms de atraso + o grosso dos
                    // 900ms de escala), pra cascata de linhas ler como o texto se formando já
                    // no lugar, não durante o voo.
                    style={{ transitionDelay: dissolved ? `${760 + index * 35}ms` : '0ms' }}
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
