import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useForm, Controller } from 'react-hook-form';
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { getMyTransactions, getTransactionSummary, withdraw, WithdrawRequest } from '../../api/transactions';
import { TransactionOut, TransactionSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../api/auth';
import { showAlert } from '../../utils/alert';
import ErrorMessage from '../../components/ErrorMessage';

const LIMIT = 20;
const TYPE_LABEL: Record<string, string> = { deposit: 'Пополнение', withdrawal: 'Вывод', order_settlement: 'Заработок за заказ' };
const TYPE_ICON: Record<string, string>  = { deposit: '⬆️', withdrawal: '⬇️', order_settlement: '✅' };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function SummaryCard({ s }: { s: TransactionSummary }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.balLabel}>Текущий баланс</Text>
      <Text style={styles.balValue}>{parseFloat(s.current_balance).toLocaleString('ru-RU')} ₽</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statLbl}>Заработано</Text><Text style={[styles.statVal,{color:'#a5f3c8'}]}>+{parseFloat(s.total_earned).toLocaleString('ru-RU')} ₽</Text></View>
        <View style={styles.div} />
        <View style={styles.stat}><Text style={styles.statLbl}>Выведено</Text><Text style={[styles.statVal,{color:'#fca5a5'}]}>−{parseFloat(s.total_withdrawn).toLocaleString('ru-RU')} ₽</Text></View>
      </View>
    </View>
  );
}

interface WithdrawForm {
  amount: string;
  card_number: string;
  card_holder: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

export default function WorkerFinanceScreen(): React.ReactElement {
  const { dispatch } = useAuth();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [items, setItems]     = useState<TransactionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]     = useState('');
  const [total, setTotal]     = useState(0);
  const [off, setOff]         = useState(0);
  const [showWith, setShowWith] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<WithdrawForm>({
    defaultValues: { amount: '', card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '' },
  });

  const loadData = useCallback(async (resetFlag: boolean) => {
    setError('');
    const o = resetFlag ? 0 : off;
    resetFlag ? setLoading(true) : setLoadingMore(true);
    try {
      const [sum, tx] = await Promise.all([getTransactionSummary(), getMyTransactions(LIMIT, o)]);
      setSummary(sum);
      setItems(resetFlag ? tx.items : prev => [...prev, ...tx.items]);
      setOff(o + LIMIT);
      setTotal(tx.total);
    } catch (e) {
      const err = e as AxiosError;
      setError(!err.response ? 'Нет соединения с сервером' : 'Не удалось загрузить данные');
    } finally { setLoading(false); setLoadingMore(false); }
  }, [off]);

  useEffect(() => { loadData(true); }, []); // eslint-disable-line

  async function onWithdraw(data: WithdrawForm) {
    const amount = parseFloat(data.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) { showAlert('Ошибка', 'Введите корректную сумму'); return; }
    if (!data.card_number.match(/^\d{16,19}$/)) { showAlert('Ошибка', 'Номер карты — 16–19 цифр'); return; }
    if (!data.cvv.match(/^\d{3,4}$/)) { showAlert('Ошибка', 'CVV — 3 или 4 цифры'); return; }

    setWithdrawing(true);
    try {
      const req: WithdrawRequest = {
        amount,
        card_number: data.card_number,
        card_holder: data.card_holder.toUpperCase(),
        expiry_month: parseInt(data.expiry_month, 10),
        expiry_year: parseInt(data.expiry_year, 10),
        cvv: data.cvv,
      };
      const res = await withdraw(req);
      setShowWith(false); reset();
      dispatch({ type: 'UPDATE_USER', payload: await getMe() });
      showAlert('Вывод выполнен', `Выведено: ${res.amount} ₽ на карту *${res.card_last4}\nНовый баланс: ${res.new_balance} ₽`);
      loadData(true);
    } catch (e) {
      const err = e as AxiosError<{ detail: unknown }>;
      const detail = err.response?.data?.detail;
      let msg: string;
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Pydantic 422 — берём msg первой ошибки
        msg = (detail[0] as { msg?: string }).msg ?? 'Ошибка валидации данных';
      } else if (!err.response) {
        msg = 'Нет соединения с сервером';
      } else {
        msg = `Ошибка ${err.response.status}`;
      }
      showAlert('Ошибка вывода', msg);
    } finally { setWithdrawing(false); }
  }

  if (loading) return <View style={[globalStyles.container, styles.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error)   return <ErrorMessage message={error} onRetry={() => loadData(true)} />;

  return (
    <>
      <FlatList
        style={globalStyles.container}
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<>
          {summary && <SummaryCard s={summary} />}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowWith(true)}>
            <Text style={styles.actionTxt}>⬇️  Вывести средства</Text>
          </TouchableOpacity>
          <Text style={styles.histTitle}>История транзакций</Text>
        </>}
        ListEmptyComponent={<Text style={styles.empty}>Транзакций нет</Text>}
        ListFooterComponent={items.length < total ? (
          <TouchableOpacity style={styles.loadMore} onPress={() => loadData(false)} disabled={loadingMore}>
            {loadingMore ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.loadMoreTxt}>Загрузить ещё</Text>}
          </TouchableOpacity>
        ) : null}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <View style={globalStyles.spaceBetween}>
              <View style={styles.typeRow}>
                <Text style={styles.tIcon}>{TYPE_ICON[item.type] ?? '💳'}</Text>
                <Text style={styles.tLabel}>{TYPE_LABEL[item.type] ?? item.type}</Text>
              </View>
              <Text style={[styles.amt,
                item.type === 'order_settlement' || item.type === 'deposit' ? styles.amtPos : styles.amtNeg]}>
                {item.type === 'withdrawal' ? '−' : '+'}{item.worker_amount || item.amount} ₽
              </Text>
            </View>
            {parseFloat(item.commission_amount) > 0 && item.type === 'order_settlement' && (
              <Text style={styles.meta}>Комиссия платформы: {item.commission_amount} ₽</Text>
            )}
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
              <Text style={[styles.badge, item.status === 'completed' ? styles.badgeOk : styles.badgePend]}>
                {item.status === 'completed' ? 'Выполнен' : 'В обработке'}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Withdraw Modal */}
      <Modal visible={showWith} animationType="slide" transparent>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.sheet}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.sheetTitle}>Вывод средств</Text>

                <Text style={globalStyles.label}>Сумма (₽)</Text>
                <Controller control={control} name="amount" rules={{ required: 'Обязательно' }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={[globalStyles.input, styles.mt6, errors.amount && globalStyles.inputError]}
                      value={value} onChangeText={onChange} keyboardType="numeric" placeholder="1000" placeholderTextColor={Colors.textMuted} />
                  )} />
                {errors.amount && <Text style={globalStyles.errorText}>{errors.amount.message}</Text>}

                <Text style={[globalStyles.label, styles.mt12]}>Номер карты</Text>
                <Controller control={control} name="card_number" rules={{ required: 'Обязательно', pattern: { value: /^\d{16,19}$/, message: '16–19 цифр' } }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={[globalStyles.input, styles.mt6, errors.card_number && globalStyles.inputError]}
                      value={value} onChangeText={onChange} keyboardType="numeric" maxLength={19}
                      placeholder="1234 5678 9012 3456" placeholderTextColor={Colors.textMuted} />
                  )} />
                {errors.card_number && <Text style={globalStyles.errorText}>{errors.card_number.message}</Text>}

                <Text style={[globalStyles.label, styles.mt12]}>Имя держателя (латиницей)</Text>
                <Controller control={control} name="card_holder" rules={{ required: 'Обязательно', minLength: { value: 2, message: 'Минимум 2 символа' } }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={[globalStyles.input, styles.mt6, errors.card_holder && globalStyles.inputError]}
                      value={value} onChangeText={v => onChange(v.toUpperCase())} autoCapitalize="characters"
                      placeholder="IVAN IVANOV" placeholderTextColor={Colors.textMuted} />
                  )} />
                {errors.card_holder && <Text style={globalStyles.errorText}>{errors.card_holder.message}</Text>}

                <View style={[globalStyles.row, styles.mt12]}>
                  <View style={{ flex: 1 }}>
                    <Text style={globalStyles.label}>Месяц (1–12)</Text>
                    <Controller control={control} name="expiry_month" rules={{ required: 'Обяз.', min: { value: 1, message: '1–12' }, max: { value: 12, message: '1–12' } }}
                      render={({ field: { onChange, value } }) => (
                        <TextInput style={[globalStyles.input, styles.mt6, errors.expiry_month && globalStyles.inputError]}
                          value={value} onChangeText={onChange} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor={Colors.textMuted} />
                      )} />
                    {errors.expiry_month && <Text style={globalStyles.errorText}>{errors.expiry_month.message}</Text>}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={globalStyles.label}>Год</Text>
                    <Controller control={control} name="expiry_year" rules={{ required: 'Обяз.' }}
                      render={({ field: { onChange, value } }) => (
                        <TextInput style={[globalStyles.input, styles.mt6, errors.expiry_year && globalStyles.inputError]}
                          value={value} onChangeText={onChange} keyboardType="numeric" maxLength={4} placeholder="2028" placeholderTextColor={Colors.textMuted} />
                      )} />
                    {errors.expiry_year && <Text style={globalStyles.errorText}>{errors.expiry_year.message}</Text>}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={globalStyles.label}>CVV</Text>
                    <Controller control={control} name="cvv" rules={{ required: 'Обяз.', pattern: { value: /^\d{3,4}$/, message: '3–4 цифры' } }}
                      render={({ field: { onChange, value } }) => (
                        <TextInput style={[globalStyles.input, styles.mt6, errors.cvv && globalStyles.inputError]}
                          value={value} onChangeText={onChange} keyboardType="numeric" maxLength={4}
                          placeholder="123" placeholderTextColor={Colors.textMuted} secureTextEntry />
                      )} />
                    {errors.cvv && <Text style={globalStyles.errorText}>{errors.cvv.message}</Text>}
                  </View>
                </View>

                <View style={[globalStyles.row, { marginTop: 20 }]}>
                  <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]}
                    onPress={handleSubmit(onWithdraw)} disabled={withdrawing}>
                    <Text style={globalStyles.buttonText}>{withdrawing ? 'Выводим...' : 'Вывести'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary, { flex: 1, marginLeft: 8 }]}
                    onPress={() => { setShowWith(false); reset(); }}>
                    <Text style={globalStyles.buttonTextDark}>Отмена</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 32 },
  summaryCard: { margin: 16, marginBottom: 8, backgroundColor: '#1a7c4f', borderRadius: 16, padding: 20 },
  balLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  balValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statVal: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  div: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },
  actionBtn: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.success + '15', borderWidth: 1.5, borderColor: Colors.success, borderRadius: 12, padding: 14, alignItems: 'center' },
  actionTxt: { fontSize: 16, fontWeight: '700', color: Colors.success },
  histTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 16, marginBottom: 4, marginTop: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tIcon: { fontSize: 18 },
  tLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  amt: { fontSize: 18, fontWeight: '700' },
  amtPos: { color: Colors.success },
  amtNeg: { color: Colors.danger },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  badge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  badgeOk: { backgroundColor: Colors.success + '20', color: Colors.success },
  badgePend: { backgroundColor: Colors.warning + '20', color: Colors.warning },
  empty: { textAlign: 'center', color: Colors.textMuted, fontSize: 15, marginTop: 32 },
  loadMore: { margin: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10 },
  loadMoreTxt: { color: Colors.primary, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'stretch' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  mt6: { marginTop: 6 },
  mt12: { marginTop: 12 },
});
