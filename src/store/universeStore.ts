import { create } from 'zustand';
import type {
  Region,
  Constellation,
  NormalizedSystem,
  StargateConnection,
} from '../types/universe';
import universeData from '../../assets/universe-data.json';

type LoadingPhase = 'idle' | 'loading' | 'ready' | 'error';

type CachedUniverseData = {
  regions: [number, Region][];
  constellations: [number, Constellation][];
  systems: [number, NormalizedSystem][];
  connections: StargateConnection[];
};

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

    set({ loadingPhase: 'loading', loadingProgress: 50, errorMessage: null });

    const data = universeData as unknown as CachedUniverseData;
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
  },

  getSystem: (id) => get().systems.get(id),
  getRegion: (id) => get().regions.get(id),
  getConstellation: (id) => get().constellations.get(id),
  getConnectedSystems: (systemId) => get().adjacencyList.get(systemId) ?? [],
}));
