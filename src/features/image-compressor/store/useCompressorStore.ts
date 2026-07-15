import { create } from 'zustand';

interface CompressorState {
  originalFile: File | null;
  compressedFile: File | null;
  isModalOpen: boolean;
  
  // Configurações
  quality: number;
  isAutoMode: boolean; // Novo: Define se o algoritmo controla a qualidade
  
  // Métricas Avançadas
  ssim: number | null;
  compressionTimeMs: number | null;
  codecUsed: string | null;
  
  // Ações
  setOriginalFile: (file: File) => void;
  setCompressedFile: (file: File, ssim?: number, timeMs?: number, codec?: string) => void;
  setQuality: (val: number) => void;
  toggleAutoMode: () => void;
  closeModal: () => void;
}

export const useCompressorStore = create<CompressorState>((set) => ({
  originalFile: null,
  compressedFile: null,
  isModalOpen: false,
  quality: 80,
  isAutoMode: true, // Começamos no modo inteligente por padrão
  ssim: null,
  compressionTimeMs: null,
  codecUsed: null,

  setOriginalFile: (file) => set({ originalFile: file, isModalOpen: true }),
  
  setCompressedFile: (file, ssim, timeMs, codec) => set({ 
    compressedFile: file,
    ...(ssim !== undefined && { ssim }),
    ...(timeMs !== undefined && { compressionTimeMs: timeMs }),
    ...(codec !== undefined && { codecUsed: codec }),
  }),
  
  setQuality: (val) => set({ quality: val, isAutoMode: false }), // Desativa auto se usuário mexer manualmente
  
  toggleAutoMode: () => set((state) => ({ isAutoMode: !state.isAutoMode })),
  
  closeModal: () => set({ 
    isModalOpen: false, 
    originalFile: null, 
    compressedFile: null, 
    quality: 80,
    isAutoMode: true,
    ssim: null,
    compressionTimeMs: null,
    codecUsed: null
  }),
}));