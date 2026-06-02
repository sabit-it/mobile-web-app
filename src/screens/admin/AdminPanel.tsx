import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Панель администратора доступна только в веб-версии</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  text: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', padding: 24 },
});
