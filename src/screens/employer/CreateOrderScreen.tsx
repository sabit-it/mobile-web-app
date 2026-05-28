import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import SharedMap from '../../components/SharedMap';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { showAlert } from '../../utils/alert';
import { Colors, globalStyles } from '../../theme';
import { listProfessions } from '../../api/professions';
import { createOrder } from '../../api/orders';
import { Profession } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';
import { EmployerOrdersStackParamList } from '../../navigation/EmployerTabs';

type Nav = NativeStackNavigationProp<EmployerOrdersStackParamList, 'CreateOrder'>;

interface FormData {
  profession_id: string;
  title: string;
  description: string;
  hours: string;
  hourly_rate: string;
  address: string;
}

export default function CreateOrderScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      profession_id: '',
      title: '',
      description: '',
      hours: '',
      hourly_rate: '',
      address: '',
    },
  });

  const selectedProfessionId = watch('profession_id');
  const hours = watch('hours');
  const hourlyRate = watch('hourly_rate');
  const total = (parseFloat(hours) || 0) * (parseFloat(hourlyRate) || 0);

  useEffect(() => {
    listProfessions()
      .then((data) => {
        const active = data.filter((p) => p.is_active);
        setProfessions(active);
        if (active.length > 0) {
          setValue('profession_id', String(active[0].id));
          setValue('hourly_rate', active[0].hourly_rate);
        }
      })
      .catch(() => showAlert('Ошибка', 'Не удалось загрузить профессии'));
  }, [setValue]);

  async function detectLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Нет доступа', 'Разрешите геолокацию в настройках');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setShowMap(true);
    } catch {
      showAlert('Ошибка', 'Не удалось определить местоположение');
    }
  }

  function handleMapPress(latitude: number, longitude: number) {
    setLat(latitude);
    setLng(longitude);
  }

  function handleDateChange(_: DateTimePickerEvent, date?: Date) {
    setShowDatePicker(false);
    if (date) setScheduledAt(date);
  }

  function getSelectedProfession(): Profession | undefined {
    return professions.find((p) => String(p.id) === selectedProfessionId);
  }

  async function onSubmit(data: FormData) {
    if (!lat || !lng) {
      showAlert('Укажите местоположение', 'Нажмите «Определить геопозицию» или выберите точку на карте');
      return;
    }
    setIsLoading(true);
    try {
      const result = await createOrder({
        profession_id: parseInt(data.profession_id, 10),
        title: data.title,
        description: data.description || undefined,
        hours: parseFloat(data.hours),
        hourly_rate: parseFloat(data.hourly_rate),
        address: data.address,
        lat,
        lng,
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : undefined,
      });
      const msg = result.order.status === 'pending_offer' ? 'Ищем исполнителя...' : 'Исполнители не найдены.';
      showAlert('Заявка создана!', msg);
      navigation.replace('OrderDetail', { orderId: result.order.id });
    } catch (e) {
      const err = e as AxiosError<{ detail: string }>;
      if (!err.response) {
        showAlert('Ошибка', 'Нет соединения с сервером');
      } else if (err.response.status === 422) {
        showAlert('Ошибка данных', JSON.stringify(err.response.data?.detail));
      } else if (err.response.status === 403) {
        showAlert('Ошибка', 'Недостаточно прав');
      } else {
        showAlert('Ошибка сервера', 'Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        style={globalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={globalStyles.label}>Профессия</Text>
          <View style={styles.pickerWrapper}>
            <Controller
              control={control}
              name="profession_id"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <Picker
                  selectedValue={value}
                  onValueChange={(v) => {
                    onChange(v);
                    const prof = professions.find((p) => String(p.id) === String(v));
                    if (prof) setValue('hourly_rate', prof.hourly_rate);
                  }}
                  style={styles.picker}
                >
                  {professions.map((p) => (
                    <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                  ))}
                </Picker>
              )}
            />
          </View>

          <Text style={[globalStyles.label, styles.gap]}>Название *</Text>
          <Controller
            control={control}
            name="title"
            rules={{ required: 'Введите название', maxLength: { value: 255, message: 'Максимум 255 символов' } }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.title && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Починить кран"
                placeholderTextColor={Colors.textMuted}
              />
            )}
          />
          {errors.title && <Text style={globalStyles.errorText}>{errors.title.message}</Text>}

          <Text style={[globalStyles.label, styles.gap]}>Описание</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, styles.multiline]}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                placeholder="Подробности задания..."
                placeholderTextColor={Colors.textMuted}
              />
            )}
          />

          <View style={[globalStyles.row, styles.gap]}>
            <View style={styles.halfField}>
              <Text style={globalStyles.label}>Часов *</Text>
              <Controller
                control={control}
                name="hours"
                rules={{ required: 'Введите часы', min: { value: 1, message: 'Минимум 1' } }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[globalStyles.input, errors.hours && globalStyles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={Colors.textMuted}
                  />
                )}
              />
              {errors.hours && <Text style={globalStyles.errorText}>{errors.hours.message}</Text>}
            </View>
            <View style={[styles.halfField, styles.halfRight]}>
              <Text style={globalStyles.label}>Ставка ₽/ч *</Text>
              <Controller
                control={control}
                name="hourly_rate"
                rules={{ required: 'Введите ставку', min: { value: 1, message: 'Минимум 1' } }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[globalStyles.input, errors.hourly_rate && globalStyles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder={getSelectedProfession()?.hourly_rate ?? '500'}
                    placeholderTextColor={Colors.textMuted}
                  />
                )}
              />
              {errors.hourly_rate && <Text style={globalStyles.errorText}>{errors.hourly_rate.message}</Text>}
            </View>
          </View>

          {total > 0 && (
            <View style={styles.totalBox}>
              <Text style={styles.totalText}>Итого: {total.toFixed(0)} ₽</Text>
            </View>
          )}

          <Text style={[globalStyles.label, styles.gap]}>Адрес *</Text>
          <Controller
            control={control}
            name="address"
            rules={{ required: 'Введите адрес' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.address && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="ул. Пушкина, д. 10"
                placeholderTextColor={Colors.textMuted}
              />
            )}
          />
          {errors.address && <Text style={globalStyles.errorText}>{errors.address.message}</Text>}

          <TouchableOpacity
            style={[globalStyles.button, styles.geoBtn, styles.gap]}
            onPress={detectLocation}
          >
            <Text style={styles.geoBtnText}>
              {lat && lng ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}` : '📍 Определить геопозицию'}
            </Text>
          </TouchableOpacity>

          {lat && lng && (
            <TouchableOpacity style={styles.mapPreviewBtn} onPress={() => setShowMap(true)}>
              <Text style={styles.mapPreviewText}>Открыть карту</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[globalStyles.button, styles.scheduleBtn, styles.gap]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.scheduleBtnText}>
              {scheduledAt
                ? `🗓 ${scheduledAt.toLocaleString('ru-RU')}`
                : '🗓 Запланировать время'}
            </Text>
          </TouchableOpacity>
          {scheduledAt && (
            <TouchableOpacity onPress={() => setScheduledAt(null)}>
              <Text style={styles.clearDate}>Сбросить время</Text>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={scheduledAt ?? new Date()}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, styles.gap, styles.submitBtn]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={globalStyles.buttonText}>Создать заказ</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showMap} animationType="slide">
        <View style={styles.mapModal}>
          <Text style={styles.mapHint}>Нажмите на карте для выбора точки</Text>
          <SharedMap
            latitude={lat ?? 55.75}
            longitude={lng ?? 37.61}
            markerLat={lat ?? undefined}
            markerLng={lng ?? undefined}
            style={styles.map}
            onMapPress={handleMapPress}
            scrollEnabled
          />
          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, styles.mapConfirm]}
            onPress={() => setShowMap(false)}
          >
            <Text style={globalStyles.buttonText}>Подтвердить</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {isLoading && <LoadingOverlay />}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  gap: {
    marginTop: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  picker: {
    color: Colors.textPrimary,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  halfField: {
    flex: 1,
  },
  halfRight: {
    marginLeft: 12,
  },
  totalBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  geoBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  geoBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  mapPreviewBtn: {
    marginTop: 8,
    alignItems: 'center',
  },
  mapPreviewText: {
    color: Colors.primary,
    fontSize: 13,
  },
  scheduleBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  scheduleBtnText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: 15,
  },
  clearDate: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  submitBtn: {
    marginBottom: 24,
  },
  mapModal: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  mapHint: {
    textAlign: 'center',
    padding: 12,
    fontSize: 14,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  map: {
    flex: 1,
  },
  mapConfirm: {
    margin: 16,
  },
});
