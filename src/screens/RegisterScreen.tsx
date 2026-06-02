import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AxiosError } from 'axios';
import { showAlert } from '../utils/alert';
import { Colors, globalStyles } from '../theme';
import { register, getMe } from '../api/auth';
import { setTokens } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/AuthStack';

interface FormData {
  email: string;
  password: string;
  last_name: string;
  first_name: string;
  patronymic: string;
  phone: string;
}

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { dispatch } = useAuth();
  const [role, setRole] = useState<'employer' | 'worker'>('employer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { email: '', password: '', last_name: '', first_name: '', patronymic: '', phone: '' },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const result = await register({
        email: data.email,
        password: data.password,
        last_name: data.last_name,
        first_name: data.first_name,
        patronymic: data.patronymic || undefined,
        role,
        phone: data.phone || undefined,
      });
      await setTokens(result.access_token, result.refresh_token);
      const user = await getMe();
      dispatch({ type: 'LOGIN', payload: user });
    } catch (e) {
      const err = e as AxiosError<{ detail: string }>;
      if (err.response?.status === 409) {
        showAlert('Ошибка', 'Пользователь с таким email уже существует');
      } else {
        showAlert('Ошибка', 'Не удалось зарегистрироваться. Проверьте данные.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <Text style={styles.heroEmoji}>✨</Text>
        <Text style={styles.heroTitle}>Регистрация</Text>
        <Text style={styles.heroSub}>Создайте аккаунт бесплатно</Text>
      </View>

      <Animated.ScrollView
        style={[styles.card, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <View style={styles.form}>
          <Text style={globalStyles.label}>Роль</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segment, role === 'employer' && styles.segmentActive]}
              onPress={() => setRole('employer')}
            >
              <Text style={[styles.segmentText, role === 'employer' && styles.segmentTextActive]}>
                Заказчик
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, role === 'worker' && styles.segmentActive]}
              onPress={() => setRole('worker')}
            >
              <Text style={[styles.segmentText, role === 'worker' && styles.segmentTextActive]}>
                Исполнитель
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[globalStyles.label, styles.fieldGap]}>Фамилия *</Text>
          <Controller
            control={control}
            name="last_name"
            rules={{ required: 'Введите фамилию' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.last_name && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Иванов"
                placeholderTextColor={Colors.textMuted}
                nativeID="register-last-name"
                autoComplete="family-name"
              />
            )}
          />
          {errors.last_name && <Text style={globalStyles.errorText}>{errors.last_name.message}</Text>}

          <Text style={[globalStyles.label, styles.fieldGap]}>Имя *</Text>
          <Controller
            control={control}
            name="first_name"
            rules={{ required: 'Введите имя' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.first_name && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Иван"
                placeholderTextColor={Colors.textMuted}
                nativeID="register-first-name"
                autoComplete="given-name"
              />
            )}
          />
          {errors.first_name && <Text style={globalStyles.errorText}>{errors.first_name.message}</Text>}

          <Text style={[globalStyles.label, styles.fieldGap]}>Отчество</Text>
          <Controller
            control={control}
            name="patronymic"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={globalStyles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Иванович (необязательно)"
                placeholderTextColor={Colors.textMuted}
                nativeID="register-patronymic"
              />
            )}
          />

          <Text style={[globalStyles.label, styles.fieldGap]}>Email *</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Введите email',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Некорректный email' },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.email && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                nativeID="register-email"
                autoComplete="email"
              />
            )}
          />
          {errors.email && <Text style={globalStyles.errorText}>{errors.email.message}</Text>}

          <Text style={[globalStyles.label, styles.fieldGap]}>Пароль *</Text>
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Введите пароль', minLength: { value: 8, message: 'Минимум 8 символов' } }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.password && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                placeholder="Минимум 8 символов"
                placeholderTextColor={Colors.textMuted}
                nativeID="register-password"
                autoComplete="new-password"
              />
            )}
          />
          {errors.password && <Text style={globalStyles.errorText}>{errors.password.message}</Text>}

          <Text style={[globalStyles.label, styles.fieldGap]}>Телефон</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={globalStyles.input}
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                placeholder="+7 (999) 123-45-67"
                placeholderTextColor={Colors.textMuted}
                nativeID="register-phone"
                autoComplete="tel"
              />
            )}
          />

          <TouchableOpacity
            style={[styles.btn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkMuted}>Уже есть аккаунт? </Text>
            <Text style={styles.linkAccent}>Войти</Text>
          </TouchableOpacity>
        </View>
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  hero: {
    paddingTop: 44,
    paddingBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: -20,
  },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  card: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scroll: { padding: 24, paddingBottom: 40 },
  form: { gap: 4 },
  fieldGap: { marginTop: 14 },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  segmentTextActive: { color: '#fff' },
  btn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 16, flexDirection: 'row', justifyContent: 'center' },
  linkMuted: { color: Colors.textMuted, fontSize: 14 },
  linkAccent: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
