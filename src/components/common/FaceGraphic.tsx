import { useEffect, useId, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { connectComponents, type ConstellationNode } from '@/utils/constellation';
import { aboutContent } from '@/data/about';

type Point = [number, number];

const CENTER_X = 150;

// Perfil do lado direito da cabeça, do topo do crânio até a base do pescoço (y crescente = mais
// pra baixo) — mandíbula larga, queixo definido, pescoço curto (só "do pescoço pra cima", sem
// ombros). O lado esquerdo é gerado espelhando esses mesmos pontos, o que garante uma silhueta
// simétrica e sem auto-interseção (o risco de um polígono desenhado ponto a ponto nos dois lados).
// Estreita de forma monótona do zigomático até o pescoço — nunca alarga de novo depois do
// queixo, senão o pescoço lê como um segundo blob "amarrado" embaixo da cabeça em vez de um
// pescoço só.
const RIGHT_PROFILE: Point[] = [
  [194, 26], // crânio superior
  [230, 54], // crânio, ponto mais largo (têmpora)
  [233, 88], // logo abaixo da têmpora, altura da orelha
  [226, 120], // bochecha superior
  [218, 150], // zigomático — mais largo do rosto (mandíbula larga, masculina)
  [204, 176], // ângulo da mandíbula
  [186, 200], // mandíbula inferior
  [168, 220], // queixo
  [160, 240], // topo do pescoço, mais estreito que a mandíbula
  [158, 305], // base do pescoço (corte da silhueta), quase reto
];

const FACE_POLY: Point[] = [
  [CENTER_X, 14],
  ...RIGHT_PROFILE,
  ...RIGHT_PROFILE.slice()
    .reverse()
    .map(([x, y]): Point => [2 * CENTER_X - x, y]),
];

const EARS = [
  { cx: CENTER_X - 95, cy: 104, rx: 13, ry: 24 },
  { cx: CENTER_X + 95, cy: 104, rx: 13, ry: 24 },
];

const EXCLUDE = [
  { cx: CENTER_X - 40, cy: 135, r: 13 }, // olho esquerdo
  { cx: CENTER_X + 40, cy: 135, r: 13 }, // olho direito
  { cx: CENTER_X - 13, cy: 190, r: 7 }, // boca, esquerda
  { cx: CENTER_X + 13, cy: 190, r: 7 }, // boca, direita
];

const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 320;
const NODE_COUNT = 260;
const NODE_EDGE_BIAS = 0.55;
const NEIGHBORS_PER_NODE = 2;
const MAX_CONNECT_DISTANCE = 26;
const INTERSECTION_DEGREE = 4;
const PARTICLE_COUNT = 22;
const PARTICLE_SPEED_MIN = 0.09;
const PARTICLE_SPEED_MAX = 0.22;

// Rotação da cabeça acompanhando o mouse (só desktop com ponteiro fino).
const MAX_ROTATE_Y = 18;
const MAX_ROTATE_X = 8;
const ROTATE_RANGE_PX = 420;
const ROTATE_DAMPING = 0.06;

function pointInPolygon(x: number, y: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToPolygonEdge(x: number, y: number, poly: Point[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[j];
    const [x2, y2] = poly[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((x - x1) * dx + (y - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const d = Math.hypot(x - px, y - py);
    if (d < best) best = d;
  }
  return best;
}

function insideEars(x: number, y: number): boolean {
  return EARS.some((e) => ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 < 1);
}
function insideExclude(x: number, y: number): boolean {
  return EXCLUDE.some((c) => Math.hypot(x - c.cx, y - c.cy) < c.r);
}

function buildRegionNodes(
  count: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  edgeBias: number,
): ConstellationNode[] {
  const nodes: ConstellationNode[] = [];
  let attempts = 0;
  while (nodes.length < count && attempts < count * 80) {
    attempts += 1;
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const inside = pointInPolygon(x, y, FACE_POLY) || insideEars(x, y);
    if (!inside || insideExclude(x, y)) continue;

    const nearEdge = distToPolygonEdge(x, y, FACE_POLY) < 16;
    if (nearEdge || Math.random() < edgeBias) {
      const r = Math.random() < 0.09 ? 0.9 + Math.random() * 0.45 : 0.7 + Math.random() * 0.7;
      nodes.push({ baseX: x, baseY: y, x, y, r });
    }
  }
  return nodes;
}

function buildNodes(): ConstellationNode[] {
  // Só cabeça+pescoço agora (sem ombros) — uma única região cobre a silhueta inteira sem
  // precisar dividir orçamento entre sub-áreas de tamanho muito diferente.
  return buildRegionNodes(NODE_COUNT, 35, 265, 8, 310, NODE_EDGE_BIAS);
}

function buildConnections(nodes: ConstellationNode[]): Array<[number, number]> {
  const seen = new Set<string>();
  const pairs: Array<[number, number]> = [];

  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({
        j,
        d: i === j ? Infinity : Math.hypot(node.baseX - other.baseX, node.baseY - other.baseY),
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

  return connectComponents(nodes, pairs);
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
  const nodes = buildNodes();
  const connections = buildConnections(nodes);

  const degree = new Array(nodes.length).fill(0);
  for (const [a, b] of connections) {
    degree[a] += 1;
    degree[b] += 1;
  }
  const intersectionNodes = nodes.map((_, i) => degree[i] >= INTERSECTION_DEGREE);

  const particles = buildParticles(connections.length);

  return { nodes, connections, intersectionNodes, particles };
}

function isFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
 * Constelação em formato de rosto (de frente, feições masculinas). Partículas viajam pelas
 * conexões; interseções (nós com várias linhas) brilham. O rosto acompanha o mouse virando a
 * cabeça (rotação 3D via CSS, só ponteiro fino) — olha pra tela em repouso. Um clique dispara a
 * explosão coordenada dos nós e revela o texto "sobre mim"; clicar no texto reconstrói o rosto.
 * Nunca toca o cursor nativo, só o próprio desenho.
 */
export function FaceGraphic({ className }: FaceGraphicProps) {
  const filterId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dissolved, setDissolved] = useState(false);

  const dataRef = useRef<ReturnType<typeof buildFace> | null>(null);
  if (dataRef.current === null) {
    dataRef.current = buildFace();
  }
  const { nodes, connections, intersectionNodes, particles } = dataRef.current;

  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const particleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const modeRef = useRef<'idle' | 'dissolved' | 'transitioning'>('idle');
  const reformRef = useRef<() => void>(() => {});

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const svg = svgRef.current;
    if (!wrapper || !svg) return;

    const reducedMotion = prefersReducedMotion();
    const fine = isFinePointer();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(svg);

    const pointer = { x: 0, y: 0, active: false };
    function handleWindowPointerMove(event: PointerEvent) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }
    if (fine && !reducedMotion) {
      window.addEventListener('pointermove', handleWindowPointerMove);
    }

    const rotation = { x: 0, y: 0 };

    let frame: number | undefined;
    let lastTimestamp: number | undefined;
    if (!reducedMotion) {
      const tick = (timestamp: number) => {
        const deltaSeconds = lastTimestamp === undefined ? 0 : Math.min((timestamp - lastTimestamp) / 1000, 0.1);
        lastTimestamp = timestamp;

        if (isVisible && modeRef.current === 'idle') {
          const elapsed = timestamp / 1000;

          for (const particle of particles) {
            particle.progress = (particle.progress + particle.speed * deltaSeconds) % 1;
          }

          nodes.forEach((node, i) => {
            node.x = node.baseX + Math.sin(elapsed * 0.4 + i) * 1.2;
            node.y = node.baseY + Math.cos(elapsed * 0.35 + i * 1.3) * 1.2;
            const circle = circleRefs.current[i];
            if (circle) {
              circle.setAttribute('cx', node.x.toFixed(2));
              circle.setAttribute('cy', node.y.toFixed(2));
            }
          });

          connections.forEach(([a, b], i) => {
            const line = lineRefs.current[i];
            if (line) {
              line.setAttribute('x1', nodes[a].x.toFixed(2));
              line.setAttribute('y1', nodes[a].y.toFixed(2));
              line.setAttribute('x2', nodes[b].x.toFixed(2));
              line.setAttribute('y2', nodes[b].y.toFixed(2));
            }
          });

          particles.forEach((particle, i) => {
            const [a, b] = connections[particle.connectionIndex];
            const px = nodes[a].x + (nodes[b].x - nodes[a].x) * particle.progress;
            const py = nodes[a].y + (nodes[b].y - nodes[a].y) * particle.progress;
            const dot = particleRefs.current[i];
            if (dot) {
              dot.setAttribute('cx', px.toFixed(2));
              dot.setAttribute('cy', py.toFixed(2));
            }
          });

          // Cabeça acompanha o mouse — olha pra tela (rotação 0) enquanto não houver posição
          // real do ponteiro ainda.
          if (fine) {
            let targetY = 0;
            let targetX = 0;
            if (pointer.active) {
              const rect = wrapper.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dx = pointer.x - centerX;
              const dy = pointer.y - centerY;
              targetY = Math.max(-1, Math.min(1, dx / ROTATE_RANGE_PX)) * MAX_ROTATE_Y;
              targetX = Math.max(-1, Math.min(1, -dy / ROTATE_RANGE_PX)) * MAX_ROTATE_X;
            }
            rotation.y += (targetY - rotation.y) * ROTATE_DAMPING;
            rotation.x += (targetX - rotation.x) * ROTATE_DAMPING;
            wrapper.style.transform = `perspective(1000px) rotateY(${rotation.y.toFixed(2)}deg) rotateX(${rotation.x.toFixed(2)}deg)`;
          }
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    const ctx = gsap.context(() => {
      // Máquina de estado simples: 'idle' (rosto normal, loop rodando) -> 'transitioning'
      // (GSAP no controle) -> 'dissolved' (código visível, parado) -> 'transitioning' -> 'idle'.
      // Animação de explosão/reconstrução intocada — só o gatilho (clique) mudou.
      function explode() {
        if (modeRef.current !== 'idle') return;
        modeRef.current = 'transitioning';
        setDissolved(true);
        if (reducedMotion) {
          modeRef.current = 'dissolved';
          return;
        }

        const cx = VIEW_WIDTH / 2;
        const cy = VIEW_HEIGHT / 2;
        const targets = nodes.map((node) => {
          const dx = node.baseX - cx;
          const dy = node.baseY - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const push = 70 + Math.random() * 90;
          return { x: node.baseX + (dx / dist) * push, y: node.baseY + (dy / dist) * push };
        });

        circleRefs.current.forEach((circle, i) => {
          if (!circle) return;
          gsap.to(circle, {
            attr: { cx: targets[i].x, cy: targets[i].y },
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            delay: Math.random() * 0.25,
          });
        });
        gsap.to([...lineRefs.current, ...particleRefs.current], {
          opacity: 0,
          duration: 0.35,
          ease: 'power1.out',
          onComplete: () => {
            modeRef.current = 'dissolved';
          },
        });
      }

      function reform() {
        if (modeRef.current !== 'dissolved') return;
        modeRef.current = 'transitioning';
        setDissolved(false);
        if (reducedMotion) {
          modeRef.current = 'idle';
          return;
        }

        circleRefs.current.forEach((circle, i) => {
          if (!circle) return;
          gsap.to(circle, {
            attr: { cx: nodes[i].baseX, cy: nodes[i].baseY },
            opacity: intersectionNodes[i] ? 0.65 : 0.3,
            duration: 0.8,
            ease: 'power3.out',
            delay: Math.random() * 0.2,
            onComplete: () => {
              nodes[i].x = nodes[i].baseX;
              nodes[i].y = nodes[i].baseY;
            },
          });
        });
        gsap.to([...lineRefs.current, ...particleRefs.current], {
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: 'power1.out',
          onComplete: () => {
            modeRef.current = 'idle';
          },
        });
      }

      reformRef.current = reform;

      function handleClick() {
        if (modeRef.current === 'idle') explode();
      }

      svg.addEventListener('click', handleClick);

      return () => {
        svg.removeEventListener('click', handleClick);
      };
    }, svg);

    return () => {
      observer.disconnect();
      if (fine && !reducedMotion) {
        window.removeEventListener('pointermove', handleWindowPointerMove);
      }
      if (frame !== undefined) cancelAnimationFrame(frame);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dados são estáveis (ref lazy-init), não precisam entrar nas deps
  }, []);

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        aria-hidden="true"
        className="h-full w-auto cursor-pointer"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={filterId} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Área de detecção do clique cobrindo o viewBox inteiro — sem isso, só formas pintadas
            (linhas/pontos finos) registrariam o clique, não o espaço vazio entre elas. */}
        <rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="transparent" />

        <g stroke="#c6ff45" strokeWidth="0.5" opacity="0.16">
          {connections.map(([a, b], i) => (
            <line
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
            />
          ))}
        </g>

        <g fill="#c6ff45">
          {nodes.map((node, i) => (
            <circle
              key={i}
              ref={(el) => {
                circleRefs.current[i] = el;
              }}
              cx={node.x}
              cy={node.y}
              r={intersectionNodes[i] ? node.r + 0.3 : node.r}
              opacity={intersectionNodes[i] ? 0.65 : 0.3}
              filter={intersectionNodes[i] ? `url(#${filterId})` : undefined}
            />
          ))}
        </g>

        <g fill="#eaffb0" filter={`url(#${filterId})`}>
          {particles.map((particle, i) => {
            const [a, b] = connections[particle.connectionIndex];
            const px = nodes[a].x + (nodes[b].x - nodes[a].x) * particle.progress;
            const py = nodes[a].y + (nodes[b].y - nodes[a].y) * particle.progress;
            return (
              <circle
                key={i}
                ref={(el) => {
                  particleRefs.current[i] = el;
                }}
                cx={px}
                cy={py}
                r={1.5}
                opacity={0.9}
              />
            );
          })}
        </g>
      </svg>

      {/* fixed (não absolute dentro do próprio gráfico) pra aparecer no meio da tela — clicável
          quando visível pra reconstruir o rosto. */}
      <div
        ref={overlayRef}
        onClick={() => reformRef.current()}
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
