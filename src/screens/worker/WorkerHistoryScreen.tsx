import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, globalStyles } from '../../theme';
import { getMyOrders } from '../../api/orders';
import { OrderSummary } from '../../types';
import ErrorMessage from '../../components/ErrorMessage';
import { WorkerHistoryStackParamList } from '../../navigation/WorkerTabs';

type Nav = NativeStackNavigationProp<WorkerHistoryStackParamList, 'WorkerHistory'>;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function WorkerHistoryScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [completedOrders, setCompletedOrders] = useState<OrderSummary[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<OrderSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'completed' | 'cancelled'>('completed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [completed, cancelled] = await Promise.all([
        getMyOrders('completed'),
        getMyOrders('cancelled'),
      ]);
      setCompletedOrders(completed);
      setCancelledOrders(cancelled);
    } catch {
      setError('Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={load} />;
  }

  const displayOrders = activeTab === 'completed' ? completedOrders : cancelledOrders;

  return (
    <View style={globalStyles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Завершённые ({completedOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Отменённые ({cancelledOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={displayOrders.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Заказов нет</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={globalStyles.card}
            onPress={() => navigation.navigate('WorkerOrderDetail', { orderId: item.id })}
          >
            <Text style={styles.orderTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.orderAddress} numberOfLines={1}>{item.address}</Text>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.orderEarned}>
                {activeTab === 'completed' ? `Заработано: ~${(parseFloat(item.total_price) * 0.9).toFixed(0)} ₽` : ''}
              </Text>
              <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { paddingBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  orderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  orderAddress: { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  orderEarned: { fontSize: 14, fontWeight: '600', color: Colors.success },
  orderDate: { fontSize: 12, color: Colors.textMuted },
});
