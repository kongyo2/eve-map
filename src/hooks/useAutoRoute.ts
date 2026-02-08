import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/mapStore';
import { calculateRoute } from '../api/esi';
import { STRINGS } from '../constants/strings';

export const useAutoRoute = () => {
  const originId = useMapStore((s) => s.routeOriginId);
  const destinationId = useMapStore((s) => s.routeDestinationId);
  const preference = useMapStore((s) => s.routePreference);
  const setRoute = useMapStore((s) => s.setRoute);
  const setIsCalculatingRoute = useMapStore((s) => s.setIsCalculatingRoute);
  const setRouteError = useMapStore((s) => s.setRouteError);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!originId || !destinationId) return;
    abortRef.current = false;
    setIsCalculatingRoute(true);
    setRouteError(null);

    calculateRoute(originId, destinationId, preference).then((result) => {
      if (abortRef.current) return;
      result.match(
        (route) => setRoute(route),
        () => setRouteError(STRINGS.routeError),
      );
    });

    return () => {
      abortRef.current = true;
    };
  }, [originId, destinationId, preference, setRoute, setIsCalculatingRoute, setRouteError]);
};
