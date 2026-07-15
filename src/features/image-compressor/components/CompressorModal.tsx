import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, ChevronsLeftRight, Sparkles, Activity } from 'lucide-react';
import { useCompressorStore } from '../store/useCompressorStore';
import { useHistoryStore } from '../../../store/useHistoryStore'; // Importando nosso histórico global
import { useEffect, useState, useRef } from 'react';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function CompressorModal() {
  const { 
    isModalOpen, 
    originalFile, 
    compressedFile, 
    closeModal, 
    quality, 
    setQuality, 
    setCompressedFile,
    isAutoMode,
    toggleAutoMode,
    ssim,
    compressionTimeMs,
    codecUsed
  } = useCompressorStore();
  
  const addHistoryItem = useHistoryStore((state) => state.addItem); // Conectando a ação de adicionar aos salvos
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  useEffect(() => {
    if (!originalFile) return;

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/compressionWorker.ts', import.meta.url), 
        { type: 'module' }
      );
    }

    const worker = workerRef.current;

    const compressImage = () => {
      setIsCompressing(true);
      
      worker.onmessage = (e: MessageEvent) => {
        const { success, blob, timeTaken, ssim, codec, error, newType } = e.data;
        
        if (success && blob) {
          const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
          const extension = newType === 'image/webp' ? '.webp' : newType === 'image/jpeg' ? '.jpg' : `.${originalFile.name.split('.').pop()}`;
          const newFileName = `flow_${baseName}${extension}`;
          
          const newFile = new File([blob], newFileName, { type: newType });
          setCompressedFile(newFile, ssim, timeTaken, codec);

          if (compressedUrl) URL.revokeObjectURL(compressedUrl);
          const newUrl = URL.createObjectURL(newFile);
          setCompressedUrl(newUrl);

          // SALVA NO HISTÓRICO ASSIM QUE TERMINA A COMPRESSÃO
          addHistoryItem({
            fileName: newFileName,
            action: 'Compressão',
            originalSize: originalFile.size,
            newSize: blob.size,
            format: extension.replace('.', '').toUpperCase(),
            url: newUrl
          });

        } else {
          console.error("Erro no Worker de Compressão:", error);
        }
        
        setIsCompressing(false);
      };

      worker.postMessage({
        file: originalFile,
        quality,
        isAutoMode
      });
    };

    const timeoutId = setTimeout(() => {
      compressImage();
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalFile, quality, isAutoMode, setCompressedFile]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleDownload = () => {
    if (!compressedFile || !compressedUrl) return;
    const link = document.createElement('a');
    link.href = compressedUrl;
    link.download = compressedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateSavings = () => {
    if (!originalFile || !compressedFile) return 0;
    const saving = ((originalFile.size - compressedFile.size) / originalFile.size) * 100;
    return Math.max(0, saving).toFixed(0);
  };

  if (!isModalOpen || !originalFile) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          // Ajustado para ocupar 100vh no celular e ter bordas arredondadas apenas no desktop
          className="relative w-full max-w-[90vw] h-[100dvh] sm:h-[90vh] bg-surface sm:border border-white/10 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              Ajuste de Compressão
              {isAutoMode && <Sparkles className="w-4 h-4 text-emerald-400" />}
            </h2>
            <button onClick={closeModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Lado Direito / Topo no Mobile: Preview Visual */}
            {/* Usamos order-1 no mobile para a imagem aparecer primeiro e order-2 no desktop */}
            <div className="order-1 lg:order-2 flex-1 bg-[#0a0a0a] min-h-[40vh] lg:min-h-0 flex items-center justify-center relative overflow-hidden select-none pattern-checkerboard shrink-0 border-b border-white/10 lg:border-b-0">
              <style>{`
                .pattern-checkerboard {
                  background-image: 
                    linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), 
                    linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), 
                    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%);
                  background-size: 20px 20px;
                  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
              `}</style>

              {previewUrl && compressedUrl ? (
                <div className="relative w-full h-full flex items-center justify-center group p-4">
                  <span className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 py-1 rounded border border-white/10 pointer-events-none opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">Original</span>
                  <span className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 py-1 rounded border border-white/10 pointer-events-none opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">Comprimido</span>

                  <img src={compressedUrl} alt="Comprimida" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none" />
                  <img 
                    src={previewUrl} alt="Original" 
                    className="absolute top-4 left-4 right-4 bottom-4 object-contain rounded-lg shadow-2xl pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  />

                  <input
                    type="range" min="0" max="100" value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 touch-none"
                  />

                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.8)] z-20 pointer-events-none flex items-center justify-center transition-all duration-75"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg">
                      <ChevronsLeftRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                previewUrl && <img src={previewUrl} className="max-w-full max-h-full object-contain p-4 opacity-50 blur-sm animate-pulse" />
              )}
            </div>

            {/* Lado Esquerdo / Base no Mobile: Controles */}
            {/* order-2 no mobile para ficar rolável abaixo da imagem, order-1 no desktop */}
            <div className="order-2 lg:order-1 w-full lg:w-[340px] lg:border-r border-white/10 flex flex-col overflow-y-auto bg-background/50">
              
              <div className="p-4 sm:p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <span className="text-sm font-medium">Modo Perceptual I.A.</span>
                  <button 
                    onClick={toggleAutoMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAutoMode ? 'bg-accent' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-secondary leading-relaxed hidden sm:block">
                  Otimização automática baseada em similaridade visual estrutural (SSIM). Remove metadados e foca na preservação.
                </p>
              </div>

              <div className="p-4 sm:p-6 border-b border-white/5 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary text-sm">Original</span>
                  <span className="font-mono bg-white/5 px-2 py-1 rounded text-sm">
                    {formatBytes(originalFile.size)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary text-sm">Comprimido</span>
                  {isCompressing ? (
                    <span className="flex items-center gap-2 font-mono text-accent bg-accent/10 px-2 py-1 rounded text-sm">
                      <Loader2 className="w-3 h-3 animate-spin" /> ...
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {calculateSavings() !== '0' && (
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                          -{calculateSavings()}%
                        </span>
                      )}
                      <span className="font-mono text-accent bg-accent/10 px-2 py-1 rounded text-sm font-semibold">
                        {compressedFile ? formatBytes(compressedFile.size) : '0 B'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-4 sm:p-6 border-b border-white/5 space-y-3 sm:space-y-4 transition-opacity ${isAutoMode ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Controle Manual</label>
                  <span className="text-sm font-mono text-secondary">{quality}%</span>
                </div>
                <input 
                  type="range" min="1" max="100" value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-accent bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>

              <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 bg-black/20 flex-1">
                <h3 className="text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider mb-2 sm:mb-4 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Métricas Avançadas
                </h3>
                
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">SSIM</span>
                  <span className="font-mono text-emerald-400">
                    {ssim ? `~${ssim.toFixed(3)}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">Motor Codec</span>
                  <span className="font-mono text-primary truncate max-w-[120px] text-right">{codecUsed || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">Tempo</span>
                  <span className="font-mono text-primary">{compressionTimeMs ? `${compressionTimeMs}ms` : '-'}</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 pb-6 sm:pb-6 mt-auto bg-black/20 shrink-0">
                <button 
                  onClick={handleDownload}
                  disabled={isCompressing || !compressedFile}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-medium transition-transform active:scale-[0.98] shadow-lg shadow-accent/20"
                >
                  {isCompressing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Processando...</>
                  ) : (
                    <><Download className="w-5 h-5" />Baixar Imagem</>
                  )}
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}