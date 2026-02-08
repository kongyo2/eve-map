import { useCallback, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  Group,
  matchFont,
  Text as SkiaText,
  PaintStyle,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue, withDecay, runOnJS } from 'react-native-reanimated';
import { useUniverseStore } from '../../store/universeStore';
import { useMapStore } from '../../store/mapStore';
import { securityColor, theme } from '../../constants/colors';
import { MAP } from '../../constants/map';
import { screenToWorld, distanceSquared } from '../../utils/coordinates';

const labelFont = matchFont({
  fontFamily: 'System',
  fontSize: 10,
  fontWeight: '300',
});

export const MapCanvas = () => {
  const { width, height } = useWindowDimensions();
  const systems = useUniverseStore((s) => s.systems);
  const connections = useUniverseStore((s) => s.connections);
  const constellations = useUniverseStore((s) => s.constellations);
  const regions = useUniverseStore((s) => s.regions);
  const routeSystemIds = useMapStore((s) => s.routeSystemIds);
  const selectedSystemId = useMapStore((s) => s.selectedSystemId);
  const selectSystem = useMapStore((s) => s.selectSystem);

  // Shared values for pan/zoom
  const panX = useSharedValue(width / 2);
  const panY = useSharedValue(height / 2);
  const scaleVal = useSharedValue<number>(MAP.INITIAL_ZOOM);
  const prevTransX = useSharedValue(0);
  const prevTransY = useSharedValue(0);
  const prevScale = useSharedValue<number>(MAP.INITIAL_ZOOM);

  // Derived transform for Skia Group
  const transform = useDerivedValue(() => [
    { translateX: panX.value },
    { translateY: panY.value },
    { scale: scaleVal.value },
  ]);

  // Flatten systems for rendering
  const systemArray = useMemo(() => [...systems.values()], [systems]);

  // Build connection path (batch all connections into one path)
  const connectionPath = useMemo(() => {
    const path = Skia.Path.Make();
    for (const conn of connections) {
      const from = systems.get(conn.fromSystemId);
      const to = systems.get(conn.toSystemId);
      if (from && to) {
        path.moveTo(from.nx, from.nz);
        path.lineTo(to.nx, to.nz);
      }
    }
    return path;
  }, [connections, systems]);

  // Build route path
  const routePath = useMemo(() => {
    if (!routeSystemIds || routeSystemIds.length < 2) return null;
    const path = Skia.Path.Make();
    let first = true;
    for (const sysId of routeSystemIds) {
      const sys = systems.get(sysId);
      if (!sys) continue;
      if (first) {
        path.moveTo(sys.nx, sys.nz);
        first = false;
      } else {
        path.lineTo(sys.nx, sys.nz);
      }
    }
    return path;
  }, [routeSystemIds, systems]);

  // Route system set for highlight
  const routeSystemSet = useMemo(() => {
    if (!routeSystemIds) return new Set<number>();
    return new Set(routeSystemIds);
  }, [routeSystemIds]);

  // Region centers for labels
  const regionCenters = useMemo(() => {
    const centers: { id: number; name: string; x: number; z: number }[] = [];
    for (const [regionId, region] of regions) {
      let totalX = 0;
      let totalZ = 0;
      let count = 0;
      for (const constId of region.constellationIds) {
        const constellation = constellations.get(constId);
        if (!constellation) continue;
        for (const sysId of constellation.systemIds) {
          const sys = systems.get(sysId);
          if (sys) {
            totalX += sys.nx;
            totalZ += sys.nz;
            count++;
          }
        }
      }
      if (count > 0) {
        centers.push({
          id: regionId,
          name: region.name,
          x: totalX / count,
          z: totalZ / count,
        });
      }
    }
    return centers;
  }, [regions, constellations, systems]);

  // Tap handler
  const handleSystemTap = useCallback(
    (tapX: number, tapY: number) => {
      const world = screenToWorld(tapX, tapY, panX.value, panY.value, scaleVal.value);
      const tapRadiusWorld = MAP.TAP_RADIUS / scaleVal.value;
      const maxDistSq = tapRadiusWorld * tapRadiusWorld;

      let nearestId: number | null = null;
      let nearestDist = Infinity;

      for (const sys of systemArray) {
        const dist = distanceSquared(world.x, world.y, sys.nx, sys.nz);
        if (dist < maxDistSq && dist < nearestDist) {
          nearestDist = dist;
          nearestId = sys.id;
        }
      }

      selectSystem(nearestId);
    },
    [systemArray, panX, panY, scaleVal, selectSystem],
  );

  // Gestures
  const panGesture = Gesture.Pan()
    .onStart(() => {
      prevTransX.value = 0;
      prevTransY.value = 0;
    })
    .onUpdate((e) => {
      const dx = e.translationX - prevTransX.value;
      const dy = e.translationY - prevTransY.value;
      panX.value += dx;
      panY.value += dy;
      prevTransX.value = e.translationX;
      prevTransY.value = e.translationY;
    })
    .onEnd((e) => {
      panX.value = withDecay({ velocity: e.velocityX, deceleration: 0.997 });
      panY.value = withDecay({ velocity: e.velocityY, deceleration: 0.997 });
    })
    .minPointers(1)
    .maxPointers(2);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      prevScale.value = scaleVal.value;
    })
    .onUpdate((e) => {
      const newScale = Math.max(MAP.MIN_ZOOM, Math.min(MAP.MAX_ZOOM, prevScale.value * e.scale));
      const focalX = e.focalX;
      const focalY = e.focalY;
      const worldX = (focalX - panX.value) / scaleVal.value;
      const worldY = (focalY - panY.value) / scaleVal.value;
      scaleVal.value = newScale;
      panX.value = focalX - worldX * newScale;
      panY.value = focalY - worldY * newScale;
    });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    runOnJS(handleSystemTap)(e.x, e.y);
  });

  const composedGesture = Gesture.Race(tapGesture, Gesture.Simultaneous(panGesture, pinchGesture));

  // Paints
  const connectionPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.connection));
    paint.setStrokeWidth(0.02);
    paint.setStyle(PaintStyle.Stroke);
    paint.setAntiAlias(true);
    return paint;
  }, []);

  const routePaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.route));
    paint.setStrokeWidth(0.06);
    paint.setStyle(PaintStyle.Stroke);
    paint.setAntiAlias(true);
    return paint;
  }, []);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Canvas style={[styles.canvas, { width, height }]}>
          <Group transform={transform}>
            {/* Stargate connections */}
            <Path path={connectionPath} paint={connectionPaint} />

            {/* Route overlay */}
            {routePath && <Path path={routePath} paint={routePaint} />}

            {/* System nodes */}
            {systemArray.map((sys) => {
              const isSelected = sys.id === selectedSystemId;
              const isOnRoute = routeSystemSet.has(sys.id);
              const isHub = (MAP.TRADE_HUBS as readonly number[]).includes(sys.id);
              const radius = isHub ? 0.15 : isSelected ? 0.12 : isOnRoute ? 0.1 : 0.06;
              const color = isSelected
                ? theme.selectedHighlight
                : isOnRoute
                  ? theme.route
                  : securityColor(sys.securityStatus);

              return <Circle key={sys.id} cx={sys.nx} cy={sys.nz} r={radius} color={color} />;
            })}

            {/* Region labels */}
            {regionCenters.map((rc) => (
              <SkiaText
                key={`r-${rc.id}`}
                x={rc.x + 0.3}
                y={rc.z}
                text={rc.name}
                font={labelFont}
                color={theme.textSecondary}
              />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  canvas: {
    flex: 1,
  },
});
