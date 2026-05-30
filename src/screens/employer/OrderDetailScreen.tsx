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
import { getOrder, completeOrder, cancelOrder, repeatOrder } from '../../api/orders';
import { confirmAlert, showAlert } from '../../utils/alert';
import { createReview, getOrderReviews } from '../../api/reviews';
import { OrderParticipantView, ReviewOut } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingOverlay from '../../components/LoadingOverlay';
import { EmployerOrdersStackParamList } from '../../navigation/EmployerTabs';

type Nav = NativeStackNavigationProp<EmployerOrdersStackParamList, 'OrderDetail'>;
type Route = RouteProp<EmployerOrdersStackParamList, 'OrderDetail'>;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;

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

  // Live polling: refresh worker position every 5 s while order is assigned
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

  function handleCancel() {
    confirmAlert('Отменить заказ', 'Вы уверены?', async () => {
      setActionLoading(true);
      try {
        await cancelOrder(orderId);
        await load();
      } catch {
        showAlert('Ошибка', 'Не удалось отменить заказ');
      } finally {
        setActionLoading(false);
      }
    }, 'Отменить');
  }

  async function handleRepeat() {
    setActionLoading(true);
    try {
      const result = await repeatOrder(orderId);
      const msg = result.order.status === 'pending_offer' ? 'Ищем исполнителя...' : 'Исполнители не найдены.';
      showAlert('Заказ создан', msg);
      navigation.replace('OrderDetail', { orderId: result.order.id });
    } catch {
      showAlert('Ошибка', 'Не удалось повторить заказ');
    } finally {
      setActionLoading(false);
    }
  }

  async function submitReview() {
    if (!orderView?.assigned_worker) return;
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

  const { order, assigned_worker } = orderView;
  const orderLat = parseFloat(order.lat);
  const orderLng = parseFloat(order.lng);
  const hasValidCoords = !isNaN(orderLat) && !isNaN(orderLng);
  const alreadyReviewed = reviews.some((r) => r.order_id === orderId);

  return (
    <>
      <ScrollView style={globalStyles.container} contentContainerStyle={styles.scroll}>
        <View style={globalStyles.card}>
          <Text style={styles.title}>{order.title}</Text>
          <StatusBadge status={order.status} />
          {order.description ? <Text style={styles.description}>{order.description}</Text> : null}
        </View>

        {order.status === 'no_workers_available' && (
          <View style={styles.noWorkersBanner}>
            <Text style={styles.noWorkersIcon}>😔</Text>
            <View style={styles.noWorkersText}>
              <Text style={styles.noWorkersTitle}>Исполнители не найдены</Text>
              <Text style={styles.noWorkersBody}>
                К сожалению, ни один исполнитель не принял этот заказ. Вы можете повторить заявку — возможно, в следующий раз найдётся свободный мастер.
              </Text>
            </View>
          </View>
        )}

        <View style={globalStyles.card}>
          <Text style={styles.sectionLabel}>Детали заказа</Text>
          <InfoRow label="Адрес" value={order.address} />
          <InfoRow label="Длительность" value={`${order.hours} ч`} />
          <InfoRow label="Ставка" value={`${order.hourly_rate} ₽/ч`} />
          <InfoRow label="Итого" value={`${order.total_price} ₽`} bold />
          {order.scheduled_at && <InfoRow label="Время" value={formatDate(order.scheduled_at)} />}
        </View>

        {hasValidCoords && (() => {
          const workerLat = assigned_worker?.location?.lat ? parseFloat(assigned_worker.location.lat) : null;
          const workerLng = assigned_worker?.location?.lng ? parseFloat(assigned_worker.location.lng) : null;
          const hasWorkerCoords = workerLat != null && workerLng != null && !isNaN(workerLat) && !isNaN(workerLng);
          const isTracking = order.status === 'assigned' && hasWorkerCoords;

          const markers = [
            { lat: orderLat, lng: orderLng, type: 'order' as const },
            ...(hasWorkerCoords ? [{ lat: workerLat!, lng: workerLng!, type: 'worker' as const }] : []),
          ];

          return (
            <View style={[globalStyles.card, styles.mapCard]}>
              <Text style={styles.sectionLabel}>
                {isTracking ? '📍 Место заказа  👷 Исполнитель' : 'Место заказа'}
              </Text>
              <SharedMap
                latitude={isTracking ? (orderLat + workerLat!) / 2 : orderLat}
                longitude={isTracking ? (orderLng + workerLng!) / 2 : orderLng}
                markers={markers}
                style={styles.map}
              />
            </View>
          );
        })()}

        {assigned_worker && (
          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Исполнитель</Text>
            <View style={[globalStyles.row, styles.workerRow]}>
              <Avatar firstName={assigned_worker.first_name} lastName={assigned_worker.last_name} photoUrl={assigned_worker.photo_url} size="md" />
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{assigned_worker.last_name} {assigned_worker.first_name}</Text>
                <StarRating value={parseFloat(assigned_worker.rating_avg)} />
                <Text style={styles.workerMeta}>{assigned_worker.reviews_count} отзывов · {assigned_worker.completed_orders} заказов</Text>
              </View>
            </View>
            <View style={[globalStyles.row, styles.workerActions]}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonPrimary, styles.workerBtn]}
                onPress={() => navigation.navigate('WorkerDetail', { workerId: assigned_worker.id })}
              >
                <Text style={globalStyles.buttonText}>Профиль</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, styles.chatBtn, styles.workerBtn]}
                onPress={() => navigation.navigate('Chat', { orderId })}
              >
                <Text style={styles.chatBtnText}>Написать</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[globalStyles.card, styles.actionsCard]}>
          {order.status === 'pending_offer' && (
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonDanger]} onPress={handleCancel}>
              <Text style={globalStyles.buttonText}>Отменить заказ</Text>
            </TouchableOpacity>
          )}
          {order.status === 'assigned' && (
            <View style={styles.twoButtons}>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSuccess, styles.flex1]} onPress={handleComplete}>
                <Text style={globalStyles.buttonText}>Завершить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[globalStyles.button, globalStyles.buttonDanger, styles.flex1, styles.ml8]} onPress={handleCancel}>
                <Text style={globalStyles.buttonText}>Отменить</Text>
              </TouchableOpacity>
            </View>
          )}
          {(order.status === 'completed' || order.status === 'no_workers_available') && (
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary]} onPress={handleRepeat}>
              <Text style={globalStyles.buttonText}>Повторить заказ</Text>
            </TouchableOpacity>
          )}
          {order.status === 'completed' && !alreadyReviewed && assigned_worker && (
            <TouchableOpacity
              style={[globalStyles.button, styles.reviewBtn, styles.mt8]}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={styles.reviewBtnText}>Оставить отзыв</Text>
            </TouchableOpacity>
          )}
        </View>

        {reviews.length > 0 && (
          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Отзывы по заказу</Text>
            {reviews.map((r) => (
              <View key={r.id} style={styles.reviewItem}>
                <StarRating value={r.rating} />
                {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
                <Text style={styles.reviewDate}>{formatDate(r.created_at)}</Text>
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
              style={[globalStyles.button, globalStyles.buttonPrimary, styles.modalBtn]}
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

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  description: { marginTop: 10, fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  mapCard: { padding: 0, overflow: 'hidden' },
  mapLink: { padding: 16, color: Colors.primary, fontSize: 14 },
  map: { height: 180 },
  workerRow: { gap: 12, marginBottom: 12 },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  workerMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  workerActions: { gap: 10 },
  workerBtn: { flex: 1 },
  chatBtn: { borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.surface },
  chatBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
  actionsCard: { gap: 8 },
  twoButtons: { flexDirection: 'row' },
  flex1: { flex: 1 },
  ml8: { marginLeft: 8 },
  mt8: { marginTop: 8 },
  noWorkersBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.danger + '12', borderLeftWidth: 4, borderLeftColor: Colors.danger, borderRadius: 10, marginHorizontal: 16, marginBottom: 8, padding: 14 },
  noWorkersIcon: { fontSize: 28, marginRight: 12, marginTop: 2 },
  noWorkersText: { flex: 1 },
  noWorkersTitle: { fontSize: 15, fontWeight: '700', color: Colors.danger, marginBottom: 4 },
  noWorkersBody: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  reviewBtn: { borderWidth: 1, borderColor: Colors.warning, backgroundColor: Colors.warning + '15' },
  reviewBtnText: { color: Colors.warning, fontWeight: '600', fontSize: 16 },
  reviewItem: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 10 },
  reviewText: { fontSize: 14, color: Colors.textPrimary, marginTop: 6 },
  reviewDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  reviewInput: { marginTop: 16, height: 100, textAlignVertical: 'top' },
  modalBtn: { marginTop: 16 },
  modalCancel: { marginTop: 12, alignItems: 'center' },
  modalCancelText: { color: Colors.textMuted, fontSize: 15 },
});
