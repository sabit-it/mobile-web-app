import React, { useEffect, useRef, useState } from 'react';
import {
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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <Text style={styles.heroEmoji}>💼</Text>
        <Text style={styles.heroTitle}>Подработка</Text>
        <Text style={styles.heroSub}>Заработок рядом с домом</Text>
      </View>

      {/* Form card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.cardTitle}>Войдите в аккаунт</Text>

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
            style={[styles.btn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{isSubmitting ? 'Вход...' : 'Войти'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>Нет аккаунта? </Text>
            <Text style={[styles.linkText, styles.linkAccent]}>Зарегистрироваться</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  hero: {
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  heroCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -30,
  },
  heroEmoji: { fontSize: 52, marginBottom: 12 },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
  },
  scroll: { padding: 24, paddingBottom: 40 },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  fieldGap: { marginTop: 14 },
  serverError: { textAlign: 'center', marginTop: 8, fontSize: 14 },
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
  link: { marginTop: 18, flexDirection: 'row', justifyContent: 'center' },
  linkText: { color: Colors.textMuted, fontSize: 14 },
  linkAccent: { color: Colors.primary, fontWeight: '600' },
});
