import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { listWorkers } from '../../api/workers';
import { listProfessions } from '../../api/professions';
import { Profession, WorkerCatalogItem } from '../../types';
import Avatar from '../../components/Avatar';
import StarRating from '../../components/StarRating';
import ErrorMessage from '../../components/ErrorMessage';
import { EmployerCatalogStackParamList } from '../../navigation/EmployerTabs';

type Nav = NativeStackNavigationProp<EmployerCatalogStackParamList, 'WorkerCatalog'>;

const LIMIT = 20;

function formatDistance(m: number | null): string {
  if (m === null) return '';
  if (m < 1000) return `${Math.round(m)} м`;
  return `${(m / 1000).toFixed(1)} км`;
}

export default function WorkerCatalogScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [workers, setWorkers] = useState<WorkerCatalogItem[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const [professionId, setProfessionId] = useState<number | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLng, setUserLng] = useState<number | undefined>(undefined);

  useEffect(() => {
    listProfessions().then((data) => setProfessions(data.filter((p) => p.is_active))).catch(() => {});
  }, []);

  async function load(reset = false) {
    setError('');
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await listWorkers({
        profession_id: professionId,
        is_online: isOnline || undefined,
        min_rating: minRating ? parseFloat(minRating) : undefined,
        lat: userLat,
        lng: userLng,
        max_distance_km: userLat ? 50 : undefined,
        limit: LIMIT,
        offset: currentOffset,
      });
      if (reset) {
        setWorkers(result.items);
        setOffset(LIMIT);
      } else {
        setWorkers((prev) => [...prev, ...result.items]);
        setOffset(currentOffset + LIMIT);
      }
      setTotal(result.total);
    } catch (e) {
      const err = e as AxiosError;
      setError(!err.response ? 'Нет соединения с сервером' : 'Не удалось загрузить мастеров');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(true);
  }, [professionId, isOnline, minRating, userLat, userLng]);

  async function handleNearMe() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
    } catch {
      setError('Не удалось получить геолокацию');
    }
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={professionId ?? 'all'}
              onValueChange={(v) => setProfessionId(v === 'all' ? undefined : Number(v))}
              style={styles.picker}
            >
              <Picker.Item label="Все профессии" value="all" />
              {professions.map((p) => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Онлайн</Text>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          <TextInput
            style={styles.ratingInput}
            value={minRating}
            onChangeText={setMinRating}
            placeholder="Рейтинг ≥"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.nearBtn, userLat ? styles.nearBtnActive : null]}
            onPress={handleNearMe}
          >
            <Text style={[styles.nearBtnText, userLat ? styles.nearBtnTextActive : null]}>
              📍 Рядом со мной
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => load(true)} />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={workers.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Мастера не найдены</Text>}
          ListFooterComponent={
            workers.length < total ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => load(false)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Загрузить ещё</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={globalStyles.card}
              onPress={() => navigation.navigate('WorkerDetail', { workerId: item.user_id })}
            >
              <View style={globalStyles.row}>
                <Avatar firstName={item.first_name} lastName={item.last_name} photoUrl={item.photo_url} size="md" />
                <View style={styles.workerInfo}>
                  <View style={globalStyles.spaceBetween}>
                    <Text style={styles.workerName}>{item.last_name} {item.first_name}</Text>
                    <View style={[styles.onlineDot, { backgroundColor: item.is_online ? Colors.success : Colors.border }]} />
                  </View>
                  <Text style={styles.professionName}>{item.profession.name}</Text>
                  <View style={globalStyles.row}>
                    <StarRating value={parseFloat(item.rating_avg)} size={14} />
                    <Text style={styles.reviewCount}> {item.reviews_count}</Text>
                  </View>
                  {item.distance_meters !== null && (
                    <Text style={styles.distance}>{formatDistance(item.distance_meters)}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  filtersScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    height: 40,
    justifyContent: 'center',
    minWidth: 160,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    color: Colors.textPrimary,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  filterLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    width: 100,
    fontSize: 13,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  nearBtn: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  nearBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  nearBtnText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  nearBtnTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loader: { marginTop: 40 },
  list: { paddingBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  workerInfo: { flex: 1, marginLeft: 12 },
  workerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  professionName: { fontSize: 13, color: Colors.textMuted, marginTop: 2, marginBottom: 4 },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  reviewCount: { fontSize: 12, color: Colors.textMuted },
  distance: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  loadMoreBtn: { margin: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10 },
  loadMoreText: { color: Colors.primary, fontWeight: '600' },
});
