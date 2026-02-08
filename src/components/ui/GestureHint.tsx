import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/colors';
import { STRINGS } from '../../constants/strings';

type Props = {
  onDismiss: () => void;
};

export const GestureHint = ({ onDismiss }: Props) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [opacity, onDismiss]);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  };

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={dismiss}>
      <Animated.View style={[styles.container, { opacity }]}>
        <Text style={styles.title}>{STRINGS.gestureHintTitle}</Text>
        <View style={styles.hints}>
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>{STRINGS.gestureHintTap}</Text>
          </View>
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>{STRINGS.gestureHintPinch}</Text>
          </View>
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>{STRINGS.gestureHintDrag}</Text>
          </View>
        </View>
        <Text style={styles.dismissText}>{STRINGS.gestureHintDismiss}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: `${theme.surface}ee`,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    maxWidth: 260,
  },
  title: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 16,
  },
  hints: {
    gap: 10,
    marginBottom: 16,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  dismissText: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '300',
    letterSpacing: 1,
  },
});
