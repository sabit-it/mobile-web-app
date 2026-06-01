import React, { useState } from 'react';
import {
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
import { Colors, globalStyles } from '../theme';
import { login } from '../api/auth';
import { getMe } from '../api/auth';
import { setTokens } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/AuthStack';

interface FormData {
  email: string;
  password: string;
}

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { dispatch } = useAuth();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { email: '', password: '' } });

  async function onSubmit(data: FormData) {
    setServerError('');
    setIsSubmitting(true);
    try {
      const tokens = await login(data.email, data.password);
      await setTokens(tokens.access_token, tokens.refresh_token);
      const user = await getMe();
      dispatch({ type: 'LOGIN', payload: user });
    } catch (e) {
      const err = e as AxiosError;
      if (err.response?.status === 401) {
        setServerError('Неверный email или пароль');
      } else {
        setServerError('Ошибка соединения с сервером');
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
        <Text style={styles.title}>Подработка</Text>
        <Text style={styles.subtitle}>Войдите в аккаунт</Text>

        <View style={styles.form}>
          <Text style={globalStyles.label}>Email</Text>
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
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                nativeID="login-email"
                autoComplete="email"
              />
            )}
          />
          {errors.email && <Text style={globalStyles.errorText}>{errors.email.message}</Text>}

          <Text style={[globalStyles.label, styles.fieldGap]}>Пароль</Text>
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Введите пароль' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[globalStyles.input, errors.password && globalStyles.inputError]}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                nativeID="login-password"
                autoComplete="current-password"
              />
            )}
          />
          {errors.password && <Text style={globalStyles.errorText}>{errors.password.message}</Text>}

          {serverError !== '' && (
            <Text style={[globalStyles.errorText, styles.serverError]}>{serverError}</Text>
          )}

          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, styles.submitBtn]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={globalStyles.buttonText}>
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.link}
          >
            <Text style={styles.linkText}>Нет аккаунта? Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 4,
  },
  fieldGap: {
    marginTop: 16,
  },
  serverError: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 24,
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
