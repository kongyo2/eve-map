import { create } from 'zustand';
import type { DetailLevel, RoutePreference } from '../types/universe';

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

  selectSystem: (id: number | null) => void;
  setShowSystemSheet: (show: boolean) => void;
  setDetailLevel: (level: DetailLevel) => void;
  setRoute: (systemIds: readonly number[]) => void;
  clearRoute: () => void;
  setRouteOrigin: (id: number | null) => void;
  setRouteDestination: (id: number | null) => void;
  setRoutePreference: (pref: RoutePreference) => void;
  setIsCalculatingRoute: (calculating: boolean) => void;
  swapOriginDestination: () => void;
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

  selectSystem: (id) => set({ selectedSystemId: id, showSystemSheet: id !== null }),
  setShowSystemSheet: (show) => set({ showSystemSheet: show }),
  setDetailLevel: (level) => set({ detailLevel: level }),
  setRoute: (systemIds) => set({ routeSystemIds: systemIds, isCalculatingRoute: false }),
  clearRoute: () =>
    set({
      routeSystemIds: null,
      routeOriginId: null,
      routeDestinationId: null,
      isCalculatingRoute: false,
    }),
  setRouteOrigin: (id) => set({ routeOriginId: id }),
  setRouteDestination: (id) => set({ routeDestinationId: id }),
  setRoutePreference: (pref) => set({ routePreference: pref }),
  setIsCalculatingRoute: (calculating) => set({ isCalculatingRoute: calculating }),
  swapOriginDestination: () => {
    const { routeOriginId, routeDestinationId } = get();
    set({ routeOriginId: routeDestinationId, routeDestinationId: routeOriginId });
  },
}));
