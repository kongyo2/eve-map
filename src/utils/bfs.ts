export type TradeHubResult = {
  readonly hubId: number;
  readonly distance: number;
  readonly path: readonly number[];
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
