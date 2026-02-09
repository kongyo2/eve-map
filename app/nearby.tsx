import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, securityColor } from '../src/constants/colors';
import { STRINGS } from '../src/constants/strings';
import { formatSecurity, classifySecurity } from '../src/utils/security';
import { useUniverseStore } from '../src/store/universeStore';
import { useMapStore } from '../src/store/mapStore';
import { findSystemsInRange, type NearbyResult } from '../src/utils/bfs';

type FilterMode = 'all' | 'highsec' | 'lowsec' | 'nullsec' | 'stations';

export default function NearbyScreen() {
  const router = useRouter();
  const { origin } = useLocalSearchParams<{ origin: string }>();
  const originId = origin ? parseInt(origin, 10) : null;

  const [maxJumps, setMaxJumps] = useState(5);
  const [filter, setFilter] = useState<FilterMode>('all');

  const getSystem = useUniverseStore((s) => s.getSystem);
  const adjacencyList = useUniverseStore((s) => s.adjacencyList);
  const setNearbySystemIds = useMapStore((s) => s.setNearbySystemIds);
  const selectSystem = useMapStore((s) => s.selectSystem);

  const originSystem = originId ? getSystem(originId) : undefined;

  const nearbyResults = useMemo(() => {
    if (!originId || !adjacencyList) return [];
    return findSystemsInRange(originId, adjacencyList, maxJumps);
  }, [originId, adjacencyList, maxJumps]);

  const filteredResults = useMemo(() => {
    return nearbyResults.filter((r) => {
      const sys = getSystem(r.systemId);
      if (!sys) return false;
      switch (filter) {
        case 'highsec':
          return classifySecurity(sys.securityStatus) === 'highsec';
        case 'lowsec':
          return classifySecurity(sys.securityStatus) === 'lowsec';
        case 'nullsec':
          return classifySecurity(sys.securityStatus) === 'nullsec';
        case 'stations':
          return sys.stationIds.length > 0;
        default:
          return true;
      }
    });
  }, [nearbyResults, filter, getSystem]);

  // Update map highlights when results change
  const handleHighlight = useCallback(() => {
    setNearbySystemIds(filteredResults.map((r) => r.systemId));
    router.back();
  }, [filteredResults, setNearbySystemIds, router]);

  const handleSelect = useCallback(
    (systemId: number) => {
      selectSystem(systemId);
      router.back();
    },
    [selectSystem, router],
  );

  const handleClear = useCallback(() => {
    setNearbySystemIds(null);
    router.back();
  }, [setNearbySystemIds, router]);

  const renderItem = useCallback(
    ({ item }: { item: NearbyResult }) => {
      const sys = getSystem(item.systemId);
      if (!sys) return null;
      const secColor = securityColor(sys.securityStatus);

      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleSelect(item.systemId)}
          activeOpacity={0.6}
        >
          <View style={styles.resultLeft}>
            <Text style={styles.distanceBadge}>{item.distance}J</Text>
            <View style={[styles.secDot, { backgroundColor: secColor }]} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={1}>
                {sys.name}
              </Text>
              <Text style={styles.resultMeta}>
                {formatSecurity(sys.securityStatus)}
                {sys.stationIds.length > 0 ? ` · ${sys.stationIds.length} ${STRINGS.stations}` : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [getSystem, handleSelect],
  );

  if (!originSystem) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{STRINGS.loadError}</Text>
      </View>
    );
  }

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'highsec', label: STRINGS.highsec },
    { key: 'lowsec', label: STRINGS.lowsec },
    { key: 'nullsec', label: STRINGS.nullsec },
    { key: 'stations', label: STRINGS.hasStations },
  ];

  return (
    <View style={styles.container}>
      {/* Origin info */}
      <View style={styles.originRow}>
        <View
          style={[styles.secDot, { backgroundColor: securityColor(originSystem.securityStatus) }]}
        />
        <Text style={styles.originName}>{originSystem.name}</Text>
        <Text style={styles.originSec}>{formatSecurity(originSystem.securityStatus)}</Text>
      </View>

      {/* Jump range slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{STRINGS.maxJumpsLabel}</Text>
          <Text style={styles.sliderValue}>{maxJumps}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={15}
          step={1}
          value={maxJumps}
          onValueChange={setMaxJumps}
          minimumTrackTintColor={theme.accent}
          maximumTrackTintColor={theme.border}
          thumbTintColor={theme.accent}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result count + actions */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {filteredResults.length}
          {STRINGS.systemsFound}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.highlightButton} onPress={handleHighlight}>
            <Text style={styles.highlightText}>MAP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>{STRINGS.clearAvoided}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results list */}
      <FlatList
        data={filteredResults}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.systemId)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
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
  sliderSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  sliderValue: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: '200',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    borderColor: theme.accent,
    backgroundColor: `${theme.accent}20`,
  },
  filterText: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: theme.accent,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  highlightButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  highlightText: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  clearText: {
    color: theme.textDim,
    fontSize: 10,
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}44`,
  },
  resultLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceBadge: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    width: 28,
    textAlign: 'right',
    marginRight: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  resultMeta: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 2,
  },
  emptyText: {
    color: theme.textDim,
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 40,
  },
});
