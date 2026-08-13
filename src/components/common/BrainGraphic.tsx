import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import { connectComponents, type ConstellationNode } from '@/utils/constellation';
import { aboutContent } from '@/data/about';

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// Lobos aproximados por elipses bem sobrepostas — lê como uma massa só com bojos nos lugares
// certos (frontal/parietal alongado, temporal pendurado, occipital+cerebelo atrás), sem precisar
// de um path desenhado à mão. Não é anatomicamente exato, mas é reconhecível como cérebro.
const LOBES: Ellipse[] = [
  { cx: 205, cy: 108, rx: 150, ry: 72 }, // frontal + parietal, bem alongada
  { cx: 335, cy: 128, rx: 68, ry: 62 }, // occipital (trás)
  { cx: 78, cy: 122, rx: 58, ry: 58 }, // arredondamento frontal (frente)
  { cx: 112, cy: 205, rx: 78, ry: 54 }, // temporal (pendurado embaixo/frente)
  { cx: 308, cy: 222, rx: 55, ry: 42 }, // cerebelo (trás/embaixo)
];

// Notch curto — só sugere a fissura lateral, não desconecta nada.
const NOTCH: Array<{ cx: number; cy: number; r: number }> = [
  { cx: 150, cy: 168, r: 11 },
  { cx: 175, cy: 172, r: 10 },
  { cx: 198, cy: 173, r: 9 },
];

const BRAINSTEM: Array<{ x: number; y: number }> = [
  { x: 250, y: 258 },
  { x: 258, y: 278 },
  { x: 267, y: 298 },
  { x: 278, y: 318 },
];

const VIEW_WIDTH = 440;
const VIEW_HEIGHT = 340;
const NODE_COUNT = 175;
const NEIGHBORS_PER_NODE = 2;
const MAX_CONNECT_DISTANCE = 42;
const INTERSECTION_DEGREE = 4;
const PARTICLE_COUNT = 20;
const PARTICLE_SPEED_MIN = 0.09;
const PARTICLE_SPEED_MAX = 0.22;

function insideAnyLobe(x: number, y: number): boolean {
  return LOBES.some((l) => ((x - l.cx) / l.rx) ** 2 + ((y - l.cy) / l.ry) ** 2 < 1);
}
function insideNotch(x: number, y: number): boolean {
  return NOTCH.some((c) => Math.hypot(x - c.cx, y - c.cy) < c.r);
}

function buildNodes(): ConstellationNode[] {
  const minX = Math.min(...LOBES.map((l) => l.cx - l.rx));
  const maxX = Math.max(...LOBES.map((l) => l.cx + l.rx));
  const minY = Math.min(...LOBES.map((l) => l.cy - l.ry));
  const maxY = Math.max(...LOBES.map((l) => l.cy + l.ry));

  const nodes: ConstellationNode[] = [];
  let attempts = 0;
  while (nodes.length < NODE_COUNT && attempts < NODE_COUNT * 50) {
    attempts += 1;
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    if (!insideAnyLobe(x, y) || insideNotch(x, y)) continue;
    const r = Math.random() < 0.09 ? 1.8 + Math.random() * 0.9 : 0.7 + Math.random() * 0.7;
    nodes.push({ baseX: x, baseY: y, x, y, r });
  }

  for (const point of BRAINSTEM) {
    const x = point.x + (Math.random() - 0.5) * 6;
    nodes.push({ baseX: x, baseY: point.y, x, y: point.y, r: 0.9 + Math.random() * 0.5 });
  }

  return nodes;
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

  const stemStart = nodes.length - BRAINSTEM.length;
  for (let i = stemStart; i < nodes.length - 1; i++) pairs.push([i, i + 1]);
  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < stemStart; i++) {
    const d = Math.hypot(nodes[i].baseX - nodes[stemStart].baseX, nodes[i].baseY - nodes[stemStart].baseY);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }
  pairs.push([nearestIdx, stemStart]);

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

function buildBrain() {
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

// Realce de sintaxe minimalista, só com os tons que o site já usa (accent/foreground/muted) —
// sem paleta nova. As chaves do objeto espelham a interface AboutContent de verdade
// (src/types/about.ts), não são inventadas.
const KEYWORD = 'text-accent';
const TYPE_NAME = 'text-foreground/50';
const PROPERTY = 'text-foreground/70';
const STRING = 'text-foreground';
const PUNCT = 'text-muted';
const COMMENT = 'text-muted italic';

function kw(text: string) {
  return <span className={KEYWORD}>{text}</span>;
}
function type(text: string) {
  return <span className={TYPE_NAME}>{text}</span>;
}
function prop(text: string) {
  return <span className={PROPERTY}>{text}</span>;
}
function str(text: string) {
  return (
    <span className={STRING}>
      <span className={PUNCT}>"</span>
      {text}
      <span className={PUNCT}>"</span>
    </span>
  );
}
function punct(text: string) {
  return <span className={PUNCT}>{text}</span>;
}

interface CodeLine {
  content: ReactNode;
}

function stringArrayLines(items: string[]): CodeLine[] {
  return items.map((item) => ({ content: <>{'    '}{str(item)}{punct(',')}</> }));
}

const CODE_LINES: CodeLine[] = [
  { content: <span className={COMMENT}>{'// sobre-mim.ts'}</span> },
  { content: <>{' '}</> },
  { content: <>{kw('interface')}{' '}{type('AboutContent')}{' '}{punct('{')}</> },
  { content: <>{'  '}{prop('bio')}{punct(': ')}{type('string[]')}{punct(';')}</> },
  { content: <>{'  '}{prop('philosophy')}{punct(': ')}{type('string')}{punct(';')}</> },
  { content: <>{'  '}{prop('lookingFor')}{punct(': ')}{type('string[]')}{punct(';')}</> },
  { content: <>{punct('}')}</> },
  { content: <>{' '}</> },
  { content: <>{kw('const')}{' carlos: '}{type('AboutContent')}{' '}{punct('= {')}</> },
  { content: <>{'  '}{prop('bio')}{punct(': [')}</> },
  ...stringArrayLines(aboutContent.bio),
  { content: <>{'  '}{punct('],')}</> },
  { content: <>{'  '}{prop('philosophy')}{punct(':')}</> },
  { content: <>{'    '}{str(aboutContent.philosophy)}{punct(',')}</> },
  { content: <>{'  '}{prop('lookingFor')}{punct(': [')}</> },
  ...stringArrayLines(aboutContent.lookingFor),
  { content: <>{'  '}{punct('],')}</> },
  { content: <>{punct('};')}</> },
  { content: <>{' '}</> },
  { content: <>{kw('export')}{' '}{kw('default')}{' carlos;'}</> },
];

interface BrainGraphicProps {
  className?: string;
}

/**
 * Constelação em formato de cérebro. Partículas viajam pelas conexões e as interseções (nós com
 * mais de uma linha) brilham. Ao passar o mouse (ou tocar, em telas touch) os nós se desfazem
 * coordenadamente pra fora e dão lugar a um bloco de "código" com o texto sobre mim — solta ao
 * afastar o mouse / tocar de novo. Nunca toca o cursor nativo, só o próprio desenho.
 */
export function BrainGraphic({ className }: BrainGraphicProps) {
  const filterId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dissolved, setDissolved] = useState(false);

  const dataRef = useRef<ReturnType<typeof buildBrain> | null>(null);
  if (dataRef.current === null) {
    dataRef.current = buildBrain();
  }
  const { nodes, connections, intersectionNodes, particles } = dataRef.current;

  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const particleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const modeRef = useRef<'idle' | 'dissolved' | 'transitioning'>('idle');

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const reducedMotion = prefersReducedMotion();
    const fine = isFinePointer();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(svg);

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
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    const ctx = gsap.context(() => {
      // Máquina de estado simples: 'idle' (cérebro normal, loop rodando) -> 'transitioning'
      // (GSAP no controle) -> 'dissolved' (código visível, parado) -> 'transitioning' -> 'idle'.
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

      function handleEnter() {
        explode();
      }
      function handleLeave() {
        reform();
      }
      // Toque/clique alternam o estado — funciona em qualquer dispositivo, é o único jeito de
      // acionar o efeito em telas touch (sem hover).
      function handleClick() {
        if (modeRef.current === 'idle') explode();
        else if (modeRef.current === 'dissolved') reform();
      }

      if (fine) {
        svg.addEventListener('pointerenter', handleEnter);
        svg.addEventListener('pointerleave', handleLeave);
      }
      svg.addEventListener('click', handleClick);

      return () => {
        if (fine) {
          svg.removeEventListener('pointerenter', handleEnter);
          svg.removeEventListener('pointerleave', handleLeave);
        }
        svg.removeEventListener('click', handleClick);
      };
    }, svg);

    return () => {
      observer?.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dados são estáveis (ref lazy-init), não precisam entrar nas deps
  }, []);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        aria-hidden="true"
        className="h-auto w-full"
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

        {/* Área de detecção do ponteiro cobrindo o viewBox inteiro — sem isso, pointerenter/leave
            só disparam em cima das formas pintadas (linhas/pontos finos), não do espaço vazio
            entre elas. */}
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
              r={intersectionNodes[i] ? node.r + 0.6 : node.r}
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

      {/* fixed (não absolute dentro do próprio gráfico) pra aparecer "no meio da tela" de
          verdade — com o conteúdo todo, a caixa do cérebro é pequena demais e o texto
          transbordava por cima do título em telas estreitas. */}
      <div
        className={`pointer-events-none fixed inset-0 z-(--z-mobile-menu) flex items-center justify-center p-4 transition-opacity duration-500 sm:p-8 ${dissolved ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          aria-hidden="true"
          className="bg-background/85 pointer-events-none absolute inset-0"
        />
        <div className="relative max-h-[80vh] max-w-lg overflow-y-auto text-left font-mono text-[10px] whitespace-pre-wrap leading-relaxed sm:text-xs">
          {CODE_LINES.map((line, index) => (
            <p
              key={index}
              className={`transition-opacity duration-400 ease-out ${dissolved ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: dissolved ? `${index * 45}ms` : '0ms' }}
            >
              {line.content}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
