import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import SharedMap from '../../components/SharedMap';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, globalStyles } from '../../theme';
import { getMyWorkerProfile, setLineStatus } from '../../api/workers';
import { updateLocation } from '../../api/auth';
import { getMyOrders } from '../../api/orders';
import { getPendingOffers, respondToOffer } from '../../api/offers';
import { WorkerProfileOut, OrderSummary, PendingOfferForWorker } from '../../types';
import { AxiosError } from 'axios';
import { showAlert } from '../../utils/alert';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import ErrorMessage from '../../components/ErrorMessage';
import { WorkerHomeStackParamList } from '../../navigation/WorkerTabs';

type Nav = NativeStackNavigationProp<WorkerHomeStackParamList, 'WorkerHome'>;

export default function WorkerHomeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<WorkerProfileOut | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<OrderSummary | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workerLat, setWorkerLat] = useState<number | null>(null);
  const [workerLng, setWorkerLng] = useState<number | null>(null);

  const [pendingOffer, setPendingOffer] = useState<PendingOfferForWorker | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [respondingOffer, setRespondingOffer] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const p = await getMyWorkerProfile();
      setProfile(p);
      setHasProfile(true);
      setIsOnline(p.is_online);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 404) {
        setHasProfile(false);
      } else {
        setError('Не удалось загрузить профиль');
      }
    }
    try {
      const orders = await getMyOrders('assigned');
      setCurrentOrder(orders.length > 0 ? orders[0] : null);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    async function pollOffers() {
      try {
        const offers = await getPendingOffers();
        if (offers.length > 0 && !showOfferModal) {
          setPendingOffer(offers[0]);
          setShowOfferModal(true);
        }
      } catch {
        // silent
      }
    }

    intervalRef.current = setInterval(pollOffers, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showOfferModal]);

  async function handleToggleOnline(value: boolean) {
    setToggling(true);
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Нет доступа к геолокации', 'Разрешите доступ в настройках');
          setToggling(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;
        await updateLocation(latitude, longitude);
        setWorkerLat(latitude);
        setWorkerLng(longitude);
      }
      const updated = await setLineStatus(value);
      setIsOnline(updated.is_online);
    } catch {
      showAlert('Ошибка', 'Не удалось изменить статус');
    } finally {
      setToggling(false);
    }
  }

  async function handleRespondOffer(accept: boolean) {
    if (!pendingOffer) return;
    setRespondingOffer(true);
    try {
      await respondToOffer(pendingOffer.offer.id, accept);
      setShowOfferModal(false);
      setPendingOffer(null);
      await loadData();
    } catch (e) {
      const err = e as AxiosError<{ detail: string }>;
      const status = err.response?.status;
      let msg = 'Не удалось ответить на предложение';
      if (status === 409) {
        const detail = err.response?.data?.detail ?? '';
        if (detail) {
          msg = detail;
        } else {
          msg = 'Предложение уже недоступно (возможно, вы уже приняли другой заказ или предложение истекло)';
        }
      } else if (!err.response) {
        msg = 'Нет соединения с сервером';
      }
      // Close modal and reload to refresh state regardless
      setShowOfferModal(false);
      setPendingOffer(null);
      await loadData();
      showAlert('Ошибка', msg);
    } finally {
      setRespondingOffer(false);
    }
  }

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={globalStyles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Avatar firstName={user?.first_name ?? ''} lastName={user?.last_name ?? ''} photoUrl={user?.photo_url} size="md" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user?.last_name} {user?.first_name}</Text>
            <Text style={styles.balance}>Баланс: {user?.balance} ₽</Text>
          </View>
        </View>

        {error ? <ErrorMessage message={error} onRetry={loadData} /> : null}

        {!hasProfile ? (
          <View style={[globalStyles.card, styles.noprofileCard]}>
            <Text style={styles.noprofileText}>Создайте профиль исполнителя, чтобы получать заказы</Text>
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary, styles.mt12]}
              onPress={() => navigation.navigate('WorkerHome')}
            >
              <Text style={globalStyles.buttonText}>Перейти в профиль</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Статус</Text>
            <View style={[globalStyles.spaceBetween, styles.switchRow]}>
              <View>
                <Text style={styles.switchLabel}>{isOnline ? 'На линии' : 'Не на линии'}</Text>
                {profile && (
                  <Text style={styles.professionName}>{profile.profession.name}</Text>
                )}
              </View>
              {toggling ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Switch
                  value={isOnline}
                  onValueChange={handleToggleOnline}
                  trackColor={{ true: Colors.success }}
                  thumbColor={Colors.surface}
                />
              )}
            </View>
          </View>
        )}

        {isOnline && workerLat && workerLng && (
          <View style={[globalStyles.card, styles.mapCard]}>
            <Text style={styles.sectionLabel}>Моя позиция</Text>
            <SharedMap
              latitude={workerLat}
              longitude={workerLng}
              markerLat={workerLat}
              markerLng={workerLng}
              style={styles.map}
            />
          </View>
        )}

        {currentOrder && (
          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Активный заказ</Text>
            <Text style={styles.orderTitle}>{currentOrder.title}</Text>
            <Text style={styles.orderAddress}>{currentOrder.address}</Text>
            <Text style={styles.orderPrice}>{currentOrder.total_price} ₽</Text>
            <View style={[globalStyles.row, styles.mt12]}>
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.buttonSuccess, styles.flex1]}
                onPress={() => navigation.navigate('WorkerOrderDetail', { orderId: currentOrder.id })}
              >
                <Text style={globalStyles.buttonText}>Детали</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, styles.chatBtn, styles.flex1, styles.ml8]}
                onPress={() => navigation.navigate('WorkerChat', { orderId: currentOrder.id })}
              >
                <Text style={styles.chatBtnText}>Написать</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!currentOrder && isOnline && (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingText}>Ожидаем заказы...</Text>
            <ActivityIndicator color={Colors.primary} style={styles.waitingIndicator} />
          </View>
        )}
      </ScrollView>

      <Modal visible={showOfferModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новый заказ!</Text>
            {pendingOffer && (
              <>
                <Text style={styles.offerOrderTitle}>{pendingOffer.order.title}</Text>
                <Text style={styles.offerAddress}>{pendingOffer.order.address}</Text>
                <Text style={styles.offerPrice}>{pendingOffer.order.total_price} ₽</Text>
                <Text style={styles.offerHours}>{pendingOffer.order.hours} ч · {pendingOffer.order.hourly_rate} ₽/ч</Text>
                <View style={[globalStyles.row, styles.mt16]}>
                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonSuccess, styles.flex1]}
                    onPress={() => handleRespondOffer(true)}
                    disabled={respondingOffer}
                  >
                    <Text style={globalStyles.buttonText}>Принять</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonDanger, styles.flex1, styles.ml8]}
                    onPress={() => handleRespondOffer(false)}
                    disabled={respondingOffer}
                  >
                    <Text style={globalStyles.buttonText}>Отклонить</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  balance: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  switchRow: { gap: 12 },
  switchLabel: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  professionName: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  mapCard: { padding: 0, overflow: 'hidden' },
  map: { height: 180 },
  mapLink: { padding: 16, color: Colors.primary, fontSize: 14 },
  noprofileCard: { alignItems: 'center' },
  noprofileText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  ml8: { marginLeft: 8 },
  flex1: { flex: 1 },
  orderTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  orderAddress: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  orderPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  chatBtn: { borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.surface },
  chatBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
  waitingCard: { margin: 16, padding: 24, backgroundColor: Colors.surface, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  waitingText: { fontSize: 16, color: Colors.textMuted },
  waitingIndicator: { marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: 16 },
  offerOrderTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  offerAddress: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  offerPrice: { fontSize: 24, fontWeight: '800', color: Colors.success, marginBottom: 2 },
  offerHours: { fontSize: 13, color: Colors.textMuted },
});
