import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, GripVertical, Copy, ArrowDownUp, Eye } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { useHistoryStore } from '../store/useHistoryStore';

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface PdfPageItem {
  id: string;
  originalPageNum: number;
  thumbUrl: string;
}

export function OrganizePdfPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const openPreview = () => {
    if (pdfFile) setPreviewPdfUrl(URL.createObjectURL(pdfFile));
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const renderThumbnails = async (buffer: ArrayBuffer, numPages: number) => {
    setIsGeneratingThumbs(true);
    try {
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdfJsDoc = await loadingTask.promise;
      const initialPages: PdfPageItem[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport } as any).promise;
          
          initialPages.push({
            id: `page-${i}-${Date.now()}`,
            originalPageNum: i,
            thumbUrl: canvas.toDataURL('image/jpeg', 0.6)
          });
        }
        setPages([...initialPages]);
      }
    } catch (error) {
      console.error("Erro ao gerar miniaturas:", error);
    } finally {
      setIsGeneratingThumbs(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    try {
      setPdfFile(file);
      setResultPdfUrl(null);
      setStats(null);
      setPages([]);
      setPreviewPdfUrl(null);
      setPreviewImage(null);

      const buffer = await file.arrayBuffer();
      setPdfBuffer(buffer);
      
      const pdfLibDoc = await PDFDocument.load(buffer);
      const numPages = pdfLibDoc.getPageCount();

      renderThumbnails(buffer.slice(0), numPages);

    } catch (error) {
      console.error("Erro ao ler o PDF:", error);
      alert("Não foi possível ler este ficheiro PDF.");
      clearAll();
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const clearAll = () => {
    setPdfFile(null);
    setPdfBuffer(null);
    setPages([]);
    setResultPdfUrl(null);
    setStats(null);
    setPreviewImage(null);
    closePreview();
  };

  const handleDeletePage = (idToRemove: string) => {
    setPages(prev => prev.filter(p => p.id !== idToRemove));
    setResultPdfUrl(null);
  };

  const handleDuplicatePage = (indexToDuplicate: number) => {
    setPages(prev => {
      const newPages = [...prev];
      const itemToCopy = newPages[indexToDuplicate];
      newPages.splice(indexToDuplicate + 1, 0, {
        ...itemToCopy,
        id: `copy-${itemToCopy.originalPageNum}-${Date.now()}-${Math.random()}`
      });
      return newPages;
    });
    setResultPdfUrl(null);
  };

  const handleReorder = (newOrder: PdfPageItem[]) => {
    setPages(newOrder);
    setResultPdfUrl(null);
  };

  const handleApplyOrganization = async () => {
    if (!pdfFile || !pdfBuffer || pages.length === 0) return;
    setIsProcessing(true);

    try {
      const originalPdf = await PDFDocument.load(pdfBuffer.slice(0));
      const newPdf = await PDFDocument.create();

      const indicesToExtract = pages.map(p => p.originalPageNum - 1);
      const copiedPages = await newPdf.copyPages(originalPdf, indicesToExtract);
      
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = `mofidax_organizado_${pdfFile.name}`;

      setResultPdfUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName,
        action: 'Organizar PDF',
        originalSize: pdfFile.size,
        newSize: blob.size,
        format: 'PDF',
        url,
      });

    } catch (error) {
      console.error("Erro ao organizar PDF:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-rose-400/10 rounded-xl border border-rose-400/20">
            <ArrowDownUp className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          Organizar PDF
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Arraste para reordenar, apague páginas indesejadas ou duplique as suas favoritas num piscar de olhos.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
        
        {!pdfFile ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-rose-400 bg-rose-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-rose-400' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste um ficheiro PDF aqui</h3>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-4 overflow-hidden">
                <button 
                  onClick={openPreview}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 shrink-0 transition-colors cursor-pointer"
                  title="Visualizar PDF Original"
                >
                  <FileType2 className="w-6 h-6" />
                </button>
                <div className="truncate">
                  <p className="font-medium text-primary truncate">{pdfFile.name}</p>
                  <p className="text-xs text-secondary flex items-center gap-2">
                    Original: {formatBytes(pdfFile.size)} 
                    {isGeneratingThumbs && <Loader2 className="w-3 h-3 animate-spin text-rose-400" />}
                  </p>
                </div>
              </div>
              <button onClick={clearAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-rose-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-primary">
                  Novo Documento ({pages.length} páginas)
                </label>
                <span className="text-xs text-secondary">Arraste as linhas para ordenar</span>
              </div>

              <Reorder.Group
                axis="y"
                values={pages}
                onReorder={handleReorder}
                className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar"
              >
                <AnimatePresence initial={false}>
                  {pages.map((item, index) => (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="flex items-center gap-3 bg-surface border border-white/5 hover:border-white/10 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-secondary/50 shrink-0" />
                      
                      <button 
                        type="button"
                        onClick={() => setPreviewImage(item.thumbUrl)}
                        className="w-10 h-14 bg-white/5 rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative group/thumb hover:border-rose-400 transition-colors cursor-pointer"
                        title="Visualizar Página"
                      >
                        {item.thumbUrl ? (
                          <>
                            <img src={item.thumbUrl} alt="Thumb" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-secondary opacity-50" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Página {index + 1}</p>
                        <p className="text-xs text-secondary">Original: Pág. {item.originalPageNum}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDuplicatePage(index)}
                          className="p-2 rounded-lg hover:bg-white/10 text-secondary hover:text-primary transition-colors"
                          title="Duplicar Página"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(item.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-secondary hover:text-rose-400 transition-colors"
                          title="Apagar Página"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
                
                {pages.length === 0 && !isGeneratingThumbs && (
                   <div className="text-center py-8 text-secondary text-sm">
                     Todas as páginas foram apagadas.
                   </div>
                )}
              </Reorder.Group>
            </div>

            {!resultPdfUrl ? (
              <button
                onClick={handleApplyOrganization}
                disabled={isProcessing || pages.length === 0}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Documento...</>
                ) : (
                  <><ArrowDownUp className="w-5 h-5" /> Salvar Novo PDF</>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                  <span>PDF atualizado com sucesso!</span>
                  <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                </div>
                
                <a
                  href={resultPdfUrl}
                  download={`mofidax_organizado_${pdfFile.name}`}
                  className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Baixar Documento Final
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Pré-visualização do PDF Inteiro */}
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
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 shrink-0">
                <h3 className="font-medium text-primary flex items-center gap-2">
                  <FileType2 className="w-5 h-5 text-rose-400" /> Documento Original
                </h3>
                <button onClick={closePreview} className="p-2 hover:bg-white/10 rounded-full transition-colors text-secondary hover:text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <iframe src={previewPdfUrl} className="w-full flex-1 bg-white" title="PDF Preview" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Novo Modal Elegante de Pré-visualização da Página Individual (Imagem) */}
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
              className="relative z-10 w-full max-w-5xl h-[85vh] flex flex-col bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 shrink-0">
                <h3 className="font-medium text-primary flex items-center gap-2">
                  <Eye className="w-5 h-5 text-rose-400" /> Pré-visualização da Página
                </h3>
                <button onClick={() => setPreviewImage(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-secondary hover:text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* O fundo #323639 imita o fundo padrão de visualizadores de PDF */}
              <div className="flex-1 w-full bg-[#323639] flex items-center justify-center overflow-hidden p-4 sm:p-8">
                <img 
                  src={previewImage} 
                  alt="Pré-visualização da Página" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}