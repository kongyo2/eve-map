import { useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
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
import {
  useSharedValue,
  useDerivedValue,
  withDecay,
  withTiming,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { useUniverseStore } from '../../store/universeStore';
import { useMapStore } from '../../store/mapStore';
import { securityColor, theme } from '../../constants/colors';
import { classifySecurity } from '../../utils/security';
import { MAP } from '../../constants/map';
import { screenToWorld, distanceSquared } from '../../utils/coordinates';

export type MapCanvasRef = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
};

const labelFont = matchFont({
  fontFamily: 'System',
  fontSize: 10,
  fontWeight: '300',
});

export const MapCanvas = forwardRef<MapCanvasRef>((_, ref) => {
  const { width, height } = useWindowDimensions();
  const systems = useUniverseStore((s) => s.systems);
  const connections = useUniverseStore((s) => s.connections);
  const constellations = useUniverseStore((s) => s.constellations);
  const regions = useUniverseStore((s) => s.regions);
  const routeSystemIds = useMapStore((s) => s.routeSystemIds);
  const routeOriginId = useMapStore((s) => s.routeOriginId);
  const routeDestinationId = useMapStore((s) => s.routeDestinationId);
  const selectedSystemId = useMapStore((s) => s.selectedSystemId);
  const selectSystem = useMapStore((s) => s.selectSystem);

  // Shared values for pan/zoom
  const panX = useSharedValue(width / 2);
  const panY = useSharedValue(height / 2);
  const scaleVal = useSharedValue<number>(MAP.INITIAL_ZOOM);
  const prevTransX = useSharedValue(0);
  const prevTransY = useSharedValue(0);
  const prevScale = useSharedValue<number>(MAP.INITIAL_ZOOM);

  // Imperative zoom/reset methods
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      cancelAnimation(panX);
      cancelAnimation(panY);
      const focalX = width / 2;
      const focalY = height / 2;
      const worldX = (focalX - panX.value) / scaleVal.value;
      const worldY = (focalY - panY.value) / scaleVal.value;
      const newScale = Math.min(MAP.MAX_ZOOM, scaleVal.value * 1.5);
      scaleVal.value = withTiming(newScale, { duration: 200 });
      panX.value = withTiming(focalX - worldX * newScale, { duration: 200 });
      panY.value = withTiming(focalY - worldY * newScale, { duration: 200 });
    },
    zoomOut: () => {
      cancelAnimation(panX);
      cancelAnimation(panY);
      const focalX = width / 2;
      const focalY = height / 2;
      const worldX = (focalX - panX.value) / scaleVal.value;
      const worldY = (focalY - panY.value) / scaleVal.value;
      const newScale = Math.max(MAP.MIN_ZOOM, scaleVal.value / 1.5);
      scaleVal.value = withTiming(newScale, { duration: 200 });
      panX.value = withTiming(focalX - worldX * newScale, { duration: 200 });
      panY.value = withTiming(focalY - worldY * newScale, { duration: 200 });
    },
    resetView: () => {
      cancelAnimation(panX);
      cancelAnimation(panY);
      scaleVal.value = withTiming(MAP.INITIAL_ZOOM, { duration: 300 });
      panX.value = withTiming(width / 2, { duration: 300 });
      panY.value = withTiming(height / 2, { duration: 300 });
    },
  }), [width, height, panX, panY, scaleVal]);

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

  // Build security-colored route segment paths
  const routeSegmentPaths = useMemo(() => {
    if (!routeSystemIds || routeSystemIds.length < 2) return null;

    const highsecPath = Skia.Path.Make();
    const lowsecPath = Skia.Path.Make();
    const nullsecPath = Skia.Path.Make();

    for (let i = 0; i < routeSystemIds.length - 1; i++) {
      const fromSys = systems.get(routeSystemIds[i]);
      const toSys = systems.get(routeSystemIds[i + 1]);
      if (!fromSys || !toSys) continue;

      const secLevel = classifySecurity(toSys.securityStatus);
      const targetPath =
        secLevel === 'highsec' ? highsecPath :
        secLevel === 'lowsec' ? lowsecPath :
        nullsecPath;

      targetPath.moveTo(fromSys.nx, fromSys.nz);
      targetPath.lineTo(toSys.nx, toSys.nz);
    }

    return { highsecPath, lowsecPath, nullsecPath };
  }, [routeSystemIds, systems]);

  // Route system set for highlight
  const routeSystemSet = useMemo(() => {
    if (!routeSystemIds) return new Set<number>();
    return new Set(routeSystemIds);
  }, [routeSystemIds]);

  // Origin/destination system data for markers
  const originSystem = useMemo(
    () => (routeOriginId ? systems.get(routeOriginId) : undefined),
    [routeOriginId, systems],
  );
  const destSystem = useMemo(
    () => (routeDestinationId ? systems.get(routeDestinationId) : undefined),
    [routeDestinationId, systems],
  );

  // Destination diamond path
  const destDiamondPath = useMemo(() => {
    if (!destSystem) return null;
    const path = Skia.Path.Make();
    const s = 0.22;
    path.moveTo(destSystem.nx, destSystem.nz - s);
    path.lineTo(destSystem.nx + s * 0.6, destSystem.nz);
    path.lineTo(destSystem.nx, destSystem.nz + s);
    path.lineTo(destSystem.nx - s * 0.6, destSystem.nz);
    path.close();
    return path;
  }, [destSystem]);

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

  const routeHighsecPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.highsec));
    paint.setStrokeWidth(0.06);
    paint.setStyle(PaintStyle.Stroke);
    paint.setAntiAlias(true);
    return paint;
  }, []);

  const routeLowsecPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.lowsec));
    paint.setStrokeWidth(0.06);
    paint.setStyle(PaintStyle.Stroke);
    paint.setAntiAlias(true);
    return paint;
  }, []);

  const routeNullsecPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.nullsec));
    paint.setStrokeWidth(0.06);
    paint.setStyle(PaintStyle.Stroke);
    paint.setAntiAlias(true);
    return paint;
  }, []);

  const originRingPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.accent));
    paint.setStrokeWidth(0.03);
    paint.setStyle(PaintStyle.Stroke);
    paint.setAntiAlias(true);
    return paint;
  }, []);

  const destRingPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(theme.route));
    paint.setStrokeWidth(0.03);
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

            {/* Route overlay - security colored segments */}
            {routeSegmentPaths && (
              <>
                <Path path={routeSegmentPaths.highsecPath} paint={routeHighsecPaint} />
                <Path path={routeSegmentPaths.lowsecPath} paint={routeLowsecPaint} />
                <Path path={routeSegmentPaths.nullsecPath} paint={routeNullsecPaint} />
              </>
            )}

            {/* System nodes */}
            {systemArray.map((sys) => {
              const isSelected = sys.id === selectedSystemId;
              const isOnRoute = routeSystemSet.has(sys.id);
              const isHub = (MAP.TRADE_HUBS as readonly number[]).includes(sys.id);
              const radius = isHub ? 0.15 : isSelected ? 0.12 : isOnRoute ? 0.1 : 0.06;
              const color = isSelected
                ? theme.selectedHighlight
                : securityColor(sys.securityStatus);

              return <Circle key={sys.id} cx={sys.nx} cy={sys.nz} r={radius} color={color} />;
            })}

            {/* Origin marker: concentric ring */}
            {originSystem && (
              <>
                <Circle cx={originSystem.nx} cy={originSystem.nz} r={0.2} paint={originRingPaint} />
                <Circle cx={originSystem.nx} cy={originSystem.nz} r={0.12} color={theme.accent} />
              </>
            )}

            {/* Destination marker: diamond outline + filled dot */}
            {destSystem && destDiamondPath && (
              <>
                <Path path={destDiamondPath} paint={destRingPaint} />
                <Circle cx={destSystem.nx} cy={destSystem.nz} r={0.12} color={theme.route} />
              </>
            )}

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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  canvas: {
    flex: 1,
  },
});
