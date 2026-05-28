import React, { useState } from 'react';
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
import { AxiosError } from 'axios';
import { Colors, globalStyles } from '../../theme';
import { updateProfile, updateEmail, updatePassword } from '../../api/auth';
import { clearTokens } from '../../api/client';
import { confirmAlert, showAlert } from '../../utils/alert';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function ProfileScreen(): React.ReactElement {
  const { user, dispatch } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [patronymic, setPatronymic] = useState(user?.patronymic ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return <View style={globalStyles.container} />;

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        patronymic: patronymic || null,
        phone: phone || null,
      });
      dispatch({ type: 'UPDATE_USER', payload: updated });
      setEditing(false);
    } catch {
      showAlert('Ошибка', 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEmail() {
    if (!newEmail || !emailPassword) {
      showAlert('Ошибка', 'Заполните все поля');
      return;
    }
    setSavingEmail(true);
    try {
      const updated = await updateEmail(newEmail, emailPassword);
      dispatch({ type: 'UPDATE_USER', payload: updated });
      setShowEmailModal(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (e) {
      const err = e as AxiosError<{ detail: string }>;
      showAlert('Ошибка', err.response?.data?.detail ?? 'Не удалось сменить email');
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword) {
      showAlert('Ошибка', 'Заполните все поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Ошибка', 'Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      showAlert('Ошибка', 'Пароль должен быть не менее 8 символов');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('Готово', 'Пароль успешно изменён');
    } catch (e) {
      const err = e as AxiosError<{ detail: string }>;
      showAlert('Ошибка', err.response?.data?.detail ?? 'Не удалось сменить пароль');
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    confirmAlert('Выход', 'Вы уверены, что хотите выйти?', async () => {
      await clearTokens();
      dispatch({ type: 'LOGOUT' });
    });
  }

  return (
    <>
      <KeyboardAvoidingView
        style={globalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.avatarSection}>
            <Avatar firstName={user.first_name} lastName={user.last_name} photoUrl={user.photo_url} size="lg" />
            <Text style={styles.name}>{user.last_name} {user.first_name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceText}>Баланс: {user.balance} ₽</Text>
            </View>
          </View>

          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Личные данные</Text>
            {editing ? (
              <>
                <Text style={globalStyles.label}>Фамилия</Text>
                <TextInput style={[globalStyles.input, styles.gap4]} value={lastName} onChangeText={setLastName} />
                <Text style={[globalStyles.label, styles.mt12]}>Имя</Text>
                <TextInput style={[globalStyles.input, styles.gap4]} value={firstName} onChangeText={setFirstName} />
                <Text style={[globalStyles.label, styles.mt12]}>Отчество</Text>
                <TextInput style={[globalStyles.input, styles.gap4]} value={patronymic} onChangeText={setPatronymic} placeholder="Необязательно" placeholderTextColor={Colors.textMuted} />
                <Text style={[globalStyles.label, styles.mt12]}>Телефон</Text>
                <TextInput style={[globalStyles.input, styles.gap4]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+7..." placeholderTextColor={Colors.textMuted} />
                <View style={[globalStyles.row, styles.mt16]}>
                  <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.flex1]} onPress={handleSaveProfile} disabled={saving}>
                    <Text style={globalStyles.buttonText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[globalStyles.button, globalStyles.buttonSecondary, styles.flex1, styles.ml8]} onPress={() => setEditing(false)}>
                    <Text style={globalStyles.buttonTextDark}>Отмена</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <ProfileRow label="Фамилия" value={user.last_name} />
                <ProfileRow label="Имя" value={user.first_name} />
                {user.patronymic ? <ProfileRow label="Отчество" value={user.patronymic} /> : null}
                {user.phone ? <ProfileRow label="Телефон" value={user.phone} /> : null}
                <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.mt12]} onPress={() => setEditing(true)}>
                  <Text style={globalStyles.buttonText}>Редактировать</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={globalStyles.card}>
            <Text style={styles.sectionLabel}>Безопасность</Text>
            <TouchableOpacity style={[globalStyles.button, styles.securityBtn]} onPress={() => setShowEmailModal(true)}>
              <Text style={styles.securityBtnText}>Сменить email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.button, styles.securityBtn, styles.mt8]} onPress={() => setShowPasswordModal(true)}>
              <Text style={styles.securityBtnText}>Сменить пароль</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[globalStyles.button, globalStyles.buttonDanger, styles.logoutBtn]} onPress={handleLogout}>
            <Text style={globalStyles.buttonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Сменить email</Text>
            <Text style={globalStyles.label}>Новый email</Text>
            <TextInput style={[globalStyles.input, styles.gap4]} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={[globalStyles.label, styles.mt12]}>Текущий пароль</Text>
            <TextInput style={[globalStyles.input, styles.gap4]} value={emailPassword} onChangeText={setEmailPassword} secureTextEntry />
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.mt16]} onPress={handleSaveEmail} disabled={savingEmail}>
              <Text style={globalStyles.buttonText}>{savingEmail ? 'Сохранение...' : 'Сохранить'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowEmailModal(false)}>
              <Text style={styles.modalCloseText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Сменить пароль</Text>
            <Text style={globalStyles.label}>Текущий пароль</Text>
            <TextInput style={[globalStyles.input, styles.gap4]} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <Text style={[globalStyles.label, styles.mt12]}>Новый пароль</Text>
            <TextInput style={[globalStyles.input, styles.gap4]} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Text style={[globalStyles.label, styles.mt12]}>Подтверждение</Text>
            <TextInput style={[globalStyles.input, styles.gap4]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <TouchableOpacity style={[globalStyles.button, globalStyles.buttonPrimary, styles.mt16]} onPress={handleSavePassword} disabled={savingPassword}>
              <Text style={globalStyles.buttonText}>{savingPassword ? 'Сохранение...' : 'Сохранить'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCloseText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {saving && <LoadingOverlay />}
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={prStyles.row}>
      <Text style={prStyles.label}>{label}</Text>
      <Text style={prStyles.value}>{value}</Text>
    </View>
  );
}

const prStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 14, color: Colors.textMuted },
  value: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  email: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  balanceBadge: { marginTop: 10, backgroundColor: Colors.primary + '15', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  balanceText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt8: { marginTop: 8 },
  gap4: { marginTop: 4 },
  flex1: { flex: 1 },
  ml8: { marginLeft: 8 },
  securityBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  securityBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 },
  logoutBtn: { margin: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  modalClose: { marginTop: 12, alignItems: 'center' },
  modalCloseText: { color: Colors.textMuted, fontSize: 15 },
});
