import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { getWorkerByUserId } from '../../api/workers';
import { getReceivedReviews } from '../../api/reviews';
import { ReviewOut, WorkerCatalogItem } from '../../types';
import Avatar from '../../components/Avatar';
import StarRating from '../../components/StarRating';
import ErrorMessage from '../../components/ErrorMessage';
import { EmployerCatalogStackParamList } from '../../navigation/EmployerTabs';

type Route = RouteProp<EmployerCatalogStackParamList, 'WorkerDetail'>;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function WorkerDetailScreen(): React.ReactElement {
  const route = useRoute<Route>();
  const { workerId } = route.params;

  const [worker, setWorker] = useState<WorkerCatalogItem | null>(null);
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setError('');
      try {
        const found = await getWorkerByUserId(workerId);
        setWorker(found);
        try {
          const rv = await getReceivedReviews();
          setReviews(rv.filter((r) => r.recipient_id === workerId));
        } catch {
          // reviews not critical
        }
      } catch (e) {
        const err = e as AxiosError;
        setError(!err.response ? 'Нет соединения с сервером' : 'Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workerId]);

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !worker) {
    return <ErrorMessage message={error || 'Мастер не найден'} />;
  }

  return (
    <FlatList
      style={globalStyles.container}
      contentContainerStyle={styles.scroll}
      data={reviews}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Avatar
              firstName={worker.first_name}
              lastName={worker.last_name}
              photoUrl={worker.photo_url}
              size="lg"
            />
            <Text style={styles.name}>{worker.last_name} {worker.first_name}</Text>
            <Text style={styles.profession}>{worker.profession.name}</Text>
            <View style={[globalStyles.row, styles.ratingRow]}>
              <StarRating value={parseFloat(worker.rating_avg)} size={20} />
              <Text style={styles.ratingText}> {worker.rating_avg}</Text>
            </View>
            <Text style={styles.meta}>
              {worker.reviews_count} отзывов · {worker.completed_orders} заказов
            </Text>
            <View style={[styles.onlineRow]}>
              <View style={[styles.onlineDot, { backgroundColor: worker.is_online ? Colors.success : Colors.border }]} />
              <Text style={styles.onlineText}>{worker.is_online ? 'Онлайн' : 'Офлайн'}</Text>
            </View>
            {worker.max_distance_km && (
              <Text style={styles.distance}>Работает до {worker.max_distance_km} км</Text>
            )}
            {worker.about ? <Text style={styles.about}>{worker.about}</Text> : null}
          </View>

          <Text style={styles.reviewsTitle}>Отзывы</Text>
          {reviews.length === 0 && (
            <Text style={styles.noReviews}>Отзывов пока нет</Text>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={[globalStyles.card, styles.reviewCard]}>
          <StarRating value={item.rating} />
          {item.text ? <Text style={styles.reviewText}>{item.text}</Text> : null}
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  profession: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
  },
  ratingRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  distance: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
  },
  about: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  noReviews: {
    color: Colors.textMuted,
    fontSize: 14,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  reviewCard: { marginTop: 4 },
  reviewText: { fontSize: 14, color: Colors.textPrimary, marginTop: 6, lineHeight: 20 },
  reviewDate: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
});
