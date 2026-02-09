import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/mapStore';
import { fetchSovereigntyMap, fetchNames } from '../api/esi';
import type { SovData } from '../types/universe';

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

export const useSovData = () => {
  const sovMode = useMapStore((s) => s.sovMode);
  const setSovMap = useMapStore((s) => s.setSovMap);
  const setAllianceNames = useMapStore((s) => s.setAllianceNames);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!sovMode) return;
    if (loadedRef.current) return;

    const load = async () => {
      const result = await fetchSovereigntyMap();
      result.match(
        async (data) => {
          const map = new Map<number, SovData>();
          const allianceIds = new Set<number>();
          const factionIds = new Set<number>();

          for (const sov of data) {
            map.set(sov.systemId, sov);
            if (sov.allianceId) allianceIds.add(sov.allianceId);
            if (sov.factionId) factionIds.add(sov.factionId);
          }
          setSovMap(map);

          // Resolve alliance + faction names
          const idsToResolve = [...allianceIds, ...factionIds];
          if (idsToResolve.length > 0) {
            // Batch into chunks of 1000 (ESI limit)
            const allNames = new Map<number, string>();
            for (let i = 0; i < idsToResolve.length; i += 500) {
              const chunk = idsToResolve.slice(i, i + 500);
              const namesResult = await fetchNames(chunk);
              namesResult.match(
                (names) => {
                  for (const [id, name] of names) allNames.set(id, name);
                },
                () => undefined,
              );
            }
            setAllianceNames(allNames);
          }

          loadedRef.current = true;
        },
        () => undefined,
      );
    };

    load();

    const interval = setInterval(() => {
      loadedRef.current = false;
      load();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [sovMode, setSovMap, setAllianceNames]);
};
