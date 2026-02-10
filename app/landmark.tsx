import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, securityColor } from '../src/constants/colors';
import { STRINGS } from '../src/constants/strings';
import { formatSecurity } from '../src/utils/security';
import { useUniverseStore } from '../src/store/universeStore';
import { fetchAllLandmarks } from '../src/api/sde';
import type { Landmark, NormalizedSystem } from '../src/types/universe';

type LandmarkWithDistance = Landmark & {
  readonly nearestSystem?: NormalizedSystem;
  readonly jumpDistance: number | null;
};

const findNearestSystem = (
  landmark: Landmark,
  systems: ReadonlyMap<number, NormalizedSystem>,
): NormalizedSystem | undefined => {
  let nearest: NormalizedSystem | undefined;
  let minDist = Infinity;

  for (const sys of systems.values()) {
    const dx = landmark.position.x - sys.position.x;
    const dy = landmark.position.y - sys.position.y;
    const dz = landmark.position.z - sys.position.z;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      nearest = sys;
    }
  }

  return nearest;
};

const bfsDistance = (
  fromId: number,
  toId: number,
  adjacencyList: ReadonlyMap<number, readonly number[]>,
  maxSearch: number = 50,
): number | null => {
  if (fromId === toId) return 0;
  const visited = new Set<number>([fromId]);
  const queue: { id: number; dist: number }[] = [{ id: fromId, dist: 0 }];

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (dist >= maxSearch) continue;
    const neighbors = adjacencyList.get(id) ?? [];
    for (const neighbor of neighbors) {
      if (neighbor === toId) return dist + 1;
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push({ id: neighbor, dist: dist + 1 });
    }
  }

  return null;
};

export default function LandmarkScreen() {
  const router = useRouter();
  const { origin } = useLocalSearchParams<{ origin: string }>();
  const originId = origin ? parseInt(origin, 10) : null;

  const systems = useUniverseStore((s) => s.systems);
  const getSystem = useUniverseStore((s) => s.getSystem);
  const adjacencyList = useUniverseStore((s) => s.adjacencyList);
  const originSystem = originId ? getSystem(originId) : undefined;

  const [landmarks, setLandmarks] = useState<readonly Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAllLandmarks().then((result) => {
      result.match(
        (data) => setLandmarks(data),
        (err) => setError(err.message),
      );
      setLoading(false);
    });
  }, []);

  const landmarksWithDistance = useMemo(() => {
    if (landmarks.length === 0) return [];

    const results: LandmarkWithDistance[] = [];

    for (const lm of landmarks) {
      const nearestSys = findNearestSystem(lm, systems);
      let jumpDist: number | null = null;

      if (originId && nearestSys) {
        jumpDist = bfsDistance(originId, nearestSys.id, adjacencyList, 50);
      }

      results.push({
        ...lm,
        nearestSystem: nearestSys,
        jumpDistance: jumpDist,
      });
    }

    // Sort: known distances first (ascending), then unknown
    results.sort((a, b) => {
      if (a.jumpDistance !== null && b.jumpDistance !== null)
        return a.jumpDistance - b.jumpDistance;
      if (a.jumpDistance !== null) return -1;
      if (b.jumpDistance !== null) return 1;
      return a.name.localeCompare(b.name);
    });

    return results;
  }, [landmarks, systems, originId, adjacencyList]);

  const handleViewDetails = useCallback(
    (systemId: number) => {
      router.push(`/system/${systemId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: LandmarkWithDistance }) => {
      const sys = item.nearestSystem;
      const secColor = sys ? securityColor(sys.securityStatus) : theme.textDim;

      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => sys && handleViewDetails(sys.id)}
          activeOpacity={0.6}
        >
          <View style={styles.resultLeft}>
            {item.jumpDistance !== null ? (
              <Text style={styles.distanceBadge}>{item.jumpDistance}J</Text>
            ) : (
              <Text style={[styles.distanceBadge, { color: theme.textDim }]}>--</Text>
            )}
            <View style={[styles.secDot, { backgroundColor: secColor }]} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={1}>
                {item.name}
              </Text>
              {sys && (
                <Text style={styles.resultMeta}>
                  {STRINGS.landmarkNearSystem}: {sys.name} ({formatSecurity(sys.securityStatus)})
                </Text>
              )}
              {item.description.length > 0 && (
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleViewDetails],
  );

  return (
    <View style={styles.container}>
      {/* Origin info (if selected) */}
      {originSystem && (
        <View style={styles.originRow}>
          <View
            style={[styles.secDot, { backgroundColor: securityColor(originSystem.securityStatus) }]}
          />
          <Text style={styles.originName}>{originSystem.name}</Text>
          <Text style={styles.originSec}>{formatSecurity(originSystem.securityStatus)}</Text>
        </View>
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.loadingText}>{STRINGS.landmarkLoading}</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {/* Result count */}
      {!loading && !error && (
        <View style={styles.resultHeader}>
          <Text style={styles.resultCount}>
            {landmarksWithDistance.length} {STRINGS.landmarkSearch}
          </Text>
        </View>
      )}

      {/* Results list */}
      {!loading && !error && (
        <FlatList
          data={landmarksWithDistance}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>{STRINGS.noLandmarks}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  secDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  originName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 1,
    marginRight: 8,
  },
  originSec: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: theme.textDim,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  errorText: {
    color: theme.error,
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  resultCount: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}44`,
  },
  resultLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  distanceBadge: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    width: 28,
    textAlign: 'right',
    marginRight: 10,
    marginTop: 2,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  resultMeta: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 2,
  },
  resultDescription: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 4,
    lineHeight: 14,
  },
  emptyText: {
    color: theme.textDim,
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 40,
  },
});
