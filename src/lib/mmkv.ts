import * as SecureStore from 'expo-secure-store';

/**
 * Zustand-persist storage adapter backed by expo-secure-store.
 * Works in Expo Go (no NitroModules required).
 * Values are capped at ~2 KB on Android — fine for small state blobs.
 */
export const mmkvZustandStorage = {
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  getItem: (name: string) => SecureStore.getItemAsync(name),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};
