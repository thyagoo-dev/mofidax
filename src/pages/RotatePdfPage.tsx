import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, RotateCw, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument, degrees } from 'pdf-lib';
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

export function RotatePdfPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  
  // Mapeia o número da página (1-index) para o grau de rotação adicional (0, 90, 180, 270, etc)
  const [rotations, setRotations] = useState<Record<number, number>>({});
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

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
      setRotations({});
      setResultPdfUrl(null);
      setStats(null);
      setPageThumbnails([]);
      setPreviewPdfUrl(null);

      const buffer = await file.arrayBuffer();
      setPdfBuffer(buffer);
      
      const pdfLibDoc = await PDFDocument.load(buffer);
      const numPages = pdfLibDoc.getPageCount();
      setTotalPages(numPages);

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
    setTotalPages(0);
    setRotations({});
    setResultPdfUrl(null);
    setStats(null);
    setPageThumbnails([]);
    closePreview();
  };

  // Funções de Rotação
  const rotatePage = (pageNum: number, direction: 'cw' | 'ccw') => {
    setRotations(prev => {
      const current = prev[pageNum] || 0;
      const newRot = direction === 'cw' ? current + 90 : current - 90;
      return { ...prev, [pageNum]: newRot };
    });
    setResultPdfUrl(null);
  };

  const rotateAll = (direction: 'cw' | 'ccw') => {
    setRotations(prev => {
      const next = { ...prev };
      for (let i = 1; i <= totalPages; i++) {
        const current = next[i] || 0;
        next[i] = direction === 'cw' ? current + 90 : current - 90;
      }
      return next;
    });
    setResultPdfUrl(null);
  };

  const handleApplyRotations = async () => {
    if (!pdfFile || !pdfBuffer) return;
    setIsProcessing(true);

    try {
      // Carregamos a estrutura original
      const pdfDoc = await PDFDocument.load(pdfBuffer.slice(0));
      const pages = pdfDoc.getPages();

      let hasModifications = false;

      // Iteramos pelas páginas e aplicamos a rotação se existir
      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        const additionalRotation = rotations[pageNum] || 0;
        
        if (additionalRotation % 360 !== 0) {
          hasModifications = true;
          const existingAngle = pages[i].getRotation().angle;
          // Somamos a rotação existente no ficheiro original com a nova rotação escolhida
          pages[i].setRotation(degrees(existingAngle + additionalRotation));
        }
      }

      // Se o utilizador não rodou nada e clicou em processar
      if (!hasModifications) {
         alert("Não foram feitas alterações de rotação no documento.");
         setIsProcessing(false);
         return;
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = `mofidax_rodado_${pdfFile.name}`;

      setResultPdfUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName,
        action: 'Rodar PDF',
        originalSize: pdfFile.size,
        newSize: blob.size,
        format: 'PDF',
        url,
      });

    } catch (error) {
      console.error("Erro ao rodar PDF:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-rose-400/10 rounded-xl border border-rose-400/20">
            <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          Rodar PDF
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Gire páginas individualmente ou o documento inteiro de forma fácil e 100% offline.
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
                  title="Visualizar PDF"
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
                <label className="text-sm font-medium flex items-center gap-2 text-primary">
                  Ajuste a orientação
                </label>
                
                <div className="flex gap-2 text-xs">
                  <button 
                    onClick={() => rotateAll('ccw')} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-primary rounded-lg transition-colors border border-white/5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Tudo p/ Esquerda
                  </button>
                  <button 
                    onClick={() => rotateAll('cw')} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-primary rounded-lg transition-colors border border-white/5"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Tudo p/ Direita
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar p-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const thumbUrl = pageThumbnails[pageNum - 1];
                  // Rotação acumulada para aplicação via CSS
                  const currentRotation = rotations[pageNum] || 0;

                  return (
                    <div key={pageNum} className="relative aspect-[3/4] bg-surface rounded-xl overflow-hidden border border-white/10 group">
                      
                      {/* O contentor da imagem com rotação CSS suave */}
                      <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/5">
                        {thumbUrl ? (
                           <img 
                             src={thumbUrl} 
                             alt={`Página ${pageNum}`} 
                             style={{ transform: `rotate(${currentRotation}deg)` }}
                             className="max-w-full max-h-full object-contain transition-transform duration-300 drop-shadow-md" 
                           />
                        ) : (
                           <Loader2 className="w-4 h-4 animate-spin text-secondary opacity-50" />
                        )}
                      </div>

                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] shadow-lg backdrop-blur-md font-mono font-bold bg-black/70 text-white z-10">
                        {pageNum}
                      </div>

                      {/* Botão flutuante para rodar (aparece no hover em desktop, fixo em mobile) */}
                      <button 
                        onClick={() => rotatePage(pageNum, 'cw')}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-rose-500/90 text-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10 backdrop-blur-sm sm:opacity-0 opacity-100"
                        title="Rodar Página"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>

                      {/* Se a página estiver rodada, um pequeno indicador no canto */}
                      {currentRotation % 360 !== 0 && (
                         <div className="absolute bottom-1.5 right-1.5 text-xs text-rose-400 bg-rose-500/10 px-1.5 rounded font-mono border border-rose-500/20 z-10 backdrop-blur-md">
                           {currentRotation % 360}º
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!resultPdfUrl ? (
              <button
                onClick={handleApplyRotations}
                disabled={isProcessing}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Aplicando Rotações...</>
                ) : (
                  <><RotateCw className="w-5 h-5" /> Salvar PDF Rodado</>
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
                  download={`mofidax_rodado_${pdfFile.name}`}
                  className="w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Baixar PDF Novo
                </a>
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}