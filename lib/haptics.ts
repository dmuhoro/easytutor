import { Platform } from 'react-native';

/**
 * Platform-safe Haptics wrapper for EasyTutor.
 * Prevents crashes on web by providing no-op fallbacks.
 */

export const impactAsync = async (style: string = 'light') => {
  if (Platform.OS === 'web') return;

  try {
    const Haptics = await import('expo-haptics');
    
    let impactStyle;
    switch (style.toLowerCase()) {
      case 'heavy':
        impactStyle = Haptics.ImpactFeedbackStyle.Heavy;
        break;
      case 'medium':
        impactStyle = Haptics.ImpactFeedbackStyle.Medium;
        break;
      case 'light':
      default:
        impactStyle = Haptics.ImpactFeedbackStyle.Light;
        break;
    }
    
    await Haptics.impactAsync(impactStyle);
  } catch (error) {
    // Fail silently to prevent app crashes from haptics
    if (__DEV__) {
      console.warn('Haptics failed:', error);
    }
  }
};

export const notificationAsync = async (type: string = 'success') => {
  if (Platform.OS === 'web') return;

  try {
    const Haptics = await import('expo-haptics');
    
    let notificationType;
    switch (type.toLowerCase()) {
      case 'error':
        notificationType = Haptics.NotificationFeedbackType.Error;
        break;
      case 'warning':
        notificationType = Haptics.NotificationFeedbackType.Warning;
        break;
      case 'success':
      default:
        notificationType = Haptics.NotificationFeedbackType.Success;
        break;
    }
    
    await Haptics.notificationAsync(notificationType);
  } catch (error) {
    if (__DEV__) {
      console.warn('Haptics notification failed:', error);
    }
  }
};

export const selectionAsync = async () => {
  if (Platform.OS === 'web') return;

  try {
    const Haptics = await import('expo-haptics');
    await Haptics.selectionAsync();
  } catch (error) {
    if (__DEV__) {
      console.warn('Haptics selection failed:', error);
    }
  }
};
