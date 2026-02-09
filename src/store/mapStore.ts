import { create } from 'zustand';
import type { DetailLevel, RoutePreference, SystemKills, SystemJumps } from '../types/universe';

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

  heatmapActive: boolean;
  killsMap: ReadonlyMap<number, SystemKills>;
  jumpsMap: ReadonlyMap<number, SystemJumps>;

  avoidedSystemIds: readonly number[];

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
  toggleHeatmap: () => void;
  setKillsMap: (kills: ReadonlyMap<number, SystemKills>) => void;
  setJumpsMap: (jumps: ReadonlyMap<number, SystemJumps>) => void;
  toggleAvoidSystem: (systemId: number) => void;
  clearAvoidedSystems: () => void;
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

  heatmapActive: false,
  killsMap: new Map(),
  jumpsMap: new Map(),

  avoidedSystemIds: [],

  selectSystem: (id) => set({ selectedSystemId: id, showSystemSheet: id !== null }),
  setShowSystemSheet: (show) => set({ showSystemSheet: show }),
  setDetailLevel: (level) => set({ detailLevel: level }),
  setRoute: (systemIds) => set({ routeSystemIds: systemIds, isCalculatingRoute: false, routeError: null }),
  clearRoute: () =>
    set({
      routeSystemIds: null,
      routeOriginId: null,
      routeDestinationId: null,
      isCalculatingRoute: false,
      routeError: null,
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
  toggleHeatmap: () => set((s) => ({ heatmapActive: !s.heatmapActive })),
  setKillsMap: (kills) => set({ killsMap: kills }),
  setJumpsMap: (jumps) => set({ jumpsMap: jumps }),
  toggleAvoidSystem: (systemId) =>
    set((s) => ({
      avoidedSystemIds: s.avoidedSystemIds.includes(systemId)
        ? s.avoidedSystemIds.filter((id) => id !== systemId)
        : [...s.avoidedSystemIds, systemId],
    })),
  clearAvoidedSystems: () => set({ avoidedSystemIds: [] }),
}));
