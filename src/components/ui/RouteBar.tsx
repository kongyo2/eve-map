import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/colors';
import { securityColor } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';
import { classifySecurity } from '../../utils/security';
import { formatSecurity } from '../../utils/security';
import { useUniverseStore } from '../../store/universeStore';
import { useMapStore } from '../../store/mapStore';
import { useRoute } from '../../hooks/useRoute';
import type { RoutePreference } from '../../types/universe';

export const RouteBar = ({ onLayout }: { onLayout?: (height: number) => void }) => {
  const insets = useSafeAreaInsets();
  const {
    route,
    originId,
    destinationId,
    isCalculating,
    error,
    clear,
    swap,
    preference,
    setPreference,
  } = useRoute();
  const getSystem = useUniverseStore((s) => s.getSystem);
  const avoidedSystemIds = useMapStore((s) => s.avoidedSystemIds);
  const clearAvoidedSystems = useMapStore((s) => s.clearAvoidedSystems);
  const originName = originId ? getSystem(originId)?.name : null;
  const destName = destinationId ? getSystem(destinationId)?.name : null;
  const [expanded, setExpanded] = useState(false);

  const securityBreakdown = useMemo(() => {
    if (!route || route.length < 2) return null;
    let highsec = 0;
    let lowsec = 0;
    let nullsec = 0;
    for (let i = 1; i < route.length; i++) {
      const sys = getSystem(route[i]);
      if (!sys) continue;
      const level = classifySecurity(sys.securityStatus);
      if (level === 'highsec') highsec++;
      else if (level === 'lowsec') lowsec++;
      else nullsec++;
    }
    return { highsec, lowsec, nullsec };
  }, [route, getSystem]);

  if (!originId && !destinationId) return null;

  const hasRoute = route && route.length > 1;
  const jumpCount = hasRoute ? route.length - 1 : 0;

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}
    >
      {/* Expandable step list */}
      {expanded && hasRoute && (
        <View style={styles.stepListContainer}>
          <View style={styles.stepListHeader}>
            <Text style={styles.stepListTitle}>
              {STRINGS.routeDetails} ({jumpCount} {STRINGS.routeJumps})
            </Text>
          </View>
          <ScrollView style={styles.stepListScroll} nestedScrollEnabled>
            {route.map((sysId, index) => {
              const sys = getSystem(sysId);
              if (!sys) return null;
              const secColor = securityColor(sys.securityStatus);
              const isOrigin = index === 0;
              const isDest = index === route.length - 1;
              return (
                <View key={sysId} style={styles.stepRow}>
                  <Text style={styles.stepIndex}>{index}</Text>
                  <View style={[styles.stepDot, { backgroundColor: secColor }]} />
                  <Text style={styles.stepName} numberOfLines={1}>
                    {sys.name}
                  </Text>
                  <Text style={[styles.stepSec, { color: secColor }]}>
                    {formatSecurity(sys.securityStatus)}
                  </Text>
                  {isOrigin && (
                    <View style={[styles.stepBadge, { borderColor: theme.accent }]}>
                      <Text style={[styles.stepBadgeText, { color: theme.accent }]}>
                        {STRINGS.routeOriginLabel}
                      </Text>
                    </View>
                  )}
                  {isDest && (
                    <View style={[styles.stepBadge, { borderColor: theme.route }]}>
                      <Text style={[styles.stepBadgeText, { color: theme.route }]}>
                        {STRINGS.routeDestLabel}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main bar */}
      <View style={styles.mainBar}>
        <View style={styles.routeInfo}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.originDot]} />
            <Text style={styles.routeLabel} numberOfLines={1}>
              {originName ?? STRINGS.routeFrom}
            </Text>
          </View>
          <TouchableOpacity style={styles.swapButton} onPress={swap}>
            <Text style={styles.swapText}>{'⇅'}</Text>
          </TouchableOpacity>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.destDot]} />
            <Text style={styles.routeLabel} numberOfLines={1}>
              {destName ?? STRINGS.routeTo}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {isCalculating ? (
            <ActivityIndicator size="small" color={theme.route} />
          ) : error ? (
            <Text style={styles.errorText} numberOfLines={1}>
              {error}
            </Text>
          ) : hasRoute ? (
            <TouchableOpacity style={styles.jumpCount} onPress={() => setExpanded(!expanded)}>
              <Text style={styles.jumpNumber}>{jumpCount}</Text>
              <Text style={styles.jumpUnit}>
                {STRINGS.routeJumps} {expanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.clearButton} onPress={clear}>
            <Text style={styles.clearText}>x</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row: preference chips + security breakdown */}
      {hasRoute && (
        <View style={styles.bottomRow}>
          <View style={styles.prefChips}>
            {(['shortest', 'secure', 'insecure'] as RoutePreference[]).map((pref) => (
              <TouchableOpacity
                key={pref}
                style={[styles.prefChip, preference === pref && styles.prefChipActive]}
                onPress={() => setPreference(pref)}
              >
                <Text style={[styles.prefText, preference === pref && styles.prefTextActive]}>
                  {pref === 'shortest'
                    ? STRINGS.shortest
                    : pref === 'secure'
                      ? STRINGS.secure
                      : STRINGS.insecure}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {securityBreakdown && (
            <View style={styles.breakdownRow}>
              {securityBreakdown.highsec > 0 && (
                <Text style={[styles.breakdownText, { color: theme.highsec }]}>
                  {securityBreakdown.highsec}
                  {STRINGS.highsec}
                </Text>
              )}
              {securityBreakdown.lowsec > 0 && (
                <Text style={[styles.breakdownText, { color: theme.lowsec }]}>
                  {securityBreakdown.lowsec}
                  {STRINGS.lowsec}
                </Text>
              )}
              {securityBreakdown.nullsec > 0 && (
                <Text style={[styles.breakdownText, { color: theme.nullsec }]}>
                  {securityBreakdown.nullsec}
                  {STRINGS.nullsec}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Avoided systems count */}
      {avoidedSystemIds.length > 0 && (
        <View style={styles.avoidedRow}>
          <Text style={styles.avoidedText}>
            {STRINGS.avoidedCount}: {avoidedSystemIds.length}
          </Text>
          <TouchableOpacity onPress={clearAvoidedSystems}>
            <Text style={styles.clearAvoidedText}>{STRINGS.clearAvoided}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${theme.surface}f0`,
    borderTopWidth: 1,
    borderTopColor: theme.route,
  },
  // Step list
  stepListContainer: {
    maxHeight: Dimensions.get('window').height * 0.4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  stepListHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  stepListTitle: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1,
  },
  stepListScroll: {
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}44`,
  },
  stepIndex: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '400',
    width: 24,
    textAlign: 'right',
    marginRight: 8,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  stepName: {
    flex: 1,
    color: theme.text,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  stepSec: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  stepBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  stepBadgeText: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Main bar
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  originDot: {
    backgroundColor: theme.accent,
  },
  destDot: {
    backgroundColor: theme.route,
  },
  routeLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  swapButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  swapText: {
    color: theme.textDim,
    fontSize: 14,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jumpCount: {
    alignItems: 'center',
  },
  jumpNumber: {
    color: theme.route,
    fontSize: 20,
    fontWeight: '200',
    letterSpacing: 1,
  },
  jumpUnit: {
    color: theme.textDim,
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 1,
  },
  errorText: {
    color: theme.error,
    fontSize: 10,
    fontWeight: '400',
    maxWidth: 100,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: theme.textDim,
    fontSize: 14,
    fontWeight: '200',
  },
  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 0,
  },
  prefChips: {
    flexDirection: 'row',
    gap: 4,
  },
  prefChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  prefChipActive: {
    borderColor: theme.accent,
    backgroundColor: `${theme.accent}20`,
  },
  prefText: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  prefTextActive: {
    color: theme.accent,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 6,
  },
  breakdownText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  avoidedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: `${theme.border}44`,
  },
  avoidedText: {
    color: theme.danger,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  clearAvoidedText: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
});
