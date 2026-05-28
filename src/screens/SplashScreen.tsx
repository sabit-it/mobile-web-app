import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

export default function SplashScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Подработка</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  indicator: {
    marginTop: 32,
  },
});
