import { useState } from 'react';
import { useHistoryStore } from '../store/useHistoryStore';
import { Download, Trash2, Clock, ArrowRightLeft, Minimize2, Maximize, Eye, X, Scissors, FileType2, Eraser, Files, FileMinus, FileImage, Hash, RotateCw, ArrowDownUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getActionStyle = (action: string) => {
  switch (action) {
    case 'Conversão': return 'bg-purple-400/10 text-purple-400';
    case 'Redimensionamento': return 'bg-emerald-400/10 text-emerald-400';
    case 'Recorte': return 'bg-amber-400/10 text-amber-400';
    case 'Imagem para PDF': 
    case 'Juntar PDF': 
    case 'Dividir PDF': 
    case 'PDF para Imagem': 
    case 'Rodar PDF': 
    case 'Organizar PDF': return 'bg-rose-400/10 text-rose-400';
    case 'PDF para Markdown': return 'bg-indigo-400/10 text-indigo-400';
    case 'Remoção de Fundo': return 'bg-cyan-400/10 text-cyan-400';
    default: return 'bg-blue-400/10 text-blue-400';
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'Conversão': return <ArrowRightLeft className="w-5 h-5" />;
    case 'Redimensionamento': return <Maximize className="w-5 h-5" />;
    case 'Recorte': return <Scissors className="w-5 h-5" />;
    case 'Imagem para PDF': return <FileType2 className="w-5 h-5" />;
    case 'Juntar PDF': return <Files className="w-5 h-5" />;
    case 'Dividir PDF': return <FileMinus className="w-5 h-5" />;
    case 'PDF para Imagem': return <FileImage className="w-5 h-5" />;
    case 'Rodar PDF': return <RotateCw className="w-5 h-5" />;
    case 'Organizar PDF': return <ArrowDownUp className="w-5 h-5" />; // Ícone
    case 'PDF para Markdown': return <Hash className="w-5 h-5" />;
    case 'Remoção de Fundo': return <Eraser className="w-5 h-5" />;
    default: return <Minimize2 className="w-5 h-5" />;
  }
};

export function SavedPage() {
  const { items, clearHistory } = useHistoryStore();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center sm:text-left">
            Histórico de Sessão
          </h1>
          <p className="text-sm text-secondary mt-1 text-center sm:text-left">
            Recupere ou visualize os ficheiros processados recentemente.
          </p>
        </div>
        
        {items.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center justify-center gap-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-rose-400/20"
          >
            <Trash2 className="w-4 h-4" /> Limpar Histórico
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-secondary bg-surface border border-white/5 rounded-3xl p-10 mt-4">
          <Clock className="w-12 h-12 mb-4 opacity-20" />
          <p>Nenhum ficheiro no cache da sessão.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-surface border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-white/20 transition-colors">
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`p-3 rounded-xl border border-white/5 shrink-0 ${getActionStyle(item.action)}`}>
                  {getActionIcon(item.action)}
                </div>
                
                <div className="overflow-hidden">
                  <h3 className="font-medium text-primary truncate w-full sm:max-w-md" title={item.fileName}>
                    {item.fileName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                    <span className="uppercase font-mono bg-white/5 border border-white/5 px-1.5 py-0.5 rounded shadow-sm">{item.format}</span>
                    <span>{formatBytes(item.originalSize)} ➔ <span className="text-emerald-400 font-medium">{formatBytes(item.newSize)}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                {item.format !== 'ZIP' && item.format !== 'MD' && ( 
                  <button 
                    onClick={() => setPreviewImage(item.url)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-primary px-4 py-2.5 rounded-xl font-medium transition-colors border border-white/5 active:scale-95"
                  >
                    <Eye className="w-4 h-4" /> <span className="sm:hidden">Visualizar</span>
                  </button>
                )}
                <a 
                  href={item.url}
                  download={item.fileName}
                  className="flex-[2] sm:flex-none flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 px-5 py-2.5 rounded-xl font-medium transition-colors active:scale-95"
                >
                  <Download className="w-4 h-4" /> Salvar Cópia
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-background/95 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 max-w-5xl w-full max-h-[85vh] flex items-center justify-center"
            >
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 sm:-right-12 p-2 bg-surface border border-white/10 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-primary" />
              </button>
              
              {previewImage.startsWith('blob:') && previewImage.includes('pdf') ? (
                <iframe src={previewImage} className="w-full h-[80vh] rounded-lg shadow-2xl ring-1 ring-white/10 bg-white" title="PDF Preview" />
              ) : (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}