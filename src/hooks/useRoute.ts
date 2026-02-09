import { useCallback } from 'react';
import { useMapStore } from '../store/mapStore';
import { calculateRoute } from '../api/esi';
import { STRINGS } from '../constants/strings';
import type { RoutePreference } from '../types/universe';

export const useRoute = () => {
  const routeOriginId = useMapStore((s) => s.routeOriginId);
  const routeDestinationId = useMapStore((s) => s.routeDestinationId);
  const routePreference = useMapStore((s) => s.routePreference);
  const avoidedSystemIds = useMapStore((s) => s.avoidedSystemIds);
  const routeSystemIds = useMapStore((s) => s.routeSystemIds);
  const isCalculatingRoute = useMapStore((s) => s.isCalculatingRoute);
  const routeError = useMapStore((s) => s.routeError);
  const setRoute = useMapStore((s) => s.setRoute);
  const clearRoute = useMapStore((s) => s.clearRoute);
  const setIsCalculatingRoute = useMapStore((s) => s.setIsCalculatingRoute);
  const setRouteError = useMapStore((s) => s.setRouteError);
  const setRoutePreference = useMapStore((s) => s.setRoutePreference);
  const swapOriginDestination = useMapStore((s) => s.swapOriginDestination);
  const compareMode = useMapStore((s) => s.compareMode);
  const setCompareMode = useMapStore((s) => s.setCompareMode);
  const alternateRoutes = useMapStore((s) => s.alternateRoutes);
  const setAlternateRoutes = useMapStore((s) => s.setAlternateRoutes);

  const calculate = useCallback(async () => {
    if (!routeOriginId || !routeDestinationId) return;
    setIsCalculatingRoute(true);
    setRouteError(null);
    const avoid = avoidedSystemIds.length > 0 ? avoidedSystemIds : undefined;
    const result = await calculateRoute(routeOriginId, routeDestinationId, routePreference, avoid);
    result.match(
      (route) => setRoute(route),
      () => setRouteError(STRINGS.routeError),
    );
  }, [
    routeOriginId,
    routeDestinationId,
    routePreference,
    avoidedSystemIds,
    setRoute,
    setIsCalculatingRoute,
    setRouteError,
  ]);

  const calculateAllRoutes = useCallback(async () => {
    if (!routeOriginId || !routeDestinationId) return;
    setIsCalculatingRoute(true);
    setRouteError(null);
    const avoid = avoidedSystemIds.length > 0 ? avoidedSystemIds : undefined;
    const prefs: RoutePreference[] = ['shortest', 'secure', 'insecure'];

    const results = await Promise.all(
      prefs.map((pref) => calculateRoute(routeOriginId, routeDestinationId, pref, avoid)),
    );

    const altRoutes: { systemIds: readonly number[]; preference: RoutePreference }[] = [];
    let primarySet = false;

    for (let i = 0; i < results.length; i++) {
      results[i].match(
        (route) => {
          if (prefs[i] === routePreference && !primarySet) {
            setRoute(route);
            primarySet = true;
          } else {
            altRoutes.push({ systemIds: route, preference: prefs[i] });
          }
        },
        () => undefined,
      );
    }

    if (!primarySet) {
      setRouteError(STRINGS.routeError);
    }

    setAlternateRoutes(altRoutes);
    setCompareMode(true);
  }, [
    routeOriginId,
    routeDestinationId,
    routePreference,
    avoidedSystemIds,
    setRoute,
    setIsCalculatingRoute,
    setRouteError,
    setAlternateRoutes,
    setCompareMode,
  ]);

  const disableCompare = useCallback(() => {
    setCompareMode(false);
    setAlternateRoutes([]);
  }, [setCompareMode, setAlternateRoutes]);

  return {
    originId: routeOriginId,
    destinationId: routeDestinationId,
    preference: routePreference,
    route: routeSystemIds,
    isCalculating: isCalculatingRoute,
    error: routeError,
    avoidedCount: avoidedSystemIds.length,
    compareMode,
    alternateRoutes,
    calculate,
    calculateAllRoutes,
    disableCompare,
    clear: clearRoute,
    setPreference: setRoutePreference,
    swap: swapOriginDestination,
  };
};
