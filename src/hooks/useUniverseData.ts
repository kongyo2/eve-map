import { useEffect } from 'react';
import { useUniverseStore } from '../store/universeStore';

export const useUniverseData = () => {
  const loadUniverse = useUniverseStore((s) => s.loadUniverse);
  const loadingPhase = useUniverseStore((s) => s.loadingPhase);
  const loadingProgress = useUniverseStore((s) => s.loadingProgress);
  const errorMessage = useUniverseStore((s) => s.errorMessage);

  useEffect(() => {
    if (loadingPhase === 'idle') {
      loadUniverse();
    }
  }, [loadingPhase, loadUniverse]);

  return { loadingPhase, loadingProgress, errorMessage, retry: loadUniverse };
};
