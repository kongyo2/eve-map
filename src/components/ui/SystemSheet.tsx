import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme, securityColor } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';
import { formatSecurity, classifySecurity } from '../../utils/security';
import { useUniverseStore } from '../../store/universeStore';
import { useMapStore } from '../../store/mapStore';

const { height: _SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 220;

const securityLabel = (sec: number): string => {
  const level = classifySecurity(sec);
  switch (level) {
    case 'highsec':
      return STRINGS.highsec;
    case 'lowsec':
      return STRINGS.lowsec;
    case 'nullsec':
      return STRINGS.nullsec;
  }
};

export const SystemSheet = () => {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const selectedSystemId = useMapStore((s) => s.selectedSystemId);
  const showSystemSheet = useMapStore((s) => s.showSystemSheet);
  const setShowSystemSheet = useMapStore((s) => s.setShowSystemSheet);
  const setRouteOrigin = useMapStore((s) => s.setRouteOrigin);
  const setRouteDestination = useMapStore((s) => s.setRouteDestination);
  const getSystem = useUniverseStore((s) => s.getSystem);
  const getRegion = useUniverseStore((s) => s.getRegion);
  const getConstellation = useUniverseStore((s) => s.getConstellation);

  const system = selectedSystemId ? getSystem(selectedSystemId) : undefined;
  const region = system ? getRegion(system.regionId) : undefined;
  const constellation = system ? getConstellation(system.constellationId) : undefined;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: showSystemSheet && system ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [showSystemSheet, system, slideAnim]);

  if (!system) return null;

  const secColor = securityColor(system.securityStatus);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      {/* Handle bar */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* System header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.nameRow}>
            <View style={[styles.secDot, { backgroundColor: secColor }]} />
            <Text style={styles.systemName}>{system.name}</Text>
            <View style={[styles.secBadge, { borderColor: secColor }]}>
              <Text style={[styles.secValue, { color: secColor }]}>
                {formatSecurity(system.securityStatus)}
              </Text>
            </View>
          </View>
          <Text style={styles.breadcrumb}>
            {region?.name} {'>'} {constellation?.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => setShowSystemSheet(false)}>
          <Text style={styles.closeText}>x</Text>
        </TouchableOpacity>
      </View>

      {/* Security classification */}
      <View style={styles.secRow}>
        <Text style={[styles.secLabel, { color: secColor }]}>
          {securityLabel(system.securityStatus)}
        </Text>
        <View style={styles.secDivider} />
        <Text style={styles.infoText}>
          {STRINGS.stargates}: {system.stargateIds.length}
        </Text>
        <View style={styles.secDivider} />
        <Text style={styles.infoText}>
          {STRINGS.stations}: {system.stationIds.length}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setRouteOrigin(system.id);
            setShowSystemSheet(false);
          }}
        >
          <Text style={styles.actionText}>{STRINGS.setAsOrigin}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setRouteDestination(system.id);
            setShowSystemSheet(false);
          }}
        >
          <Text style={styles.actionText}>{STRINGS.setAsDestination}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonAccent]}
          onPress={() => {
            setShowSystemSheet(false);
          }}
        >
          <Text style={[styles.actionText, styles.actionTextAccent]}>{STRINGS.viewDetails}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: `${theme.surface}f5`,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.textDim,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  secDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  systemName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1,
    marginRight: 8,
  },
  secBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  secValue: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  breadcrumb: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginLeft: 16,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.textDim,
    fontSize: 16,
    fontWeight: '200',
  },
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  secLabel: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1,
  },
  secDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.border,
    marginHorizontal: 10,
  },
  infoText: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '300',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 2,
    alignItems: 'center',
  },
  actionButtonAccent: {
    borderColor: theme.accent,
    backgroundColor: `${theme.accent}15`,
  },
  actionText: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  actionTextAccent: {
    color: theme.accent,
  },
});
