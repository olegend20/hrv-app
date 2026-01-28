import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: 'hrv_user_profile',
  HRV_READINGS: 'hrv_readings',
  HABIT_ENTRIES: 'hrv_habit_entries',
  ACHIEVEMENTS: 'hrv_achievements',
} as const;

export async function saveToStorage<T>(key: string, data: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving to storage [${key}]:`, error);
    throw error;
  }
}

export async function loadFromStorage<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error loading from storage [${key}]:`, error);
    return null;
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from storage [${key}]:`, error);
    throw error;
  }
}

export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

export { STORAGE_KEYS };
