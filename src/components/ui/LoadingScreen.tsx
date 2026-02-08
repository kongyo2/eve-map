import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';

const { width } = Dimensions.get('window');

type Props = {
  phase: string;
  progress: number;
  errorMessage?: string | null;
  onRetry?: () => void;
};

const phaseLabel = (phase: string): string => {
  switch (phase) {
    case 'cache':
      return STRINGS.loadingFromCache;
    case 'regions':
      return STRINGS.loadingRegions;
    case 'constellations':
      return STRINGS.loadingConstellations;
    case 'systems':
      return STRINGS.loadingSystems;
    case 'connections':
      return STRINGS.loadingConnections;
    default:
      return STRINGS.loadingTitle;
  }
};

export const LoadingScreen = ({ phase, progress, errorMessage, onRetry }: Props) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const scan = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    scan.start();
    glow.start();

    return () => {
      pulse.stop();
      scan.stop();
      glow.stop();
    };
  }, [pulseAnim, scanAnim, glowAnim]);

  const scanRotation = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (errorMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{STRINGS.loadError}</Text>
          <Text style={styles.errorDetail}>{errorMessage}</Text>
          {onRetry && (
            <Text style={styles.retryButton} onPress={onRetry}>
              {STRINGS.retry}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Radar rings */}
      <View style={styles.radarContainer}>
        {[1, 2, 3].map((ring) => (
          <Animated.View
            key={ring}
            style={[
              styles.radarRing,
              {
                width: 60 * ring,
                height: 60 * ring,
                borderRadius: 30 * ring,
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.15, 0.05, 0.15],
                }),
              },
            ]}
          />
        ))}

        {/* Scanning line */}
        <Animated.View style={[styles.scanLine, { transform: [{ rotate: scanRotation }] }]}>
          <View style={styles.scanBeam} />
        </Animated.View>

        {/* Center dot */}
        <Animated.View style={[styles.centerDot, { opacity: glowAnim }]} />
      </View>

      {/* Title */}
      <Animated.Text style={[styles.title, { opacity: glowAnim }]}>
        {STRINGS.loadingTitle}
      </Animated.Text>

      {/* Phase text */}
      <Text style={styles.phaseText}>{phaseLabel(phase)}</Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
          <Animated.View
            style={[
              styles.progressGlow,
              {
                width: `${progress}%`,
                opacity: glowAnim,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  radarContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: theme.accent,
  },
  scanLine: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
  },
  scanBeam: {
    width: 1,
    height: 100,
    backgroundColor: theme.accent,
    opacity: 0.4,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accent,
  },
  title: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '200',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  phaseText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 32,
  },
  progressContainer: {
    width: width - 80,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: theme.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent,
  },
  progressGlow: {
    position: 'absolute',
    height: 4,
    top: -1,
    backgroundColor: theme.accent,
    borderRadius: 2,
  },
  progressText: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '300',
    marginTop: 8,
    letterSpacing: 2,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorIcon: {
    color: theme.error,
    fontSize: 48,
    fontWeight: '100',
    marginBottom: 16,
  },
  errorText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 8,
  },
  errorDetail: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  retryButton: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 2,
  },
});
