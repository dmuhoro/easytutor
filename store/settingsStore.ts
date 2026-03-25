import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  useLocalLLM: boolean;
  setUseLocalLLM: (val: boolean) => void;
  ollamaUrl: string;
  setOllamaUrl: (val: string) => void;
  ollamaModel: string;
  setOllamaModel: (val: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      useLocalLLM: false,
      setUseLocalLLM: (val) => set({ useLocalLLM: val }),
      ollamaUrl: 'http://localhost:11434',
      setOllamaUrl: (val) => set({ ollamaUrl: val }),
      ollamaModel: 'llama3.2',
      setOllamaModel: (val) => set({ ollamaModel: val }),
    }),
    {
      name: 'easytutor-settings-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
