import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(800 - delay),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.dot, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
    }]} />
  );
}

export default function SplashScreen(): React.ReactElement {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.emoji}>💼</Text>
        </Animated.View>
        <Text style={styles.logo}>Подработка</Text>
        <Text style={styles.tagline}>Найдите работу рядом</Text>
      </Animated.View>

      <Animated.View style={[styles.dots, { opacity: fadeAnim }]}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 60,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 180,
    right: 30,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: { fontSize: 44 },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 56,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
