import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  fileName: string;
  // Adicionada a ação 'Word para PDF' à lista permitida
  action: 'Compressão' | 'Conversão' | 'Redimensionamento' | 'Recorte' | 'Imagem para PDF' | 'Juntar PDF' | 'Dividir PDF' | 'PDF para Imagem' | 'Remoção de Fundo' | 'PDF para Markdown' | 'Rodar PDF' | 'Organizar PDF' | 'Word para PDF' | 'MP4 para MP3' | 'MP4 para M4A';
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