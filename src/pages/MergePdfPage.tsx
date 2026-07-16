import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, GripVertical, Files } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { useHistoryStore } from '../store/useHistoryStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface PdfItem {
  id: string;
  file: File;
}

export function MergePdfPage() {
  const [pdfFiles, setPdfFiles] = useState<PdfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  
  // Novo estado para controlar a pré-visualização do PDF
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: PdfItem[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }));
    setPdfFiles((prev) => [...prev, ...newItems]);
    setMergedPdfUrl(null);
    setStats(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const removePdf = (id: string) => {
    setPdfFiles((prev) => prev.filter((item) => item.id !== id));
    setMergedPdfUrl(null);
    setStats(null);
  };

  const clearAll = () => {
    setPdfFiles([]);
    setMergedPdfUrl(null);
    setStats(null);
  };

  // Função para lidar com a reordenação (Invalida o PDF anterior)
  const handleReorder = (newOrder: PdfItem[]) => {
    setPdfFiles(newOrder);
    setMergedPdfUrl(null); // Faz o botão "Juntar" reaparecer
    setStats(null);
  };

  // Funções seguras para abrir e fechar o Preview (Evita memory leak)
  const openPreview = (file: File) => {
    setPreviewPdfUrl(URL.createObjectURL(file));
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleMergePdfs = async () => {
    if (pdfFiles.length < 2) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfFiles) {
        const fileBytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = `mofidax_junto_${Date.now()}.pdf`;

      setMergedPdfUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName,
        action: 'Juntar PDF',
        originalSize: pdfFiles.reduce((acc, item) => acc + item.file.size, 0),
        newSize: blob.size,
        format: 'PDF',
        url,
      });

    } catch (error) {
      console.error("Erro ao juntar PDFs:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-rose-400/10 rounded-xl border border-rose-400/20">
            <Files className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          Juntar PDF
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Mescle dois ou mais ficheiros PDF num único documento, na ordem que preferir.
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
              {pdfFiles.length === 0 ? 'Arraste os ficheiros PDF aqui' : 'Adicionar mais PDFs'}
            </h3>
            <p className="text-xs text-secondary mt-1">Selecione vários ficheiros de uma só vez</p>
          </motion.div>
        </div>

        {pdfFiles.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-secondary">
                {pdfFiles.length} {pdfFiles.length === 1 ? 'ficheiro' : 'ficheiros'} • arraste para ordenar a união
              </span>
              <button onClick={clearAll} className="text-xs text-secondary hover:text-rose-400 transition-colors">
                Limpar tudo
              </button>
            </div>

            <Reorder.Group
              axis="y"
              values={pdfFiles}
              onReorder={handleReorder} // Atualizado para usar a nova função
              className="space-y-2 mb-6"
            >
              {pdfFiles.map((item, index) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-xl p-3 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-secondary/50 shrink-0" />
                  <span className="text-xs text-secondary font-mono w-6 shrink-0">{index + 1}</span>
                  
                  {/* Ícone transformado em Botão Interativo para Pré-visualização */}
                  <button 
                    onClick={() => openPreview(item.file)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 shrink-0 transition-colors cursor-pointer"
                    title="Visualizar PDF"
                  >
                    <FileType2 className="w-6 h-6" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.file.name}</p>
                    <p className="text-xs text-secondary">{formatBytes(item.file.size)}</p>
                  </div>
                  <button
                    onClick={() => removePdf(item.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-secondary hover:text-rose-400 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {!mergedPdfUrl ? (
              <button
                onClick={handleMergePdfs}
                disabled={isProcessing || pdfFiles.length < 2}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Unificando ficheiros...</>
                ) : (
                  <><Files className="w-5 h-5" /> Juntar PDFs</>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                  <span>PDF unificado com sucesso!</span>
                  <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                </div>
                
                <a
                  href={mergedPdfUrl}
                  download={`mofidax_junto_${Date.now()}.pdf`}
                  className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Baixar PDF Unificado
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Pré-visualização do PDF */}
      <AnimatePresence>
        {previewPdfUrl && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePreview}
              className="absolute inset-0 bg-background/95 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-5xl h-[85vh] flex flex-col bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <h3 className="font-medium text-primary flex items-center gap-2">
                  <FileType2 className="w-5 h-5 text-rose-400" /> Pré-visualização do Documento
                </h3>
                <button 
                  onClick={closePreview}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-secondary hover:text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <iframe 
                src={previewPdfUrl} 
                className="w-full flex-1 bg-white" 
                title="PDF Preview" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}