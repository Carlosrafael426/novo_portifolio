import { buildNearestNeighbors, buildNodesInRect } from '@/utils/constellation';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 700;
const NODE_COUNT = 70;
const NEIGHBORS_PER_NODE = 2;
const MAX_CONNECT_DISTANCE = 160;

const NODES = buildNodesInRect(NODE_COUNT, { minX: 0, maxX: VIEW_WIDTH, minY: 0, maxY: VIEW_HEIGHT });
const CONNECTIONS = buildNearestNeighbors(NODES, NEIGHBORS_PER_NODE, MAX_CONNECT_DISTANCE);

interface TechBackdropProps {
  className?: string;
}

/**
 * Fundo técnico ambiente — mesma linguagem visual do sistema neural do Hero (nós/linhas em lima,
 * bem discreto), estático e sem interação, só pra dar textura atrás da seção.
 */
export function TechBackdrop({ className }: TechBackdropProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#c6ff45" strokeWidth="0.5" opacity="0.12">
        {CONNECTIONS.map(([a, b], i) => (
          <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
        ))}
      </g>
      <g fill="#c6ff45" opacity="0.3">
        {NODES.map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r={node.r * 0.7} />
        ))}
      </g>
    </svg>
  );
}
