export type NearbyResult = {
  readonly systemId: number;
  readonly distance: number;
};

export const findSystemsInRange = (
  originId: number,
  adjacencyList: ReadonlyMap<number, readonly number[]>,
  maxJumps: number,
): readonly NearbyResult[] => {
  const results: NearbyResult[] = [];
  const visited = new Set<number>([originId]);
  const queue: { id: number; dist: number }[] = [{ id: originId, dist: 0 }];

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (dist > 0) {
      results.push({ systemId: id, distance: dist });
    }
    if (dist >= maxJumps) continue;
    const neighbors = adjacencyList.get(id) ?? [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push({ id: neighbor, dist: dist + 1 });
    }
  }

  return results;
};

export type TradeHubResult = {
  readonly hubId: number;
  readonly distance: number;
  readonly path: readonly number[];
  readonly tier?: 'primary' | 'secondary';
};

export const findNearestTradeHub = (
  startId: number,
  adjacencyList: ReadonlyMap<number, readonly number[]>,
  tradeHubIds: readonly number[],
): TradeHubResult | null => {
  const tradeHubSet = new Set(tradeHubIds);

  if (tradeHubSet.has(startId)) {
    return { hubId: startId, distance: 0, path: [startId] };
  }

  const visited = new Set<number>([startId]);
  const parent = new Map<number, number>();
  const queue: number[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacencyList.get(current) ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, current);

      if (tradeHubSet.has(neighbor)) {
        const path: number[] = [neighbor];
        let node = neighbor;
        while (parent.has(node)) {
          node = parent.get(node)!;
          path.push(node);
        }
        path.reverse();
        return { hubId: neighbor, distance: path.length - 1, path };
      }

      queue.push(neighbor);
    }
  }

  return null;
};
