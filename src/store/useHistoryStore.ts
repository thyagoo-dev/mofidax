import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  fileName: string;
  // Adicionamos a ação 'Recorte' à nossa tipagem
  action: 'Compressão' | 'Conversão' | 'Redimensionamento' | 'Recorte';
  originalSize: number;
  newSize: number;
  timestamp: number;
  url: string;
  format: string;
}

interface HistoryState {
  items: HistoryItem[];
  addItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [
      { ...item, id: crypto.randomUUID(), timestamp: Date.now() },
      ...state.items
    ]
  })),
  clearHistory: () => set({ items: [] })
}));