import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';
import type { DetailLevel } from '../../types/universe';

type Props = {
  detailLevel: DetailLevel;
  systemCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSearch: () => void;
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

export const MapControls = ({
  detailLevel,
  systemCount,
  onZoomIn,
  onZoomOut,
  onReset,
  onSearch,
}: Props) => {
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

      {/* Search FAB */}
      <TouchableOpacity style={styles.searchFab} onPress={onSearch} activeOpacity={0.8}>
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
  searchFab: {
    position: 'absolute',
    bottom: 32,
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
