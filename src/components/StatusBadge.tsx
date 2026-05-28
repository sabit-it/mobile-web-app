import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';
import { OrderStatus } from '../types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending_offer: { label: 'В поиске', color: Colors.warning },
  assigned: { label: 'Назначен', color: Colors.primary },
  completed: { label: 'Завершён', color: Colors.success },
  cancelled: { label: 'Отменён', color: Colors.danger },
  no_workers_available: { label: 'Нет мастеров', color: Colors.danger },
};

interface Props {
  status: OrderStatus;
}

export default function StatusBadge({ status }: Props): React.ReactElement {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20', borderColor: config.color }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
