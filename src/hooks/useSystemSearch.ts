import { useMemo } from 'react';
import { useUniverseStore } from '../store/universeStore';

export type SearchResult = {
  readonly type: 'system' | 'region' | 'constellation';
  readonly id: number;
  readonly name: string;
  readonly securityStatus?: number;
  readonly regionName?: string;
  readonly constellationName?: string;
};

export const useSystemSearch = (query: string): readonly SearchResult[] => {
  const systems = useUniverseStore((s) => s.systems);
  const regions = useUniverseStore((s) => s.regions);
  const constellations = useUniverseStore((s) => s.constellations);

  return useMemo(() => {
    if (query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search regions
    for (const [, region] of regions) {
      if (region.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'region',
          id: region.id,
          name: region.name,
        });
      }
    }

    // Search constellations
    for (const [, constellation] of constellations) {
      if (constellation.name.toLowerCase().includes(lowerQuery)) {
        const region = regions.get(constellation.regionId);
        results.push({
          type: 'constellation',
          id: constellation.id,
          name: constellation.name,
          regionName: region?.name,
        });
      }
    }

    // Search systems
    for (const [, system] of systems) {
      if (system.name.toLowerCase().includes(lowerQuery)) {
        const constellation = constellations.get(system.constellationId);
        const region = regions.get(system.regionId);
        results.push({
          type: 'system',
          id: system.id,
          name: system.name,
          securityStatus: system.securityStatus,
          regionName: region?.name,
          constellationName: constellation?.name,
        });
      }
    }

    // Sort: exact matches first, then starts-with, then contains
    results.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aExact = aLower === lowerQuery;
      const bExact = bLower === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aLower.startsWith(lowerQuery);
      const bStarts = bLower.startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Systems before constellations before regions
      const typeOrder = { system: 0, constellation: 1, region: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return results.slice(0, 50);
  }, [query, systems, regions, constellations]);
};
