import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, FileMinus, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { useHistoryStore } from '../store/useHistoryStore';

// Importando o motor de renderização da Mozilla e o seu Worker adaptado para o Vite (PWA Offline)
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

export function SplitPdfPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPdfUrl, setSplitPdfUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);

  // Estado para controlar a pré-visualização do PDF completo
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const addHistoryItem = useHistoryStore((state) => state.addItem);

  // Funções para abrir e fechar a pré-visualização de forma segura
  const openPreview = () => {
    if (pdfFile) {
      setPreviewPdfUrl(URL.createObjectURL(pdfFile));
    }
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
      const thumbs: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ canvasContext: context, viewport } as any).promise;
          
          thumbs.push(canvas.toDataURL('image/jpeg', 0.6));
        }
        
        setPageThumbnails([...thumbs]);
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
      setSelectedPages(new Set());
      setSplitPdfUrl(null);
      setStats(null);
      setPageThumbnails([]);
      setPreviewPdfUrl(null); // Garante que o preview fecha se carregar um novo

      const arrayBuffer = await file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfLibDoc.getPageCount();
      setTotalPages(numPages);

      renderThumbnails(arrayBuffer.slice(0), numPages);

    } catch (error) {
      console.error("Erro ao ler o PDF:", error);
      alert("Não foi possível ler este ficheiro PDF. Ele pode estar corrompido.");
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
    setTotalPages(0);
    setSelectedPages(new Set());
    setSplitPdfUrl(null);
    setStats(null);
    setPageThumbnails([]);
    closePreview(); // Limpa a memória se limpar tudo
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNum)) {
        newSet.delete(pageNum);
      } else {
        newSet.add(pageNum);
      }
      return newSet;
    });
    setSplitPdfUrl(null);
  };

  const selectAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= totalPages; i++) all.add(i);
    setSelectedPages(all);
    setSplitPdfUrl(null);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
    setSplitPdfUrl(null);
  };

  const handleSplitPdf = async () => {
    if (!pdfFile || selectedPages.size === 0) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const pagesToExtract = Array.from(selectedPages)
        .sort((a, b) => a - b)
        .map(p => p - 1);

      const copiedPages = await newPdf.copyPages(originalPdf, pagesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = `mofidax_extraido_${pdfFile.name}`;

      setSplitPdfUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName,
        action: 'Dividir PDF',
        originalSize: pdfFile.size,
        newSize: blob.size,
        format: 'PDF',
        url,
      });

    } catch (error) {
      console.error("Erro ao dividir PDF:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-rose-400/10 rounded-xl border border-rose-400/20">
            <FileMinus className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          Dividir / Extrair PDF
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Selecione as páginas que deseja extrair. Veja a pré-visualização real do documento!
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
                {/* Ícone transformado em Botão Interativo para Pré-visualização */}
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
                    {formatBytes(pdfFile.size)} • {totalPages} páginas
                    {isGeneratingThumbs && <Loader2 className="w-3 h-3 animate-spin text-rose-400" />}
                  </p>
                </div>
              </div>
              <button onClick={clearAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-rose-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-rose-400" /> 
                  Selecione as páginas ({selectedPages.size})
                </label>
                <div className="flex gap-3 text-xs">
                  <button onClick={selectAll} className="text-secondary hover:text-rose-400 transition-colors">Selecionar Tudo</button>
                  <button onClick={clearSelection} className="text-secondary hover:text-rose-400 transition-colors">Limpar Seleção</button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar p-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isSelected = selectedPages.has(pageNum);
                  const thumbUrl = pageThumbnails[pageNum - 1];

                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePageSelection(pageNum)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center transition-all border-2 ${
                        isSelected 
                          ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {thumbUrl ? (
                         <img src={thumbUrl} alt={`Página ${pageNum}`} className="absolute inset-0 w-full h-full object-cover bg-white" />
                      ) : (
                         <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-secondary opacity-50 mb-1" />
                         </div>
                      )}

                      <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-rose-500/20' : 'bg-black/10 hover:bg-black/0'}`} />

                      <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] shadow-lg backdrop-blur-md font-mono font-bold ${isSelected ? 'bg-rose-500 text-white' : 'bg-black/70 text-white'}`}>
                        {pageNum}
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-1.5 right-1.5 bg-rose-500 text-white rounded-md p-1 shadow-lg">
                          <CheckSquare className="w-3 h-3" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {!splitPdfUrl ? (
              <button
                onClick={handleSplitPdf}
                disabled={isProcessing || selectedPages.size === 0}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Extraindo páginas...</>
                ) : (
                  <><FileMinus className="w-5 h-5" /> Criar Novo PDF</>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                  <span>PDF Extraído ({selectedPages.size} páginas)</span>
                  <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                </div>
                
                <a
                  href={splitPdfUrl}
                  download={`mofidax_extraido_${pdfFile.name}`}
                  className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Baixar Novo PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Pré-visualização do PDF Original */}
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