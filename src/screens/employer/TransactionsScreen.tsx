import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { getMyTransactions } from '../../api/transactions';
import { TransactionOut } from '../../types';
import ErrorMessage from '../../components/ErrorMessage';

const LIMIT = 20;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function TransactionsScreen(): React.ReactElement {
  const [items, setItems] = useState<TransactionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  async function load(reset = false) {
    setError('');
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const data = await getMyTransactions(LIMIT, currentOffset);
      if (reset) {
        setItems(data.items);
        setOffset(LIMIT);
      } else {
        setItems((prev) => [...prev, ...data.items]);
        setOffset(currentOffset + LIMIT);
      }
      setTotal(data.total);
    } catch (e) {
      const err = e as AxiosError;
      setError(!err.response ? 'Нет соединения с сервером' : 'Не удалось загрузить транзакции');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { load(true); }, []);

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => load(true)} />;
  }

  return (
    <FlatList
      style={globalStyles.container}
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
      ListEmptyComponent={<Text style={styles.emptyText}>Транзакций нет</Text>}
      ListFooterComponent={
        items.length < total ? (
          <TouchableOpacity style={styles.loadMore} onPress={() => load(false)} disabled={loadingMore}>
            {loadingMore ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.loadMoreText}>Загрузить ещё</Text>
            )}
          </TouchableOpacity>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={globalStyles.card}>
          <View style={globalStyles.spaceBetween}>
            <Text style={styles.amount}>{item.amount} ₽</Text>
            <Text style={[styles.status, item.status === 'completed' ? styles.statusOk : styles.statusPending]}>
              {item.status === 'completed' ? 'Выполнен' : item.status}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.metaLabel}>Комиссия:</Text>
            <Text style={styles.metaValue}>{item.commission_amount} ₽</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.metaLabel}>Получено исполнителем:</Text>
            <Text style={styles.metaValue}>{item.worker_amount} ₽</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  amount: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  status: { fontSize: 13, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusOk: { backgroundColor: Colors.success + '20', color: Colors.success },
  statusPending: { backgroundColor: Colors.warning + '20', color: Colors.warning },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaLabel: { fontSize: 13, color: Colors.textMuted },
  metaValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  loadMore: { margin: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10 },
  loadMoreText: { color: Colors.primary, fontWeight: '600' },
});
