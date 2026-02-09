import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { fetchSystemKills, fetchSystemJumps, fetchStations } from '../../src/api/esi';
import { fetchRecentKills } from '../../src/api/evekill';
import { findNearestTradeHub } from '../../src/utils/bfs';
import { MAP } from '../../src/constants/map';
import {
  getServiceName,
  getServiceCategory,
  CATEGORY_COLORS,
} from '../../src/constants/stationServices';
import type {
  SystemKills,
  SystemJumps,
  Station,
  Killmail,
  RoutePreference,
} from '../../src/types/universe';

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

const formatTimeAgo = (isoTime: string): string => {
  const diff = Date.now() - new Date(isoTime).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}${STRINGS.minutesAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${STRINGS.hoursAgo}`;
  const days = Math.floor(hours / 24);
  return `${days}${STRINGS.daysAgo}`;
};

const formatIsk = (value: number): string => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
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
  const sovMap = useMapStore((s) => s.sovMap);
  const allianceNames = useMapStore((s) => s.allianceNames);

  const system = getSystem(systemId);
  const region = system ? getRegion(system.regionId) : undefined;
  const constellation = system ? getConstellation(system.constellationId) : undefined;
  const connectedIds = getConnectedSystems(systemId);

  const adjacencyList = useUniverseStore((s) => s.adjacencyList);

  const tradeHubResult = useMemo(
    () => findNearestTradeHub(systemId, adjacencyList, MAP.TRADE_HUBS as unknown as number[]),
    [systemId, adjacencyList],
  );

  const tradeHubSystem = tradeHubResult ? getSystem(tradeHubResult.hubId) : undefined;

  const sortedConnectedIds = useMemo(() => {
    return [...connectedIds].sort((a, b) => {
      const sysA = getSystem(a);
      const sysB = getSystem(b);
      if (!sysA || !sysB) return 0;
      if (sysB.securityStatus !== sysA.securityStatus) {
        return sysB.securityStatus - sysA.securityStatus;
      }
      return sysA.name.localeCompare(sysB.name);
    });
  }, [connectedIds, getSystem]);

  // Stats
  const [kills, setKills] = useState<SystemKills | null>(null);
  const [jumps, setJumps] = useState<SystemJumps | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Station data
  const [stationData, setStationData] = useState<readonly Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  // Killmail data
  const [killmails, setKillmails] = useState<readonly Killmail[]>([]);
  const [killmailsLoading, setKillmailsLoading] = useState(true);

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

  // Load station data
  useEffect(() => {
    if (!system || system.stationIds.length === 0) {
      setStationData([]);
      setStationsLoading(false);
      return;
    }
    setStationsLoading(true);
    fetchStations(system.stationIds).then((result) => {
      result.match(
        (data) => setStationData(data),
        () => setStationData([]),
      );
      setStationsLoading(false);
    });
  }, [system]);

  // Load killmail data
  useEffect(() => {
    setKillmailsLoading(true);
    fetchRecentKills(systemId, 10).then((result) => {
      result.match(
        (data) => setKillmails(data),
        () => setKillmails([]),
      );
      setKillmailsLoading(false);
    });
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
  const sov = sovMap.get(systemId);

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

        {/* Sovereignty info */}
        {sov && (sov.allianceId || sov.factionId) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{STRINGS.sovInfo}</Text>
            <View style={styles.sovCard}>
              {sov.allianceId && (
                <View style={styles.sovRow}>
                  <Text style={styles.sovLabel}>{STRINGS.allianceLabel}</Text>
                  <Text style={styles.sovValue}>
                    {allianceNames.get(sov.allianceId) ?? `ID: ${sov.allianceId}`}
                  </Text>
                </View>
              )}
              {sov.factionId && (
                <View style={styles.sovRow}>
                  <Text style={styles.sovLabel}>{STRINGS.factionLabel}</Text>
                  <Text style={styles.sovValue}>
                    {allianceNames.get(sov.factionId) ?? `ID: ${sov.factionId}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

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
                  {STRINGS.routeResult}: {route.length - 1} {STRINGS.routeJumps}
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

        {/* Station services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {STRINGS.stationServices} ({system.stationIds.length})
          </Text>
          {stationsLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : stationData.length === 0 ? (
            <Text style={styles.emptyText}>{STRINGS.noStations}</Text>
          ) : (
            stationData.map((station) => (
              <View key={station.stationId} style={styles.stationCard}>
                <Text style={styles.stationName}>{station.name}</Text>
                <View style={styles.serviceList}>
                  {station.services.map((svc) => {
                    const cat = getServiceCategory(svc);
                    return (
                      <View
                        key={svc}
                        style={[styles.serviceBadge, { borderColor: CATEGORY_COLORS[cat] }]}
                      >
                        <Text style={[styles.serviceText, { color: CATEGORY_COLORS[cat] }]}>
                          {getServiceName(svc)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent killmails */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{STRINGS.recentKills}</Text>
          {killmailsLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : killmails.length === 0 ? (
            <Text style={styles.emptyText}>{STRINGS.noRecentKills}</Text>
          ) : (
            killmails.map((km) => (
              <View key={km.killmailId} style={styles.killmailItem}>
                <View style={styles.killmailLeft}>
                  <Text style={styles.killmailShip}>{km.victimShipName}</Text>
                  <Text style={styles.killmailVictim}>
                    {km.victimName} [{km.victimCorp}]
                  </Text>
                </View>
                <View style={styles.killmailRight}>
                  <Text style={styles.killmailIsk}>
                    {formatIsk(km.totalValue)} {STRINGS.iskValue}
                  </Text>
                  <View style={styles.killmailMeta}>
                    <Text style={styles.killmailTime}>{formatTimeAgo(km.killTime)}</Text>
                    {km.isSolo && <Text style={styles.killmailSolo}>{STRINGS.soloKill}</Text>}
                    <Text style={styles.killmailAttackers}>x{km.attackerCount}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Nearest Trade Hub */}
        {tradeHubResult && tradeHubSystem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{STRINGS.nearestTradeHub}</Text>
            <View style={styles.tradeHubCard}>
              <View style={styles.tradeHubInfo}>
                <View
                  style={[
                    styles.connDot,
                    { backgroundColor: securityColor(tradeHubSystem.securityStatus) },
                  ]}
                />
                <Text style={styles.tradeHubName}>{tradeHubSystem.name}</Text>
                <Text style={styles.tradeHubDistance}>
                  {tradeHubResult.distance} {STRINGS.routeJumps}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.routeToHubButton}
                onPress={() => {
                  setRouteOrigin(systemId);
                  setRouteDestination(tradeHubResult.hubId);
                  router.back();
                }}
              >
                <Text style={styles.routeToHubText}>{STRINGS.routeToHub}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Connected systems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {STRINGS.connectedSystems} ({connectedIds.length})
          </Text>
          {sortedConnectedIds.map((connId) => {
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
  container: { flex: 1, backgroundColor: theme.background },
  content: { paddingBottom: 40 },
  errorText: { color: theme.error, fontSize: 14, textAlign: 'center', marginTop: 40 },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: theme.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  secBadgeLarge: {
    borderWidth: 1,
    borderRadius: 4,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  secValueLarge: { fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  headerInfo: { flex: 1 },
  systemNameLarge: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '200',
    letterSpacing: 2,
    marginBottom: 2,
  },
  secClassLabel: { fontSize: 11, fontWeight: '400', letterSpacing: 2 },
  breadcrumbRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border },
  breadcrumbText: { color: theme.textDim, fontSize: 11, fontWeight: '300', letterSpacing: 0.5 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  emptyText: { color: theme.textDim, fontSize: 12, fontWeight: '300', letterSpacing: 0.5 },
  routeActions: { flexDirection: 'row', gap: 8 },
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
  routeButtonActive: { borderColor: theme.accent, backgroundColor: `${theme.accent}15` },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeButtonText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  routeButtonTextActive: { color: theme.accent },
  routeCalcSection: { marginTop: 12 },
  prefRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  prefChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  prefChipActive: { borderColor: theme.accent, backgroundColor: `${theme.accent}20` },
  prefText: { color: theme.textDim, fontSize: 11, fontWeight: '400', letterSpacing: 1 },
  prefTextActive: { color: theme.accent },
  calcButton: {
    backgroundColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 3,
    alignItems: 'center',
  },
  calcButtonText: { color: theme.background, fontSize: 13, fontWeight: '500', letterSpacing: 1 },
  routeResult: {
    color: theme.route,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 10,
    textAlign: 'center',
  },
  statsGrid: { flexDirection: 'row', gap: 8 },
  // Station styles
  stationCard: {
    backgroundColor: theme.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 8,
  },
  stationName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serviceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  serviceBadge: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 },
  serviceText: { fontSize: 9, fontWeight: '400', letterSpacing: 0.5 },
  // Killmail styles
  killmailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}66`,
  },
  killmailLeft: { flex: 1, marginRight: 10 },
  killmailShip: { color: theme.text, fontSize: 13, fontWeight: '300', letterSpacing: 0.5 },
  killmailVictim: { color: theme.textDim, fontSize: 10, fontWeight: '300', marginTop: 2 },
  killmailRight: { alignItems: 'flex-end' },
  killmailIsk: { color: theme.route, fontSize: 12, fontWeight: '400', letterSpacing: 0.5 },
  killmailMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
  killmailTime: { color: theme.textDim, fontSize: 9, fontWeight: '300' },
  killmailSolo: { color: theme.accent, fontSize: 9, fontWeight: '400' },
  killmailAttackers: { color: theme.textSecondary, fontSize: 9, fontWeight: '300' },
  // Sov styles
  sovCard: {
    backgroundColor: theme.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  sovRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sovLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '400', letterSpacing: 1 },
  sovValue: { color: theme.text, fontSize: 12, fontWeight: '300', letterSpacing: 0.5 },
  // Connected system styles
  connectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}66`,
  },
  connDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  connName: { flex: 1, color: theme.text, fontSize: 13, fontWeight: '300', letterSpacing: 0.5 },
  connSec: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  // Trade hub styles
  tradeHubCard: {
    backgroundColor: theme.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  tradeHubInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tradeHubName: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  tradeHubDistance: { color: theme.route, fontSize: 13, fontWeight: '400', letterSpacing: 0.5 },
  routeToHubButton: {
    backgroundColor: theme.accent,
    paddingVertical: 10,
    borderRadius: 3,
    alignItems: 'center',
  },
  routeToHubText: { color: theme.background, fontSize: 12, fontWeight: '500', letterSpacing: 1 },
});
