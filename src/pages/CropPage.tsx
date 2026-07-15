import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Scissors, Download, Loader2, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { useHistoryStore } from '../store/useHistoryStore';

const getCroppedImg = async (imageSrc: string, pixelCrop: any, fileType: string): Promise<Blob | null> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => image.onload = resolve);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, fileType, 1);
  });
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function CropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{ size: number, time: number } | null>(null);
  
  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setImageSrc(URL.createObjectURL(selectedFile));
      setCroppedUrl(null);
      setStats(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] },
    maxFiles: 1
  });

  // A correção do TypeScript foi aplicada aqui com o _croppedArea
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !file) return;
    setIsProcessing(true);
    const startTime = performance.now();

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, file.type);
      if (!croppedBlob) throw new Error("Falha ao gerar recorte");

      const extension = file.type.split('/')[1];
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const newFileName = `recortado_${baseName}.${extension}`;
      
      const url = URL.createObjectURL(new File([croppedBlob], newFileName, { type: file.type }));
      const timeTaken = Math.round(performance.now() - startTime);

      setCroppedUrl(url);
      setStats({ size: croppedBlob.size, time: timeTaken });

      addHistoryItem({
        fileName: newFileName,
        action: 'Recorte',
        originalSize: file.size,
        newSize: croppedBlob.size,
        format: extension.toUpperCase(),
        url: url
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-amber-400/10 rounded-xl border border-amber-400/20">
            <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          Cortar Imagem
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Arraste as bordas para reenquadrar a sua fotografia perfeitamente.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
        {!imageSrc ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-amber-400 bg-amber-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-amber-400' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste uma imagem para recortar</h3>
            </motion.div>
          </div>
        ) : !croppedUrl ? (
          <div className="flex flex-col gap-6 w-full">
            
            <div className="relative w-full h-[50vh] bg-black/50 rounded-2xl overflow-hidden border border-white/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={undefined}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-6 bg-black/20 rounded-xl border border-white/5">
              <div className="w-full flex-1 flex items-center gap-4">
                <ZoomIn className="w-5 h-5 text-secondary shrink-0" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <button 
                  onClick={() => { setImageSrc(null); setFile(null); }}
                  className="px-4 py-3 text-sm text-secondary hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCropSave} disabled={isProcessing}
                  className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
                  Cortar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-md h-64 bg-black/50 rounded-2xl border border-white/10 flex items-center justify-center p-4">
              <img src={croppedUrl} alt="Recortada" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
            </div>
            
            <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                <span>Recorte Finalizado</span>
                <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setImageSrc(null); setFile(null); setCroppedUrl(null); }}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-primary rounded-xl font-medium transition-colors"
                >
                  Novo Corte
                </button>
                <a 
                  href={croppedUrl}
                  download={`recortado_${file?.name}`}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Baixar Recorte
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}