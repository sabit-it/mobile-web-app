import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { getMyOrders } from '../../api/orders';
import { OrderStatus, OrderSummary } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import ErrorMessage from '../../components/ErrorMessage';
import { EmployerOrdersStackParamList } from '../../navigation/EmployerTabs';

type Nav = NativeStackNavigationProp<EmployerOrdersStackParamList, 'OrderList'>;

interface FilterItem {
  label: string;
  value: OrderStatus | 'all';
}

const FILTERS: FilterItem[] = [
  { label: 'Все', value: 'all' },
  { label: 'В поиске', value: 'pending_offer' },
  { label: 'Назначен', value: 'assigned' },
  { label: 'Завершён', value: 'completed' },
  { label: 'Отменён', value: 'cancelled' },
  { label: 'Нет мастеров', value: 'no_workers_available' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function OrderListScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const loadOrders = useCallback(async () => {
    setError('');
    try {
      const data = await getMyOrders(selectedStatus === 'all' ? undefined : selectedStatus);
      setOrders(data);
    } catch (e) {
      const err = e as AxiosError;
      if (!err.response) {
        setError('Нет соединения с сервером');
      } else {
        setError('Не удалось загрузить заказы');
      }
    }
  }, [selectedStatus]);

  useEffect(() => {
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  async function onRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  return (
    <View style={[globalStyles.container, styles.root]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, selectedStatus === f.value && styles.filterChipActive]}
            onPress={() => setSelectedStatus(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === f.value && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadOrders} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={orders.length === 0 ? styles.empty : styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Заказов нет</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={globalStyles.card}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
              <View style={globalStyles.spaceBetween}>
                <Text style={styles.orderTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.price}>{item.total_price} ₽</Text>
              </View>
              <View style={[globalStyles.row, styles.badgeRow]}>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateOrder')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  filterBar: {
    maxHeight: 52,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingBottom: 80,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  badgeRow: {
    marginTop: 8,
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
