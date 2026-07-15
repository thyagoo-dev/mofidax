import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Maximize, Download, Loader2, Lock, Unlock, RefreshCcw, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHistoryStore } from '../store/useHistoryStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{ size: number, time: number } | null>(null);
  
  const [originalDim, setOriginalDim] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [keepAspect, setKeepAspect] = useState(true);
  
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  const addHistoryItem = useHistoryStore((state) => state.addItem);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setOriginalDim({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
        imageRef.current = img;
      };
      img.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    // Capturamos a imagem atual para uma constante para acalmar o TypeScript
    const currentImg = imageRef.current;
    
    if (!file || !currentImg || !width || !height) {
      setLivePreviewUrl(null);
      return;
    }

    const generatePreview = () => {
      setIsPreviewing(true);
      const canvas = document.createElement('canvas');
      canvas.width = width as number;
      canvas.height = height as number;
      const ctx = canvas.getContext('2d');
      
      // Dupla verificação para segurança de tipos
      if (!ctx || !currentImg) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setLivePreviewUrl(url);
        setIsPreviewing(false);
      }, file.type, 0.90);
    };

    const timeoutId = setTimeout(generatePreview, 300);
    return () => clearTimeout(timeoutId);
  }, [width, height, file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResizedUrl(null); 
      setStats(null);
      setLivePreviewUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] },
    maxFiles: 1
  });

  const handleWidthChange = (val: string) => {
    const newWidth = parseInt(val) || '';
    setWidth(newWidth);
    if (keepAspect && originalDim.width && typeof newWidth === 'number') {
      const ratio = originalDim.height / originalDim.width;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (val: string) => {
    const newHeight = parseInt(val) || '';
    setHeight(newHeight);
    if (keepAspect && originalDim.height && typeof newHeight === 'number') {
      const ratio = originalDim.width / originalDim.height;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  const handleResize = async () => {
    // Capturamos também aqui para evitar o mesmo erro no momento de guardar
    const currentImg = imageRef.current;
    
    if (!file || !currentImg || !width || !height) return;
    setIsProcessing(true);
    const startTime = performance.now();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width as number;
      canvas.height = height as number;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Falha no Canvas");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const extension = file.type.split('/')[1];
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const newFileName = `redimensionado_${baseName}.${extension}`;
        
        const url = URL.createObjectURL(new File([blob], newFileName, { type: file.type }));
        const timeTaken = Math.round(performance.now() - startTime);

        setResizedUrl(url);
        setStats({ size: blob.size, time: timeTaken });

        addHistoryItem({
          fileName: newFileName,
          action: 'Redimensionamento', 
          originalSize: file.size,
          newSize: blob.size,
          format: extension.toUpperCase(),
          url: url
        });

        setIsProcessing(false);
      }, file.type, 1); 

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const resetDimensions = () => {
    setWidth(originalDim.width);
    setHeight(originalDim.height);
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-emerald-400/10 rounded-xl border border-emerald-400/20">
            <Maximize className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          Redimensionar Imagem
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Altere a largura e altura da sua imagem com precisão em pixels.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
        
        {!file ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-emerald-400 bg-emerald-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-emerald-400' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste uma imagem para alterar o tamanho</h3>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start w-full">
            
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center overflow-hidden relative group shadow-inner">
                {isPreviewing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  </div>
                )}
                
                <img 
                  src={livePreviewUrl || URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain p-2 transition-all duration-300" 
                />
                
                <div className="absolute top-2 left-2 right-2 flex justify-center z-20 pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 flex items-center gap-1 shadow-lg">
                    <Eye className="w-3 h-3 text-emerald-400" /> Tempo Real
                  </span>
                </div>

                <button 
                  onClick={() => { setFile(null); setResizedUrl(null); setStats(null); setLivePreviewUrl(null); }}
                  className="absolute inset-0 z-30 bg-black/60 opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center text-sm font-medium transition-opacity"
                >
                  Trocar Imagem
                </button>
              </div>
              <button 
                onClick={() => { setFile(null); setResizedUrl(null); setStats(null); setLivePreviewUrl(null); }}
                className="sm:hidden text-xs text-secondary hover:text-primary underline px-4 py-1"
              >
                Trocar imagem original
              </button>
            </div>

            <div className="flex-1 w-full space-y-5">
              
              <div className="text-center sm:text-left">
                <span className="inline-block text-xs text-secondary font-mono bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg shadow-sm">
                  ORIGINAL: {originalDim.width} x {originalDim.height} px
                </span>
              </div>

              <div className="bg-black/20 p-4 sm:p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Novas Dimensões (px)</label>
                  <button 
                    onClick={() => setKeepAspect(!keepAspect)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${keepAspect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-secondary hover:text-primary'}`}
                  >
                    {keepAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {keepAspect ? 'Proporção Travada' : 'Livre'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-secondary mb-1 block">Largura</label>
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-primary focus:ring-1 focus:ring-emerald-400 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <div className="text-secondary mt-5">x</div>
                  <div className="flex-1">
                    <label className="text-xs text-secondary mb-1 block">Altura</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-primary focus:ring-1 focus:ring-emerald-400 focus:outline-none font-mono text-sm"
                    />
                  </div>
                </div>

                <button onClick={resetDimensions} className="text-xs text-secondary hover:text-primary flex items-center gap-1 mt-2">
                  <RefreshCcw className="w-3 h-3" /> Restaurar tamanho original
                </button>
              </div>

              {!resizedUrl ? (
                <button 
                  onClick={handleResize} disabled={isProcessing || !width || !height}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><Download className="w-5 h-5" /> Aplicar e Baixar</>}
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                    <span>Pronto! {width}x{height} px</span>
                    <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                  </div>
                  <a 
                    href={resizedUrl}
                    download={`redimensionado_${file.name}`}
                    className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" /> Baixar Nova Imagem
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