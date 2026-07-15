import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ArrowRightLeft, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHistoryStore } from '../store/useHistoryStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [stats, setStats] = useState<{ size: number, time: number } | null>(null);
  
  // Conectamos o Zustand aqui para adicionar ao histórico
  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../features/image-compressor/workers/compressionWorker.ts', import.meta.url), 
      { type: 'module' }
    );
    return () => workerRef.current?.terminate();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setConvertedUrl(null); 
      setStats(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] },
    maxFiles: 1
  });

  const handleConvert = () => {
    if (!file || !workerRef.current) return;
    
    setIsProcessing(true);
    
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { success, blob, timeTaken, newType } = e.data;
      if (success && blob) {
        const extension = newType.split('/')[1];
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const newFileName = `convertido_${baseName}.${extension}`;
        
        const url = URL.createObjectURL(new File([blob], newFileName, { type: newType }));
        setConvertedUrl(url);
        setStats({ size: blob.size, time: timeTaken });

        // SALVA NO HISTÓRICO ASSIM QUE TERMINA
        addHistoryItem({
          fileName: newFileName,
          action: 'Conversão',
          originalSize: file.size,
          newSize: blob.size,
          format: extension,
          url: url
        });
      }
      setIsProcessing(false);
    };

    workerRef.current.postMessage({
      file: file,
      quality: 90, 
      isAutoMode: false,
      targetFormat: targetFormat 
    });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-purple-400/10 rounded-xl border border-purple-400/20">
            <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
          Conversor de Formatos
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Transforme suas imagens para WebP, PNG ou JPG instantaneamente.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
        {!file ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-purple-400 bg-purple-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-purple-400' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste uma imagem para converter</h3>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start w-full">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden relative group shadow-inner">
                <img src={URL.createObjectURL(file)} alt="Original" className="max-w-full max-h-full object-contain p-2" />
                <button 
                  onClick={() => { setFile(null); setConvertedUrl(null); setStats(null); }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center text-sm font-medium transition-opacity"
                >
                  Trocar Imagem
                </button>
              </div>
              <button 
                onClick={() => { setFile(null); setConvertedUrl(null); setStats(null); }}
                className="sm:hidden text-xs text-secondary hover:text-primary underline px-4 py-1"
              >
                Trocar imagem original
              </button>
            </div>

            <div className="flex-1 w-full space-y-5">
              <div className="text-center sm:text-left">
                <span className="inline-block text-xs text-secondary font-mono bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg shadow-sm">
                  ORIGINAL: {file.name.split('.').pop()?.toUpperCase()} • {formatBytes(file.size)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 pl-1">Converter para:</label>
                <div className="relative">
                  <select 
                    value={targetFormat}
                    onChange={(e) => { setTargetFormat(e.target.value); setConvertedUrl(null); }}
                    className="w-full bg-background border border-white/10 rounded-xl pl-4 pr-10 py-3.5 text-sm sm:text-base text-primary focus:ring-2 focus:ring-purple-400 focus:outline-none appearance-none shadow-inner"
                  >
                    <option value="image/webp">WebP (Recomendado para Web)</option>
                    <option value="image/jpeg">JPG / JPEG</option>
                    <option value="image/png">PNG (Preserva Fundo Transparente)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {!convertedUrl ? (
                <button 
                  onClick={handleConvert} disabled={isProcessing}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                >
                  {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Convertendo...</> : <><ArrowRightLeft className="w-5 h-5" /> Iniciar Conversão</>}
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400">
                    <span>Finalizado em {stats?.time}ms</span>
                    <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                  </div>
                  <a 
                    href={convertedUrl}
                    download={`convertido_${file.name.split('.')[0]}.${targetFormat.split('/')[1]}`}
                    className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" /> Baixar {targetFormat.split('/')[1].toUpperCase()}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}