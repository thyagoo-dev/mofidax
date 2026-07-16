import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Eraser, Download, Loader2, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHistoryStore } from '../store/useHistoryStore';

const WORKER_URL = 'https://mofidax-bg-removal.c-thyago-dev.workers.dev';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function BgRemovePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      setOriginalUrl(URL.createObjectURL(selected));
      setResultUrl(null);
      setStats(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const handleRemoveBackground = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image_file', file);

      const response = await fetch(WORKER_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      const blob = await response.blob();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const newFileName = `sem_fundo_${baseName}.png`;
      const url = URL.createObjectURL(blob);

      setResultUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName: newFileName,
        action: 'Remoção de Fundo',
        originalSize: file.size,
        newSize: blob.size,
        format: 'PNG',
        url,
      });
    } catch (err) {
      console.error(err);
      setError('Não foi possível processar essa imagem. Tente novamente em alguns instantes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setStats(null);
    setError(null);
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">

      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-cyan-400/10 rounded-xl border border-cyan-400/20">
            <Eraser className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </div>
          Remover Fundo
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Remova o fundo da sua imagem com IA de alta qualidade.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">

        {!file ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-cyan-400' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste uma imagem para remover o fundo</h3>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-2 items-center">
                <span className="text-xs text-secondary font-mono">Original</span>
                <div className="w-full aspect-square rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center overflow-hidden">
                  <img src={originalUrl!} alt="Original" className="max-w-full max-h-full object-contain" />
                </div>
              </div>

              <div className="flex flex-col gap-2 items-center">
                <span className="text-xs text-secondary font-mono">Sem fundo</span>
                <div
                  className="w-full aspect-square rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden relative"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  }}
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-3 px-4 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                      <span className="text-xs text-secondary">Processando na nuvem...</span>
                    </div>
                  ) : resultUrl ? (
                    <img src={resultUrl} alt="Sem fundo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-xs text-secondary/50 px-4 text-center">O resultado aparece aqui</span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="w-full text-xs sm:text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-center">
                {error}
              </div>
            )}

            <div className="w-full space-y-3">
              {!resultUrl ? (
                <button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                  ) : (
                    <><Eraser className="w-5 h-5" /> Remover Fundo</>
                  )}
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                    <span>Pronto! Fundo removido</span>
                    <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                  </div>
                  
                  <a
                    href={resultUrl}
                    download={`sem_fundo_${file.name.split('.')[0]}.png`}
                    className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" /> Baixar PNG
                  </a>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full text-xs text-secondary hover:text-primary flex items-center justify-center gap-1.5 py-2"
              >
                <RefreshCcw className="w-3 h-3" /> Trocar imagem
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}