import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUniverseData } from '../src/hooks/useUniverseData';
import { useUniverseStore } from '../src/store/universeStore';
import { useMapStore } from '../src/store/mapStore';
import { MapCanvas } from '../src/components/map/MapCanvas';
import { MapControls } from '../src/components/map/MapControls';
import { SystemSheet } from '../src/components/ui/SystemSheet';
import { LoadingScreen } from '../src/components/ui/LoadingScreen';
import { RouteBar } from '../src/components/ui/RouteBar';
import { theme } from '../src/constants/colors';

export default function MapScreen() {
  const router = useRouter();
  const { loadingPhase, loadingProgress, errorMessage, retry } = useUniverseData();
  const systems = useUniverseStore((s) => s.systems);
  const detailLevel = useMapStore((s) => s.detailLevel);
  const routeSystemIds = useMapStore((s) => s.routeSystemIds);

  const handleSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const handleZoomIn = useCallback(() => {
    // Zoom is handled by Skia canvas gestures; this is a UI convenience
  }, []);

  const handleZoomOut = useCallback(() => {
    // Zoom is handled by Skia canvas gestures; this is a UI convenience
  }, []);

  if (loadingPhase !== 'ready') {
    return (
      <LoadingScreen
        phase={loadingPhase}
        progress={loadingProgress}
        errorMessage={errorMessage}
        onRetry={retry}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapCanvas />
      <MapControls
        detailLevel={detailLevel}
        systemCount={systems.size}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSearch={handleSearch}
      />
      {routeSystemIds && routeSystemIds.length > 0 && <RouteBar />}
      <SystemSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
});
