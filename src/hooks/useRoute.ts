import { useCallback } from 'react';
import { useMapStore } from '../store/mapStore';
import { calculateRoute } from '../api/esi';
import { STRINGS } from '../constants/strings';

export const useRoute = () => {
  const routeOriginId = useMapStore((s) => s.routeOriginId);
  const routeDestinationId = useMapStore((s) => s.routeDestinationId);
  const routePreference = useMapStore((s) => s.routePreference);
  const routeSystemIds = useMapStore((s) => s.routeSystemIds);
  const isCalculatingRoute = useMapStore((s) => s.isCalculatingRoute);
  const routeError = useMapStore((s) => s.routeError);
  const setRoute = useMapStore((s) => s.setRoute);
  const clearRoute = useMapStore((s) => s.clearRoute);
  const setIsCalculatingRoute = useMapStore((s) => s.setIsCalculatingRoute);
  const setRouteError = useMapStore((s) => s.setRouteError);
  const setRoutePreference = useMapStore((s) => s.setRoutePreference);
  const swapOriginDestination = useMapStore((s) => s.swapOriginDestination);

  const calculate = useCallback(async () => {
    if (!routeOriginId || !routeDestinationId) return;
    setIsCalculatingRoute(true);
    setRouteError(null);
    const result = await calculateRoute(routeOriginId, routeDestinationId, routePreference);
    result.match(
      (route) => setRoute(route),
      () => setRouteError(STRINGS.routeError),
    );
  }, [routeOriginId, routeDestinationId, routePreference, setRoute, setIsCalculatingRoute, setRouteError]);

  return {
    originId: routeOriginId,
    destinationId: routeDestinationId,
    preference: routePreference,
    route: routeSystemIds,
    isCalculating: isCalculatingRoute,
    error: routeError,
    calculate,
    clear: clearRoute,
    setPreference: setRoutePreference,
    swap: swapOriginDestination,
  };
};
