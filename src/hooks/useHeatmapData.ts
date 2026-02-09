import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/mapStore';
import { fetchSystemKills, fetchSystemJumps } from '../api/esi';
import type { SystemKills, SystemJumps } from '../types/universe';

const REFRESH_INTERVAL = 5 * 60 * 1000;

export const useHeatmapData = () => {
  const heatmapActive = useMapStore((s) => s.heatmapActive);
  const setKillsMap = useMapStore((s) => s.setKillsMap);
  const setJumpsMap = useMapStore((s) => s.setJumpsMap);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!heatmapActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const loadData = async () => {
      const [killsResult, jumpsResult] = await Promise.all([
        fetchSystemKills(),
        fetchSystemJumps(),
      ]);
      killsResult.match(
        (data) => {
          const map = new Map<number, SystemKills>();
          for (const k of data) map.set(k.systemId, k);
          setKillsMap(map);
        },
        () => undefined,
      );
      jumpsResult.match(
        (data) => {
          const map = new Map<number, SystemJumps>();
          for (const j of data) map.set(j.systemId, j);
          setJumpsMap(map);
        },
        () => undefined,
      );
    };

    loadData();
    intervalRef.current = setInterval(loadData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [heatmapActive, setKillsMap, setJumpsMap]);
};
