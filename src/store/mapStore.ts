import { create } from 'zustand';
import type {
  DetailLevel,
  RoutePreference,
  SystemKills,
  SystemJumps,
  HeatmapMode,
  SovData,
} from '../types/universe';

type MapState = {
  centerX: number;
  centerY: number;
  zoom: number;
  detailLevel: DetailLevel;

  selectedSystemId: number | null;
  showSystemSheet: boolean;

  routeSystemIds: readonly number[] | null;
  routeOriginId: number | null;
  routeDestinationId: number | null;
  routePreference: RoutePreference;
  isCalculatingRoute: boolean;
  routeError: string | null;

  heatmapMode: HeatmapMode;
  killsMap: ReadonlyMap<number, SystemKills>;
  jumpsMap: ReadonlyMap<number, SystemJumps>;
  avgJumps: number;

  sovMode: boolean;
  sovMap: ReadonlyMap<number, SovData>;
  allianceNames: ReadonlyMap<number, string>;

  avoidedSystemIds: readonly number[];

  nearbySystemIds: readonly number[] | null;

  compareMode: boolean;
  alternateRoutes: readonly {
    systemIds: readonly number[];
    preference: RoutePreference;
  }[];

  selectSystem: (id: number | null) => void;
  setShowSystemSheet: (show: boolean) => void;
  setDetailLevel: (level: DetailLevel) => void;
  setRoute: (systemIds: readonly number[]) => void;
  clearRoute: () => void;
  setRouteOrigin: (id: number | null) => void;
  setRouteDestination: (id: number | null) => void;
  setRoutePreference: (pref: RoutePreference) => void;
  setIsCalculatingRoute: (calculating: boolean) => void;
  setRouteError: (error: string | null) => void;
  swapOriginDestination: () => void;
  cycleHeatmapMode: () => void;
  setKillsMap: (kills: ReadonlyMap<number, SystemKills>) => void;
  setJumpsMap: (jumps: ReadonlyMap<number, SystemJumps>) => void;
  setAvgJumps: (avg: number) => void;
  toggleSov: () => void;
  setSovMap: (sov: ReadonlyMap<number, SovData>) => void;
  setAllianceNames: (names: ReadonlyMap<number, string>) => void;
  toggleAvoidSystem: (systemId: number) => void;
  clearAvoidedSystems: () => void;
  setNearbySystemIds: (ids: readonly number[] | null) => void;
  setCompareMode: (on: boolean) => void;
  setAlternateRoutes: (
    routes: readonly { systemIds: readonly number[]; preference: RoutePreference }[],
  ) => void;
};

export const useMapStore = create<MapState>((set, get) => ({
  centerX: 0,
  centerY: 0,
  zoom: 3,
  detailLevel: 'region',

  selectedSystemId: null,
  showSystemSheet: false,

  routeSystemIds: null,
  routeOriginId: null,
  routeDestinationId: null,
  routePreference: 'shortest',
  isCalculatingRoute: false,
  routeError: null,

  heatmapMode: 'off',
  killsMap: new Map(),
  jumpsMap: new Map(),
  avgJumps: 0,

  sovMode: false,
  sovMap: new Map(),
  allianceNames: new Map(),

  avoidedSystemIds: [],

  nearbySystemIds: null,

  compareMode: false,
  alternateRoutes: [],

  selectSystem: (id) => set({ selectedSystemId: id, showSystemSheet: id !== null }),
  setShowSystemSheet: (show) => set({ showSystemSheet: show }),
  setDetailLevel: (level) => set({ detailLevel: level }),
  setRoute: (systemIds) =>
    set({ routeSystemIds: systemIds, isCalculatingRoute: false, routeError: null }),
  clearRoute: () =>
    set({
      routeSystemIds: null,
      routeOriginId: null,
      routeDestinationId: null,
      isCalculatingRoute: false,
      routeError: null,
      compareMode: false,
      alternateRoutes: [],
    }),
  setRouteOrigin: (id) => set({ routeOriginId: id }),
  setRouteDestination: (id) => set({ routeDestinationId: id }),
  setRoutePreference: (pref) => set({ routePreference: pref }),
  setIsCalculatingRoute: (calculating) => set({ isCalculatingRoute: calculating }),
  setRouteError: (error) => set({ routeError: error, isCalculatingRoute: false }),
  swapOriginDestination: () => {
    const { routeOriginId, routeDestinationId } = get();
    set({ routeOriginId: routeDestinationId, routeDestinationId: routeOriginId });
  },
  cycleHeatmapMode: () =>
    set((s) => {
      const modes: HeatmapMode[] = ['off', 'kills', 'jumps'];
      const idx = modes.indexOf(s.heatmapMode);
      const next = modes[(idx + 1) % modes.length];
      return { heatmapMode: next, sovMode: next !== 'off' ? false : s.sovMode };
    }),
  setKillsMap: (kills) => set({ killsMap: kills }),
  setJumpsMap: (jumps) => set({ jumpsMap: jumps }),
  setAvgJumps: (avg) => set({ avgJumps: avg }),
  toggleSov: () =>
    set((s) => ({
      sovMode: !s.sovMode,
      heatmapMode: !s.sovMode ? 'off' : s.heatmapMode,
    })),
  setSovMap: (sov) => set({ sovMap: sov }),
  setAllianceNames: (names) => set({ allianceNames: names }),
  toggleAvoidSystem: (systemId) =>
    set((s) => ({
      avoidedSystemIds: s.avoidedSystemIds.includes(systemId)
        ? s.avoidedSystemIds.filter((id) => id !== systemId)
        : [...s.avoidedSystemIds, systemId],
    })),
  clearAvoidedSystems: () => set({ avoidedSystemIds: [] }),
  setNearbySystemIds: (ids) => set({ nearbySystemIds: ids }),
  setCompareMode: (on) => set({ compareMode: on }),
  setAlternateRoutes: (routes) => set({ alternateRoutes: routes }),
}));
