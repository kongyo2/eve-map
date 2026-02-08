import { create } from 'zustand';
import type {
  Region,
  Constellation,
  NormalizedSystem,
  StargateConnection,
} from '../types/universe';
import {
  fetchRegionIds,
  fetchRegions,
  fetchConstellations,
  fetchSystems,
  fetchStargates,
} from '../api/esi';
import { readCache, writeCache } from '../utils/cache';
import { normalizePosition } from '../utils/coordinates';

type LoadingPhase =
  | 'idle'
  | 'cache'
  | 'regions'
  | 'constellations'
  | 'systems'
  | 'connections'
  | 'ready'
  | 'error';

type UniverseState = {
  regions: ReadonlyMap<number, Region>;
  constellations: ReadonlyMap<number, Constellation>;
  systems: ReadonlyMap<number, NormalizedSystem>;
  connections: readonly StargateConnection[];
  adjacencyList: ReadonlyMap<number, readonly number[]>;
  systemsByRegion: ReadonlyMap<number, readonly number[]>;
  systemsByConstellation: ReadonlyMap<number, readonly number[]>;

  loadingPhase: LoadingPhase;
  loadingProgress: number;
  errorMessage: string | null;

  loadUniverse: () => Promise<void>;
  getSystem: (id: number) => NormalizedSystem | undefined;
  getRegion: (id: number) => Region | undefined;
  getConstellation: (id: number) => Constellation | undefined;
  getConnectedSystems: (systemId: number) => readonly number[];
};

const CACHE_KEY = 'universe_data';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

type CachedUniverseData = {
  regions: [number, Region][];
  constellations: [number, Constellation][];
  systems: [number, NormalizedSystem][];
  connections: StargateConnection[];
};

const buildDerivedData = (
  systems: ReadonlyMap<number, NormalizedSystem>,
  connections: readonly StargateConnection[],
) => {
  const adjacencyList = new Map<number, number[]>();
  const systemsByRegion = new Map<number, number[]>();
  const systemsByConstellation = new Map<number, number[]>();

  for (const [id, system] of systems) {
    const regionList = systemsByRegion.get(system.regionId) ?? [];
    regionList.push(id);
    systemsByRegion.set(system.regionId, regionList);

    const constList = systemsByConstellation.get(system.constellationId) ?? [];
    constList.push(id);
    systemsByConstellation.set(system.constellationId, constList);
  }

  for (const conn of connections) {
    const fromList = adjacencyList.get(conn.fromSystemId) ?? [];
    fromList.push(conn.toSystemId);
    adjacencyList.set(conn.fromSystemId, fromList);

    const toList = adjacencyList.get(conn.toSystemId) ?? [];
    toList.push(conn.fromSystemId);
    adjacencyList.set(conn.toSystemId, toList);
  }

  return { adjacencyList, systemsByRegion, systemsByConstellation };
};

export const useUniverseStore = create<UniverseState>((set, get) => ({
  regions: new Map(),
  constellations: new Map(),
  systems: new Map(),
  connections: [],
  adjacencyList: new Map(),
  systemsByRegion: new Map(),
  systemsByConstellation: new Map(),

  loadingPhase: 'idle',
  loadingProgress: 0,
  errorMessage: null,

  loadUniverse: async () => {
    const { loadingPhase } = get();
    if (loadingPhase !== 'idle' && loadingPhase !== 'error') return;

    set({ loadingPhase: 'cache', loadingProgress: 0, errorMessage: null });

    // Try cache first
    const cached = await readCache<CachedUniverseData>(CACHE_KEY, CACHE_MAX_AGE);
    if (cached.isOk() && cached.value !== null) {
      const data = cached.value;
      const systems = new Map(data.systems) as ReadonlyMap<number, NormalizedSystem>;
      const derived = buildDerivedData(systems, data.connections);
      set({
        regions: new Map(data.regions),
        constellations: new Map(data.constellations),
        systems,
        connections: data.connections,
        ...derived,
        loadingPhase: 'ready',
        loadingProgress: 100,
      });
      return;
    }

    // Fetch regions
    set({ loadingPhase: 'regions', loadingProgress: 5 });
    const regionIdsResult = await fetchRegionIds();
    if (regionIdsResult.isErr()) {
      set({ loadingPhase: 'error', errorMessage: regionIdsResult.error.message });
      return;
    }

    const regionsResult = await fetchRegions(regionIdsResult.value);
    if (regionsResult.isErr()) {
      set({ loadingPhase: 'error', errorMessage: regionsResult.error.message });
      return;
    }

    const regionsMap = new Map<number, Region>();
    for (const r of regionsResult.value) {
      regionsMap.set(r.id, r);
    }
    set({ regions: regionsMap, loadingProgress: 15 });

    // Fetch constellations
    set({ loadingPhase: 'constellations' });
    const allConstellationIds = regionsResult.value.flatMap((r) => r.constellationIds);
    const constellationsResult = await fetchConstellations(allConstellationIds);
    if (constellationsResult.isErr()) {
      set({ loadingPhase: 'error', errorMessage: constellationsResult.error.message });
      return;
    }

    const constellationsMap = new Map<number, Constellation>();
    for (const c of constellationsResult.value) {
      constellationsMap.set(c.id, c);
    }
    set({ constellations: constellationsMap, loadingProgress: 35 });

    // Fetch systems
    set({ loadingPhase: 'systems' });
    const systemEntries: { systemId: number; regionId: number }[] = [];
    for (const c of constellationsResult.value) {
      for (const sId of c.systemIds) {
        systemEntries.push({ systemId: sId, regionId: c.regionId });
      }
    }

    const systemsResult = await fetchSystems(systemEntries);
    if (systemsResult.isErr()) {
      set({ loadingPhase: 'error', errorMessage: systemsResult.error.message });
      return;
    }

    const systemsMap = new Map<number, NormalizedSystem>();
    for (const s of systemsResult.value) {
      const { nx, nz } = normalizePosition(s.position.x, s.position.z);
      systemsMap.set(s.id, { ...s, nx, nz });
    }
    set({ systems: systemsMap, loadingProgress: 75 });

    // Build connections from stargates
    set({ loadingPhase: 'connections' });
    const allStargateIds: number[] = [];
    for (const s of systemsResult.value) {
      allStargateIds.push(...s.stargateIds);
    }

    const stargatesResult = await fetchStargates(allStargateIds);
    const connections: StargateConnection[] = [];
    const connectionSet = new Set<string>();

    if (stargatesResult.isOk()) {
      for (const sg of stargatesResult.value) {
        const key =
          sg.systemId < sg.destinationSystemId
            ? `${sg.systemId}-${sg.destinationSystemId}`
            : `${sg.destinationSystemId}-${sg.systemId}`;
        if (!connectionSet.has(key)) {
          connectionSet.add(key);
          connections.push({
            fromSystemId: Math.min(sg.systemId, sg.destinationSystemId),
            toSystemId: Math.max(sg.systemId, sg.destinationSystemId),
          });
        }
      }
    }

    const derived = buildDerivedData(systemsMap, connections);

    set({
      connections,
      ...derived,
      loadingPhase: 'ready',
      loadingProgress: 100,
    });

    // Cache in background
    const cacheData: CachedUniverseData = {
      regions: [...regionsMap.entries()],
      constellations: [...constellationsMap.entries()],
      systems: [...systemsMap.entries()],
      connections,
    };
    await writeCache(CACHE_KEY, cacheData);
  },

  getSystem: (id) => get().systems.get(id),
  getRegion: (id) => get().regions.get(id),
  getConstellation: (id) => get().constellations.get(id),
  getConnectedSystems: (systemId) => get().adjacencyList.get(systemId) ?? [],
}));
