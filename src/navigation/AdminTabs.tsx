import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminPanel from '../screens/admin/AdminPanel';

export default function AdminTabs(): React.ReactElement {
  return (
    <View style={styles.root}>
      <AdminPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
