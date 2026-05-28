import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog (two buttons: cancel + confirm).
 * On web uses window.confirm; on native uses Alert.alert.
 */
export function confirmAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Подтвердить',
) {
  if (Platform.OS === 'web') {
    // @ts-ignore
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

/**
 * Cross-platform info/error dialog (one OK button).
 * On web uses window.alert; on native uses Alert.alert.
 */
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    // @ts-ignore
    window.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
