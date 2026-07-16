import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { useHistoryStore } from '../store/useHistoryStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function PdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfStats, setPdfStats] = useState<{ size: number } | null>(null);

  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: ImageItem[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
    setPdfUrl(null);
    setPdfStats(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true,
  });

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setPdfUrl(null);
    setPdfStats(null);
  };

  const clearAll = () => {
    setImages([]);
    setPdfUrl(null);
    setPdfStats(null);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const doc = new jsPDF({ unit: 'px', compress: true });
      let firstPage = true;

      for (const item of images) {
        const img = await loadImage(item.previewUrl);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Calcula proporção mantendo o aspect ratio dentro da página, com margem
        const margin = 20;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const drawWidth = img.width * ratio;
        const drawHeight = img.height * ratio;
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        if (!firstPage) doc.addPage();
        firstPage = false;

        const format = item.file.type.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(img, format, x, y, drawWidth, drawHeight);
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const fileName = `mofidax_${Date.now()}.pdf`;

      setPdfUrl(url);
      setPdfStats({ size: blob.size });

      addHistoryItem({
        fileName,
        action: 'Imagem para PDF',
        originalSize: images.reduce((acc, img) => acc + img.file.size, 0),
        newSize: blob.size,
        format: 'PDF',
        url,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">

      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-rose-400/10 rounded-xl border border-rose-400/20">
            <FileType2 className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          Imagem para PDF
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Junte várias imagens em um único arquivo PDF, na ordem que quiser.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">

        <div {...getRootProps()} className="focus:outline-none mb-6">
          <input {...getInputProps()} />
          <motion.div
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className={`relative cursor-pointer flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-rose-400 bg-rose-400/5' : 'border-white/10 hover:border-white/20'}`}
          >
            <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-rose-400' : 'text-primary'}`} />
            <h3 className="text-base sm:text-lg font-semibold text-center">
              {images.length === 0 ? 'Arraste imagens para montar seu PDF' : 'Adicionar mais imagens'}
            </h3>
            <p className="text-xs text-secondary mt-1">Você pode soltar várias de uma vez</p>
          </motion.div>
        </div>

        {images.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-secondary">
                {images.length} {images.length === 1 ? 'imagem' : 'imagens'} • arraste para reordenar
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-secondary hover:text-rose-400 transition-colors"
              >
                Limpar tudo
              </button>
            </div>

            <Reorder.Group
              axis="y"
              values={images}
              onReorder={setImages}
              className="space-y-2 mb-6"
            >
              {images.map((item, index) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-xl p-3 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-secondary/50 shrink-0" />
                  <span className="text-xs text-secondary font-mono w-6 shrink-0">{index + 1}</span>
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.file.name}</p>
                    <p className="text-xs text-secondary">{formatBytes(item.file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeImage(item.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-secondary hover:text-rose-400 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {!pdfUrl ? (
              <button
                onClick={handleGeneratePdf}
                disabled={isProcessing}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Gerando PDF...</>
                ) : (
                  <><FileType2 className="w-5 h-5" /> Gerar PDF</>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                  <span>PDF pronto! {images.length} páginas</span>
                  <span className="font-mono font-bold">{formatBytes(pdfStats?.size || 0)}</span>
                </div>
                
                <a
                  href={pdfUrl}
                  download={`mofidax_documento.pdf`}
                  className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Baixar PDF
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}