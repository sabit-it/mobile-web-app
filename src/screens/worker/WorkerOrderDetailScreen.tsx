import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import SharedMap from '../../components/SharedMap';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { getOrder, completeOrder } from '../../api/orders';
import { confirmAlert, showAlert } from '../../utils/alert';
import { createReview, getOrderReviews } from '../../api/reviews';
import { OrderParticipantView, ReviewOut } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { WorkerHomeStackParamList } from '../../navigation/WorkerTabs';

type Nav = NativeStackNavigationProp<WorkerHomeStackParamList, 'WorkerOrderDetail'>;
type Route = RouteProp<WorkerHomeStackParamList, 'WorkerOrderDetail'>;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, bold && infoStyles.bold]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14, color: Colors.textMuted },
  value: { fontSize: 14, color: Colors.textPrimary },
  bold: { fontWeight: '700' },
});

export default function WorkerOrderDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { user } = useAuth();

  const [orderView, setOrderView] = useState<OrderParticipantView | null>(null);
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setError('');
    try {
      const data = await getOrder(orderId);
      setOrderView(data);
      if (data.order.status === 'completed') {
        const rv = await getOrderReviews(orderId);
        setReviews(rv);
      }
    } catch (e) {
      if (!silent) {
        const err = e as AxiosError;
        setError(!err.response ? 'Нет соединения с сервером' : 'Не удалось загрузить заказ');
      }
    }
  }, [orderId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Poll worker location every 5 s while assigned
  useEffect(() => {
    if (orderView?.order.status !== 'assigned') return;
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, [orderView?.order.status, load]);

  function handleComplete() {
    confirmAlert('Завершить заказ', 'Подтвердить завершение?', async () => {
      setActionLoading(true);
      try {
        await completeOrder(orderId);
        await load();
      } catch {
        showAlert('Ошибка', 'Не удалось завершить заказ');
      } finally {
        setActionLoading(false);
      }
    }, 'Завершить');
  }

  async function submitReview() {
    setSubmittingReview(true);
    try {
      await createReview({ order_id: orderId, rating: reviewRating, text: reviewText || undefined });
      setShowReviewModal(false);
      await load();
    } catch {
      showAlert('Ошибка', 'Не удалось отправить отзыв');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !orderView) {
    return <ErrorMessage message={error || 'Заказ не найден'} onRetry={load} />;
  }

  const { order } = orderView;
  const orderLat = parseFloat(order.lat);
  const orderLng = parseFloat(order.lng);
  const hasValidCoords = !isNaN(orderLat) && !isNaN(orderLng);
  const alreadyReviewed = reviews.some((r) => r.author_id === user?.id);

  return (
    <>
      <ScrollView style={globalStyles.container} contentContainerStyle={styles.scroll}>
        <View style={globalStyles.card}>
          <Text style={styles.title}>{order.title}</Text>
          <StatusBadge status={order.status} />
          {order.description ? <Text style={styles.description}>{order.description}</Text> : null}
        </View>

        <View style={globalStyles.card}>
          <Text style={styles.sectionLabel}>Детали</Text>
          <InfoRow label="Адрес" value={order.address} />
          <InfoRow label="Длительность" value={`${order.hours} ч`} />
          <InfoRow label="Ставка" value={`${order.hourly_rate} ₽/ч`} />
          <InfoRow label="Итого" value={`${order.total_price} ₽`} bold />
          {order.scheduled_at && <InfoRow label="Время" value={formatDate(order.scheduled_at)} />}
        </View>

        {hasValidCoords && (() => {
          const wLat = orderView.assigned_worker?.location?.lat ? parseFloat(orderView.assigned_worker.location.lat) : null;
          const wLng = orderView.assigned_worker?.location?.lng ? parseFloat(orderView.assigned_worker.location.lng) : null;
          const hasWorker = wLat != null && wLng != null && !isNaN(wLat) && !isNaN(wLng);
          const isTracking = order.status === 'assigned' && hasWorker;
          const markers = [
            { lat: orderLat, lng: orderLng, type: 'order' as const },
            ...(hasWorker ? [{ lat: wLat!, lng: wLng!, type: 'self' as const }] : []),
          ];
          return (
          <View style={[globalStyles.card, styles.mapCard]}>
            <Text style={styles.sectionLabel}>
              {isTracking ? '📍 Место заказа  🔵 Вы' : 'Место заказа'}
            </Text>
            <SharedMap
              latitude={isTracking ? (orderLat + wLat!) / 2 : orderLat}
              longitude={isTracking ? (orderLng + wLng!) / 2 : orderLng}
              markers={markers}
              style={styles.map}
            />
          </View>
          );
        })()}

        <View style={[globalStyles.card, styles.actionsCard]}>
          {order.status === 'assigned' && (
            <>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSuccess]} onPress={handleComplete}>
                <Text style={globalStyles.buttonText}>Завершить заказ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, styles.chatBtn, styles.mt8]}
                onPress={() => navigation.navigate('WorkerChat', { orderId })}
              >
                <Text style={styles.chatBtnText}>Написать заказчику</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === 'completed' && !alreadyReviewed && (
            <TouchableOpacity
              style={[globalStyles.button, styles.reviewBtn]}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={styles.reviewBtnText}>Оставить отзыв</Text>
            </TouchableOpacity>
          )}
          {order.status === 'completed' && (
            <TouchableOpacity
              style={[globalStyles.button, styles.chatBtn, styles.mt8]}
              onPress={() => navigation.navigate('WorkerChat', { orderId })}
            >
              <Text style={styles.chatBtnText}>Чат заказа</Text>
            </TouchableOpacity>
          )}
        </View>

        {reviews.length > 0 && (
          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Отзывы</Text>
            {reviews.map((r) => (
              <View key={r.id} style={styles.reviewItem}>
                <View style={globalStyles.spaceBetween}>
                  <StarRating value={r.rating} />
                  <Text style={styles.reviewDate}>{formatDate(r.created_at)}</Text>
                </View>
                {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Оставить отзыв</Text>
            <StarRating value={reviewRating} interactive onRate={setReviewRating} size={32} />
            <TextInput
              style={[globalStyles.input, styles.reviewInput]}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              placeholder="Комментарий (необязательно)"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary, styles.mt16]}
              onPress={submitReview}
              disabled={submittingReview}
            >
              <Text style={globalStyles.buttonText}>{submittingReview ? 'Отправка...' : 'Отправить'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowReviewModal(false)}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {actionLoading && <LoadingOverlay />}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  description: { marginTop: 10, fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  mapCard: { padding: 0, overflow: 'hidden' },
  map: { height: 180 },
  mapLink: { padding: 16, color: Colors.primary, fontSize: 14 },
  actionsCard: { gap: 8 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  chatBtn: { borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.surface },
  chatBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
  reviewBtn: { borderWidth: 1, borderColor: Colors.warning, backgroundColor: Colors.warning + '15' },
  reviewBtnText: { color: Colors.warning, fontWeight: '600', fontSize: 16 },
  reviewItem: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 10 },
  reviewText: { fontSize: 14, color: Colors.textPrimary, marginTop: 6 },
  reviewDate: { fontSize: 12, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  reviewInput: { marginTop: 16, height: 100, textAlignVertical: 'top' },
  modalCancel: { marginTop: 12, alignItems: 'center' },
  modalCancelText: { color: Colors.textMuted, fontSize: 15 },
});
