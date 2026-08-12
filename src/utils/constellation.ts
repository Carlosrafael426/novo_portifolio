export interface ConstellationNode {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  r: number;
}

export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function randomRadius(): number {
  return Math.random() < 0.1 ? 2.2 + Math.random() * 1.4 : 0.9 + Math.random() * 1.1;
}

/** Espalha pontos por rejeição — só aceita os que caem dentro de algum círculo (união de lobos). */
export function buildNodesInCircles(
  count: number,
  circles: Circle[],
  extraPoints: Array<{ x: number; y: number }> = [],
): ConstellationNode[] {
  const minX = Math.min(...circles.map((c) => c.cx - c.r));
  const maxX = Math.max(...circles.map((c) => c.cx + c.r));
  const minY = Math.min(...circles.map((c) => c.cy - c.r));
  const maxY = Math.max(...circles.map((c) => c.cy + c.r));

  const nodes: ConstellationNode[] = [];
  let attempts = 0;

  while (nodes.length < count && attempts < count * 40) {
    attempts += 1;
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    if (circles.some((c) => Math.hypot(x - c.cx, y - c.cy) < c.r)) {
      nodes.push({ baseX: x, baseY: y, x, y, r: randomRadius() });
    }
  }

  for (const point of extraPoints) {
    const x = point.x + (Math.random() - 0.5) * 6;
    nodes.push({ baseX: x, baseY: point.y, x, y: point.y, r: 1.3 + Math.random() * 0.7 });
  }

  return nodes;
}

/** Pontos uniformemente aleatórios num retângulo — usado pelo fundo técnico ambiente. */
export function buildNodesInRect(count: number, bounds: Bounds): ConstellationNode[] {
  const nodes: ConstellationNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
    nodes.push({ baseX: x, baseY: y, x, y, r: randomRadius() });
  }
  return nodes;
}

/** Conecta cada nó aos seus vizinhos mais próximos (por posição-base), como pares de índices. */
export function buildNearestNeighbors(
  nodes: Array<{ baseX: number; baseY: number }>,
  neighborsPerNode: number,
  maxDistance: number,
): Array<[number, number]> {
  const seen = new Set<string>();
  const pairs: Array<[number, number]> = [];

  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({
        j,
        d: i === j ? Infinity : Math.hypot(node.baseX - other.baseX, node.baseY - other.baseY),
      }))
      .filter((entry) => entry.d < maxDistance)
      .sort((a, b) => a.d - b.d)
      .slice(0, neighborsPerNode);

    for (const { j } of nearest) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([i, j]);
    }
  });

  return pairs;
}
