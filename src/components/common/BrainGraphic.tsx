interface Circle {
  cx: number;
  cy: number;
  r: number;
}

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

function insideAnyLobe(x: number, y: number): boolean {
  return LOBES.some((lobe) => Math.hypot(x - lobe.cx, y - lobe.cy) < lobe.r);
}

function buildNodes(): Array<{ x: number; y: number; r: number }> {
  const minX = Math.min(...LOBES.map((l) => l.cx - l.r));
  const maxX = Math.max(...LOBES.map((l) => l.cx + l.r));
  const minY = Math.min(...LOBES.map((l) => l.cy - l.r));
  const maxY = Math.max(...LOBES.map((l) => l.cy + l.r));

  const nodes: Array<{ x: number; y: number; r: number }> = [];
  let attempts = 0;

  while (nodes.length < NODE_COUNT && attempts < NODE_COUNT * 40) {
    attempts += 1;
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    if (insideAnyLobe(x, y)) {
      nodes.push({ x, y, r: Math.random() < 0.12 ? 2.6 + Math.random() * 1.4 : 1.1 + Math.random() * 1.1 });
    }
  }

  for (const point of BRAINSTEM) {
    nodes.push({ x: point.x + (Math.random() - 0.5) * 6, y: point.y, r: 1.4 + Math.random() * 0.8 });
  }

  return nodes;
}

function buildConnections(
  nodes: Array<{ x: number; y: number }>,
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const seen = new Set<string>();
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  nodes.forEach((node, i) => {
    const distances = nodes
      .map((other, j) => ({ j, d: i === j ? Infinity : Math.hypot(node.x - other.x, node.y - other.y) }))
      .filter((entry) => entry.d < MAX_CONNECT_DISTANCE)
      .sort((a, b) => a.d - b.d)
      .slice(0, NEIGHBORS_PER_NODE);

    for (const { j } of distances) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push({ x1: node.x, y1: node.y, x2: nodes[j].x, y2: nodes[j].y });
    }
  });

  // Cadeia do tronco cerebral — conecta os pontos em sequência, não por proximidade.
  const stemStart = nodes.length - BRAINSTEM.length;
  for (let i = stemStart; i < nodes.length - 1; i++) {
    lines.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[i + 1].x, y2: nodes[i + 1].y });
  }
  const nearestToStem = nodes
    .slice(0, stemStart)
    .map((n, idx) => ({ idx, d: Math.hypot(n.x - nodes[stemStart].x, n.y - nodes[stemStart].y) }))
    .sort((a, b) => a.d - b.d)[0];
  if (nearestToStem) {
    const anchor = nodes[nearestToStem.idx];
    lines.push({ x1: anchor.x, y1: anchor.y, x2: nodes[stemStart].x, y2: nodes[stemStart].y });
  }

  return lines;
}

// Computado uma única vez no carregamento do módulo — gráfico decorativo estático, sem estado.
const NODES = buildNodes();
const CONNECTIONS = buildConnections(NODES);

interface BrainGraphicProps {
  className?: string;
}

export function BrainGraphic({ className }: BrainGraphicProps) {
  return (
    <svg
      viewBox="0 0 420 380"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#c6ff45" strokeWidth="0.6" opacity="0.22">
        {CONNECTIONS.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
        ))}
      </g>
      <g fill="#c6ff45">
        {NODES.map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r={node.r} opacity={node.r > 2.4 ? 0.95 : 0.55} />
        ))}
      </g>
    </svg>
  );
}
