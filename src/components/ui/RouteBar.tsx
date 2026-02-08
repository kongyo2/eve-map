import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';
import { useUniverseStore } from '../../store/universeStore';
import { useRoute } from '../../hooks/useRoute';

export const RouteBar = () => {
  const { route, originId, destinationId, clear } = useRoute();
  const getSystem = useUniverseStore((s) => s.getSystem);
  const originName = originId ? getSystem(originId)?.name : null;
  const destName = destinationId ? getSystem(destinationId)?.name : null;

  if (!route || route.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.routeInfo}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.originDot]} />
          <Text style={styles.routeLabel} numberOfLines={1}>
            {originName ?? '---'}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.destDot]} />
          <Text style={styles.routeLabel} numberOfLines={1}>
            {destName ?? '---'}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.jumpCount}>
          <Text style={styles.jumpNumber}>{route.length}</Text>
          <Text style={styles.jumpUnit}>{STRINGS.routeJumps}</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clear}>
          <Text style={styles.clearText}>x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.surface}f0`,
    borderTopWidth: 1,
    borderTopColor: theme.route,
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
  routeLine: {
    width: 1,
    height: 8,
    backgroundColor: theme.border,
    marginLeft: 2.5,
    marginVertical: 2,
  },
  routeLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
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
});
