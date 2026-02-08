import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useUniverseStore } from '../../src/store/universeStore';
import { useMapStore } from '../../src/store/mapStore';
import { useRoute } from '../../src/hooks/useRoute';
import { theme, securityColor } from '../../src/constants/colors';
import { STRINGS } from '../../src/constants/strings';
import { formatSecurity, classifySecurity } from '../../src/utils/security';
import { fetchSystemKills, fetchSystemJumps } from '../../src/api/esi';
import type { SystemKills, SystemJumps, RoutePreference } from '../../src/types/universe';

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

export default function SystemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const systemId = Number(id);
  const router = useRouter();
  const getSystem = useUniverseStore((s) => s.getSystem);
  const getRegion = useUniverseStore((s) => s.getRegion);
  const getConstellation = useUniverseStore((s) => s.getConstellation);
  const getConnectedSystems = useUniverseStore((s) => s.getConnectedSystems);
  const { originId, destinationId, route, calculate, setPreference, preference, isCalculating } =
    useRoute();
  const setRouteOrigin = useMapStore((s) => s.setRouteOrigin);
  const setRouteDestination = useMapStore((s) => s.setRouteDestination);

  const system = getSystem(systemId);
  const region = system ? getRegion(system.regionId) : undefined;
  const constellation = system ? getConstellation(system.constellationId) : undefined;
  const connectedIds = getConnectedSystems(systemId);

  const [kills, setKills] = useState<SystemKills | null>(null);
  const [jumps, setJumps] = useState<SystemJumps | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      const [killsResult, jumpsResult] = await Promise.all([
        fetchSystemKills(),
        fetchSystemJumps(),
      ]);
      killsResult.match(
        (data) => {
          const found = data.find((k) => k.systemId === systemId);
          setKills(found ?? null);
        },
        () => undefined,
      );
      jumpsResult.match(
        (data) => {
          const found = data.find((j) => j.systemId === systemId);
          setJumps(found ?? null);
        },
        () => undefined,
      );
      setStatsLoading(false);
    };
    loadStats();
  }, [systemId]);

  const handleOrigin = useCallback(() => {
    setRouteOrigin(systemId);
  }, [setRouteOrigin, systemId]);

  const handleDestination = useCallback(() => {
    setRouteDestination(systemId);
  }, [setRouteDestination, systemId]);

  if (!system) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>システムが見つかりません</Text>
      </View>
    );
  }

  const secColor = securityColor(system.securityStatus);

  return (
    <>
      <Stack.Screen options={{ title: system.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View
              style={[
                styles.secBadgeLarge,
                { borderColor: secColor, backgroundColor: `${secColor}15` },
              ]}
            >
              <Text style={[styles.secValueLarge, { color: secColor }]}>
                {formatSecurity(system.securityStatus)}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.systemNameLarge}>{system.name}</Text>
              <Text style={[styles.secClassLabel, { color: secColor }]}>
                {securityLabel(system.securityStatus)}
              </Text>
            </View>
          </View>
          <View style={styles.breadcrumbRow}>
            <Text style={styles.breadcrumbText}>
              {region?.name} {'>'} {constellation?.name}
            </Text>
          </View>
        </View>

        {/* Route actions */}
        <View style={styles.section}>
          <View style={styles.routeActions}>
            <TouchableOpacity
              style={[styles.routeButton, originId === systemId && styles.routeButtonActive]}
              onPress={handleOrigin}
            >
              <View style={[styles.routeDot, { backgroundColor: theme.accent }]} />
              <Text
                style={[
                  styles.routeButtonText,
                  originId === systemId && styles.routeButtonTextActive,
                ]}
              >
                {STRINGS.setAsOrigin}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.routeButton, destinationId === systemId && styles.routeButtonActive]}
              onPress={handleDestination}
            >
              <View style={[styles.routeDot, { backgroundColor: theme.route }]} />
              <Text
                style={[
                  styles.routeButtonText,
                  destinationId === systemId && styles.routeButtonTextActive,
                ]}
              >
                {STRINGS.setAsDestination}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Route preference & calculate */}
          {originId && destinationId && (
            <View style={styles.routeCalcSection}>
              <View style={styles.prefRow}>
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
              <TouchableOpacity
                style={styles.calcButton}
                onPress={calculate}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <Text style={styles.calcButtonText}>{STRINGS.calculateRoute}</Text>
                )}
              </TouchableOpacity>
              {route && (
                <Text style={styles.routeResult}>
                  {STRINGS.routeResult}: {route.length} {STRINGS.routeJumps}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{STRINGS.killStats}</Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : kills ? (
            <View style={styles.statsGrid}>
              <StatBox label={STRINGS.shipKills} value={kills.shipKills} color={theme.error} />
              <StatBox label={STRINGS.podKills} value={kills.podKills} color="#ff8a65" />
              <StatBox
                label={STRINGS.npcKills}
                value={kills.npcKills}
                color={theme.textSecondary}
              />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <StatBox label={STRINGS.shipKills} value={0} color={theme.textDim} />
              <StatBox label={STRINGS.podKills} value={0} color={theme.textDim} />
              <StatBox label={STRINGS.npcKills} value={0} color={theme.textDim} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{STRINGS.jumpStats}</Text>
          <View style={styles.statsGrid}>
            <StatBox label={STRINGS.shipJumps} value={jumps?.shipJumps ?? 0} color={theme.accent} />
          </View>
        </View>

        {/* Connected systems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {STRINGS.connectedSystems} ({connectedIds.length})
          </Text>
          {connectedIds.map((connId) => {
            const connSys = getSystem(connId);
            if (!connSys) return null;
            const connSecColor = securityColor(connSys.securityStatus);
            return (
              <TouchableOpacity
                key={connId}
                style={styles.connectedItem}
                onPress={() => router.push(`/system/${connId}`)}
              >
                <View style={[styles.connDot, { backgroundColor: connSecColor }]} />
                <Text style={styles.connName}>{connSys.name}</Text>
                <Text style={[styles.connSec, { color: connSecColor }]}>
                  {formatSecurity(connSys.securityStatus)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const StatBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={statStyles.box}>
    <Text style={[statStyles.value, { color }]}>{value.toLocaleString()}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  value: {
    fontSize: 20,
    fontWeight: '200',
    letterSpacing: 1,
    marginBottom: 4,
  },
  label: {
    color: theme.textDim,
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingBottom: 40,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: theme.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secBadgeLarge: {
    borderWidth: 1,
    borderRadius: 4,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  secValueLarge: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1,
  },
  headerInfo: {
    flex: 1,
  },
  systemNameLarge: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '200',
    letterSpacing: 2,
    marginBottom: 2,
  },
  secClassLabel: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
  },
  breadcrumbRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  breadcrumbText: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  routeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 3,
    gap: 6,
  },
  routeButtonActive: {
    borderColor: theme.accent,
    backgroundColor: `${theme.accent}15`,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  routeButtonText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  routeButtonTextActive: {
    color: theme.accent,
  },
  routeCalcSection: {
    marginTop: 12,
  },
  prefRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  prefChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1,
  },
  prefTextActive: {
    color: theme.accent,
  },
  calcButton: {
    backgroundColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 3,
    alignItems: 'center',
  },
  calcButtonText: {
    color: theme.background,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
  routeResult: {
    color: theme.route,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 10,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  connectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}66`,
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  connName: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  connSec: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
