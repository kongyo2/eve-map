import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';
import type { DetailLevel, HeatmapMode } from '../../types/universe';

type Props = {
  detailLevel: DetailLevel;
  systemCount: number;
  heatmapMode: HeatmapMode;
  sovActive: boolean;
  bottomOffset: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSearch: () => void;
  onToggleHeatmap: () => void;
  onToggleSov: () => void;
  onNearbySearch?: () => void;
  onLandmarkSearch?: () => void;
};

const detailLevelLabel = (level: DetailLevel): string => {
  switch (level) {
    case 'region':
      return STRINGS.regionView;
    case 'constellation':
      return STRINGS.constellationView;
    case 'system':
      return STRINGS.systemView;
  }
};

const heatmapLabel = (mode: HeatmapMode): string => {
  switch (mode) {
    case 'off':
      return STRINGS.heatmapOff;
    case 'kills':
      return STRINGS.heatmapKills;
    case 'jumps':
      return STRINGS.heatmapJumps;
  }
};

export const MapControls = ({
  detailLevel,
  systemCount,
  heatmapMode,
  sovActive,
  bottomOffset,
  onZoomIn,
  onZoomOut,
  onReset,
  onSearch,
  onToggleHeatmap,
  onToggleSov,
  onNearbySearch,
  onLandmarkSearch,
}: Props) => {
  const insets = useSafeAreaInsets();
  const heatmapOn = heatmapMode !== 'off';

  return (
    <>
      {/* Top-left info badge */}
      <View style={styles.infoBadge}>
        <Text style={styles.infoLabel}>{detailLevelLabel(detailLevel)}</Text>
        <View style={styles.infoDivider} />
        <Text style={styles.infoCount}>{systemCount.toLocaleString()} システム</Text>
      </View>

      {/* Top-right zoom controls */}
      <View style={styles.zoomContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn} activeOpacity={0.7}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDividerLine} />
        <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut} activeOpacity={0.7}>
          <Text style={styles.zoomText}>-</Text>
        </TouchableOpacity>
      </View>

      {/* Reset view button */}
      <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.7}>
        <Text style={styles.resetText}>{STRINGS.resetView}</Text>
      </TouchableOpacity>

      {/* Heatmap cycle button */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          styles.heatmapButton,
          heatmapOn && styles.overlayButtonActive,
        ]}
        onPress={onToggleHeatmap}
        activeOpacity={0.7}
      >
        <Text style={[styles.overlayText, heatmapOn && styles.overlayTextActive]}>
          {heatmapOn ? heatmapLabel(heatmapMode) : STRINGS.heatmapToggle}
        </Text>
      </TouchableOpacity>

      {/* Sovereignty toggle */}
      <TouchableOpacity
        style={[styles.overlayButton, styles.sovButton, sovActive && styles.sovButtonActive]}
        onPress={onToggleSov}
        activeOpacity={0.7}
      >
        <Text style={[styles.overlayText, sovActive && styles.sovTextActive]}>
          {sovActive ? STRINGS.sovActive : STRINGS.sovToggle}
        </Text>
      </TouchableOpacity>

      {/* Nearby search button */}
      {onNearbySearch && (
        <TouchableOpacity
          style={[styles.overlayButton, styles.nearbyButton]}
          onPress={onNearbySearch}
          activeOpacity={0.7}
        >
          <Text style={styles.overlayText}>{STRINGS.nearbySearch}</Text>
        </TouchableOpacity>
      )}

      {/* Landmark search button */}
      {onLandmarkSearch && (
        <TouchableOpacity
          style={[styles.overlayButton, styles.landmarkButton]}
          onPress={onLandmarkSearch}
          activeOpacity={0.7}
        >
          <Text style={styles.overlayText}>{STRINGS.landmarkSearch}</Text>
        </TouchableOpacity>
      )}

      {/* Search FAB */}
      <TouchableOpacity
        style={[styles.searchFab, { bottom: 32 + insets.bottom + bottomOffset }]}
        onPress={onSearch}
        activeOpacity={0.8}
      >
        <Text style={styles.searchIcon}>&#x2315;</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  infoBadge: {
    position: 'absolute',
    top: 56,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.surface}cc`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoLabel: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1,
  },
  infoDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  infoCount: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  zoomContainer: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: `${theme.surface}cc`,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '200',
  },
  zoomDividerLine: {
    height: 1,
    backgroundColor: theme.border,
  },
  resetButton: {
    position: 'absolute',
    top: 106,
    right: 16,
    backgroundColor: `${theme.surface}cc`,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  overlayButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: `${theme.surface}cc`,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapButton: {
    top: 150,
  },
  overlayButtonActive: {
    borderColor: theme.danger,
    backgroundColor: `${theme.danger}30`,
  },
  overlayText: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  overlayTextActive: {
    color: theme.danger,
  },
  sovButton: {
    top: 186,
  },
  sovButtonActive: {
    borderColor: '#9c7cff',
    backgroundColor: '#9c7cff30',
  },
  sovTextActive: {
    color: '#9c7cff',
  },
  nearbyButton: {
    top: 222,
  },
  landmarkButton: {
    top: 258,
  },
  searchFab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  searchIcon: {
    color: theme.background,
    fontSize: 24,
    fontWeight: '300',
  },
});
