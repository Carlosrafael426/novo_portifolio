import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  buildNearestNeighbors,
  buildNodesInCircles,
  type Circle,
  type ConstellationNode,
} from '@/utils/constellation';

// Lobos do cérebro aproximados por círculos sobrepostos — não é anatomicamente exato, mas dá a
// silhueta reconhecível (frontal, parietal, temporal, occipital, cerebelo) sem precisar de um
// path SVG desenhado à mão.
const LOBES: Circle[] = [
  { cx: 150, cy: 130, r: 95 }, // frontal
  { cx: 262, cy: 100, r: 100 }, // parietal
  { cx: 122, cy: 228, r: 76 }, // temporal
  { cx: 322, cy: 190, r: 85 }, // occipital
  { cx: 228, cy: 242, r: 72 }, // preenche o vão entre os lobos
  { cx: 300, cy: 282, r: 48 }, // cerebelo
];

const BRAINSTEM: Array<{ x: number; y: number }> = [
  { x: 246, y: 312 },
  { x: 252, y: 332 },
  { x: 260, y: 352 },
  { x: 270, y: 370 },
];

const NODE_COUNT = 165;
const NEIGHBORS_PER_NODE = 2;
const MAX_CONNECT_DISTANCE = 55;

const VIEW_WIDTH = 420;
const VIEW_HEIGHT = 380;

const MOUSE_RADIUS = 65;
const MOUSE_STRENGTH = 20;
const DAMPING = 0.09;

function buildStemConnections(nodes: ConstellationNode[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const stemStart = nodes.length - BRAINSTEM.length;

  for (let i = stemStart; i < nodes.length - 1; i++) {
    pairs.push([i, i + 1]);
  }

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

  return pairs;
}

function buildBrain(): { nodes: ConstellationNode[]; connections: Array<[number, number]> } {
  const nodes = buildNodesInCircles(NODE_COUNT, LOBES, BRAINSTEM);
  const connections = [
    ...buildNearestNeighbors(nodes, NEIGHBORS_PER_NODE, MAX_CONNECT_DISTANCE),
    ...buildStemConnections(nodes),
  ];
  return { nodes, connections };
}

function useIsElementVisible(ref: RefObject<Element | null>): RefObject<boolean> {
  const visible = useRef(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

interface BrainGraphicProps {
  className?: string;
}

/**
 * Constelação em formato de cérebro — nós/linhas reagem sutilmente à proximidade do mouse
 * (atração amortecida, solta suave ao afastar). Nunca toca o cursor nativo — só desloca os
 * próprios nós (ver memória do usuário: alterar o ponteiro do mouse é a linha vermelha, reagir
 * ao mouse no conteúdo é permitido quando pedido).
 */
export function BrainGraphic({ className }: BrainGraphicProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isVisible = useIsElementVisible(svgRef);

  const dataRef = useRef<{ nodes: ConstellationNode[]; connections: Array<[number, number]> } | null>(null);
  if (dataRef.current === null) {
    dataRef.current = buildBrain();
  }
  const { nodes, connections } = dataRef.current;

  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const pointer = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    function toViewBoxPoint(clientX: number, clientY: number) {
      const rect = svg!.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((clientY - rect.top) / rect.height) * VIEW_HEIGHT,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      const point = toViewBoxPoint(event.clientX, event.clientY);
      pointer.current = { ...point, active: true };
    }

    function handlePointerLeave() {
      pointer.current.active = false;
    }

    svg.addEventListener('pointermove', handlePointerMove);
    svg.addEventListener('pointerleave', handlePointerLeave);

    let frame: number;

    function tick() {
      if (isVisible.current) {
        for (const node of nodes) {
          let targetX = node.baseX;
          let targetY = node.baseY;

          if (pointer.current.active) {
            const dx = node.baseX - pointer.current.x;
            const dy = node.baseY - pointer.current.y;
            const dist = Math.hypot(dx, dy);
            if (dist < MOUSE_RADIUS && dist > 0.01) {
              const pull = (1 - dist / MOUSE_RADIUS) * MOUSE_STRENGTH;
              targetX = node.baseX + (dx / dist) * pull;
              targetY = node.baseY + (dy / dist) * pull;
            }
          }

          node.x += (targetX - node.x) * DAMPING;
          node.y += (targetY - node.y) * DAMPING;
        }

        nodes.forEach((node, i) => {
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
      }

      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      svg.removeEventListener('pointermove', handlePointerMove);
      svg.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(frame);
    };
  }, [nodes, connections, isVisible]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#c6ff45" strokeWidth="0.6" opacity="0.22">
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
            r={node.r}
            opacity={node.r > 2.4 ? 0.95 : 0.55}
          />
        ))}
      </g>
    </svg>
  );
}
