import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, globalStyles } from '../../theme';
import { getReceivedReviews } from '../../api/reviews';
import { getMyWorkerProfile } from '../../api/workers';
import { ReviewOut, WorkerProfileOut } from '../../types';
import StarRating from '../../components/StarRating';
import ErrorMessage from '../../components/ErrorMessage';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function WorkerReviewsScreen(): React.ReactElement {
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [profile, setProfile] = useState<WorkerProfileOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [rv, p] = await Promise.all([
        getReceivedReviews(),
        getMyWorkerProfile(),
      ]);
      setReviews(rv);
      setProfile(p);
    } catch {
      setError('Не удалось загрузить отзывы');
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

  return (
    <FlatList
      style={globalStyles.container}
      data={reviews}
      keyExtractor={(item) => item.id}
      contentContainerStyle={reviews.length === 0 ? styles.empty : styles.list}
      ListHeaderComponent={
        profile ? (
          <View style={styles.header}>
            <Text style={styles.ratingBig}>{profile.rating_avg}</Text>
            <StarRating value={parseFloat(profile.rating_avg)} size={24} />
            <Text style={styles.reviewCount}>{profile.reviews_count} отзывов</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={<Text style={styles.emptyText}>Отзывов пока нет</Text>}
      renderItem={({ item }) => (
        <View style={[globalStyles.card, styles.reviewCard]}>
          <View style={globalStyles.spaceBetween}>
            <StarRating value={item.rating} />
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
          {item.text ? <Text style={styles.reviewText}>{item.text}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  ratingBig: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary },
  reviewCount: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  reviewCard: { marginTop: 4 },
  reviewText: { fontSize: 14, color: Colors.textPrimary, marginTop: 8, lineHeight: 20 },
  date: { fontSize: 12, color: Colors.textMuted },
});
