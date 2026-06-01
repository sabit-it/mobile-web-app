import React, { useState } from 'react';
import {
  Alert,
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
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Регистрация</Text>

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
            style={[globalStyles.button, globalStyles.buttonPrimary, styles.submitBtn]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={globalStyles.buttonText}>
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.link}
          >
            <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 4,
  },
  fieldGap: {
    marginTop: 16,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  segmentTextActive: {
    color: '#fff',
  },
  submitBtn: {
    marginTop: 28,
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
  },
});
