import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUniverseData } from '../src/hooks/useUniverseData';
import { useAutoRoute } from '../src/hooks/useAutoRoute';
import { useHeatmapData } from '../src/hooks/useHeatmapData';
import { useSovData } from '../src/hooks/useSovData';
import { useUniverseStore } from '../src/store/universeStore';
import { useMapStore } from '../src/store/mapStore';
import { MapCanvas, type MapCanvasRef } from '../src/components/map/MapCanvas';
import { MapControls } from '../src/components/map/MapControls';
import { SystemSheet } from '../src/components/ui/SystemSheet';
import { LoadingScreen } from '../src/components/ui/LoadingScreen';
import { RouteBar } from '../src/components/ui/RouteBar';
import { GestureHint } from '../src/components/ui/GestureHint';
import { theme } from '../src/constants/colors';

export default function MapScreen() {
  const router = useRouter();
  const { loadingPhase, loadingProgress, errorMessage, retry } = useUniverseData();
  const systems = useUniverseStore((s) => s.systems);
  const detailLevel = useMapStore((s) => s.detailLevel);
  const routeOriginId = useMapStore((s) => s.routeOriginId);
  const routeDestinationId = useMapStore((s) => s.routeDestinationId);
  const heatmapMode = useMapStore((s) => s.heatmapMode);
  const cycleHeatmapMode = useMapStore((s) => s.cycleHeatmapMode);
  const sovMode = useMapStore((s) => s.sovMode);
  const toggleSov = useMapStore((s) => s.toggleSov);
  const selectedSystemId = useMapStore((s) => s.selectedSystemId);
  const mapRef = useRef<MapCanvasRef>(null);
  const [showHints, setShowHints] = useState(true);
  const [routeBarHeight, setRouteBarHeight] = useState(0);

  useAutoRoute();
  useHeatmapData();
  useSovData();

  const handleSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    mapRef.current?.resetView();
  }, []);

  const handleToggleHeatmap = useCallback(() => {
    cycleHeatmapMode();
  }, [cycleHeatmapMode]);

  const handleToggleSov = useCallback(() => {
    toggleSov();
  }, [toggleSov]);

  const handleNearbySearch = useCallback(() => {
    if (selectedSystemId) {
      router.push(`/nearby?origin=${selectedSystemId}`);
    }
  }, [router, selectedSystemId]);

  const handleLandmarkSearch = useCallback(() => {
    const origin = selectedSystemId ?? '';
    router.push(`/landmark?origin=${origin}`);
  }, [router, selectedSystemId]);

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

  const showRouteBar = !!(routeOriginId || routeDestinationId);

  return (
    <View style={styles.container}>
      <MapCanvas ref={mapRef} />
      <MapControls
        detailLevel={detailLevel}
        systemCount={systems.size}
        heatmapMode={heatmapMode}
        sovActive={sovMode}
        bottomOffset={showRouteBar ? routeBarHeight : 0}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onSearch={handleSearch}
        onToggleHeatmap={handleToggleHeatmap}
        onToggleSov={handleToggleSov}
        onNearbySearch={selectedSystemId ? handleNearbySearch : undefined}
        onLandmarkSearch={handleLandmarkSearch}
      />
      {showRouteBar && <RouteBar onLayout={setRouteBarHeight} />}
      <SystemSheet />
      {showHints && <GestureHint onDismiss={() => setShowHints(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
});
