import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { getMyWorkerProfile, upsertWorkerProfile } from '../../api/workers';
import { listProfessions } from '../../api/professions';
import { updateLocation, updateProfile, updatePassword } from '../../api/auth';
import { clearTokens } from '../../api/client';
import { confirmAlert, showAlert } from '../../utils/alert';
import { WorkerProfileOut, Profession } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function WorkerProfileScreen(): React.ReactElement {
  const { user, dispatch } = useAuth();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileOut | null>(null);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [professionId, setProfessionId] = useState('');
  const [about, setAbout] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingPersonal, setSavingPersonal] = useState(false);

  useEffect(() => {
    async function load() {
      setError('');
      try {
        const [profs] = await Promise.all([listProfessions()]);
        const active = profs.filter((p) => p.is_active);
        setProfessions(active);

        try {
          const profile = await getMyWorkerProfile();
          setWorkerProfile(profile);
          setProfessionId(String(profile.profession.id));
          setAbout(profile.about ?? '');
          setMaxDistance(profile.max_distance_km ? String(profile.max_distance_km) : '');
        } catch (e: unknown) {
          const err = e as { response?: { status?: number } };
          if (err.response?.status !== 404) {
            setError('Не удалось загрузить профиль');
          }
          if (active.length > 0) {
            setProfessionId(String(active[0].id));
          }
        }
      } catch {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    if (!professionId) {
      showAlert('Ошибка', 'Выберите профессию');
      return;
    }
    setSaving(true);
    try {
      const updated = await upsertWorkerProfile({
        profession_id: parseInt(professionId, 10),
        about: about || undefined,
        max_distance_km: maxDistance ? parseFloat(maxDistance) : undefined,
      });
      setWorkerProfile(updated);
      showAlert('Готово', 'Профиль сохранён');
    } catch (e) {
      const err = e as AxiosError<{ detail: string }>;
      showAlert('Ошибка', err.response?.data?.detail ?? 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Нет доступа', 'Разрешите геолокацию в настройках');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await updateLocation(pos.coords.latitude, pos.coords.longitude);
      showAlert('Готово', 'Координаты обновлены');
    } catch {
      showAlert('Ошибка', 'Не удалось обновить координаты');
    }
  }

  async function handleSavePersonal() {
    setSavingPersonal(true);
    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      });
      dispatch({ type: 'UPDATE_USER', payload: updated });
      setEditingPersonal(false);
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить данные');
    } finally {
      setSavingPersonal(false);
    }
  }

  function handleLogout() {
    confirmAlert('Выход', 'Вы уверены?', async () => {
      await clearTokens();
      dispatch({ type: 'LOGOUT' });
    });
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
      <KeyboardAvoidingView
        style={globalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.avatarSection}>
            <Avatar firstName={user?.first_name ?? ''} lastName={user?.last_name ?? ''} photoUrl={user?.photo_url} size="lg" />
            <Text style={styles.name}>{user?.last_name} {user?.first_name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceText}>Баланс: {user?.balance} ₽</Text>
            </View>
            {workerProfile && (
              <Text style={styles.ratingText}>⭐ {workerProfile.rating_avg} · {workerProfile.reviews_count} отзывов · {workerProfile.completed_orders} заказов</Text>
            )}
          </View>

          {error ? <ErrorMessage message={error} /> : null}

          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Профиль исполнителя</Text>
            <Text style={globalStyles.label}>Профессия</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={professionId}
                onValueChange={setProfessionId}
                style={styles.picker}
              >
                {professions.map((p) => (
                  <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                ))}
              </Picker>
            </View>

            <Text style={[globalStyles.label, styles.mt12]}>О себе</Text>
            <TextInput
              style={[globalStyles.input, styles.multiline]}
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={3}
              placeholder="Расскажите о своём опыте..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[globalStyles.label, styles.mt12]}>Макс. расстояние (км)</Text>
            <TextInput
              style={globalStyles.input}
              value={maxDistance}
              onChangeText={setMaxDistance}
              keyboardType="numeric"
              placeholder="Без ограничений"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary, styles.mt16]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              <Text style={globalStyles.buttonText}>{saving ? 'Сохранение...' : 'Сохранить профиль'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.button, styles.geoBtn, styles.mt8]}
              onPress={handleUpdateLocation}
            >
              <Text style={styles.geoBtnText}>📍 Обновить координаты</Text>
            </TouchableOpacity>
          </View>

          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Личные данные</Text>
            {editingPersonal ? (
              <>
                <Text style={globalStyles.label}>Фамилия</Text>
                <TextInput style={[globalStyles.input, styles.mt4]} value={lastName} onChangeText={setLastName} />
                <Text style={[globalStyles.label, styles.mt12]}>Имя</Text>
                <TextInput style={[globalStyles.input, styles.mt4]} value={firstName} onChangeText={setFirstName} />
                <Text style={[globalStyles.label, styles.mt12]}>Телефон</Text>
                <TextInput style={[globalStyles.input, styles.mt4]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <View style={[globalStyles.row, styles.mt16]}>
                  <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.flex1]} onPress={handleSavePersonal} disabled={savingPersonal}>
                    <Text style={globalStyles.buttonText}>{savingPersonal ? 'Сохранение...' : 'Сохранить'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary, styles.flex1, styles.ml8]} onPress={() => setEditingPersonal(false)}>
                    <Text style={globalStyles.buttonTextDark}>Отмена</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity style={[globalStyles.button, styles.editBtn]} onPress={() => setEditingPersonal(true)}>
                <Text style={styles.editBtnText}>Редактировать данные</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={[globalStyles.button, globalStyles.buttonDanger, styles.logoutBtn]} onPress={handleLogout}>
            <Text style={globalStyles.buttonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {saving && <LoadingOverlay />}
    </>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  email: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  balanceBadge: { marginTop: 10, backgroundColor: Colors.primary + '15', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  balanceText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  ratingText: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.surface, overflow: 'hidden' },
  picker: { color: Colors.textPrimary },
  multiline: { height: 80, textAlignVertical: 'top' },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  flex1: { flex: 1 },
  ml8: { marginLeft: 8 },
  geoBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  geoBtnText: { color: Colors.textPrimary, fontWeight: '500', fontSize: 15 },
  editBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  editBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 },
  logoutBtn: { margin: 16 },
});
