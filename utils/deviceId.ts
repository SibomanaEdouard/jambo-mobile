import { Platform, Dimensions } from 'react-native';
import Constants from 'expo-constants';

export const generateDeviceId = (): string => {
  const { width, height } = Dimensions.get('window');
  const platform = Platform.OS;
  
  const appId = Constants.expoConfig?.name || 'credit-jambo-mobile';
  const deviceInfo = `${platform}-${width}x${height}`;
  return `mobile-${appId}-${deviceInfo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};