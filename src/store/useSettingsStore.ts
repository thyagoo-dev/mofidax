import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  hardwareAcceleration: boolean;
  theme: 'dark' | 'light' | 'system';
  clearOnClose: boolean;
  
  toggleHardwareAcceleration: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleClearOnClose: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hardwareAcceleration: true,
      theme: 'dark',
      clearOnClose: false,

      toggleHardwareAcceleration: () => set((state) => ({ hardwareAcceleration: !state.hardwareAcceleration })),
      setTheme: (theme) => set({ theme }),
      toggleClearOnClose: () => set((state) => ({ clearOnClose: !state.clearOnClose })),
    }),
    {
      name: 'mofidax-settings', // Chave atualizada!
    }
  )
);