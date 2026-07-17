import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, Hash, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function PdfToMarkdownPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mdUrl, setMdUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  
  // Estado para controlar a pré-visualização do PDF original
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const addHistoryItem = useHistoryStore((state) => state.addItem);

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setPdfFile(acceptedFiles[0]);
    setMdUrl(null);
    setStats(null);
    setPreviewText('');
    setPreviewPdfUrl(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const clearAll = () => {
    if (mdUrl) URL.revokeObjectURL(mdUrl);
    setPdfFile(null);
    setMdUrl(null);
    setStats(null);
    setPreviewText('');
    closePreview();
  };

  const handleConvertToMarkdown = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfJsDoc = await loadingTask.promise;
      
      let markdownContent = `# Documento: ${pdfFile.name}\n\n*Extraído via Mofidax*\n\n---\n\n`;

      for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        markdownContent += `## Página ${i}\n\n`;

        let lastY = -1;
        let pageText = '';

        for (const item of textContent.items) {
          if ('transform' in item && 'str' in item) {
            const currentY = item.transform[5];
            
            if (lastY !== -1 && Math.abs(lastY - currentY) > 10) {
              pageText += '\n\n';
            }
            
            pageText += item.str;
            lastY = currentY;
          }
        }

        markdownContent += pageText.replace(/\s{3,}/g, ' ') + '\n\n---\n\n';
      }

      // Agora enviamos o texto integral para o preview
      setPreviewText(markdownContent);

      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const baseName = pdfFile.name.replace(/\.[^/.]+$/, "");
      const fileName = `${baseName}.md`;

      setMdUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName,
        action: 'PDF para Markdown',
        originalSize: pdfFile.size,
        newSize: blob.size,
        format: 'MD',
        url,
      });

    } catch (error) {
      console.error("Erro ao converter para Markdown:", error);
      alert("Houve um erro ao processar o PDF. Ele pode estar corrompido ou protegido.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-indigo-400/10 rounded-xl border border-indigo-400/20">
            <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          PDF para Markdown
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Extraia o texto de ficheiros PDF e converta num documento `.md` limpo, ideal para anotações e LLMs.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
        
        {!pdfFile ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-indigo-400 bg-indigo-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-indigo-400' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste um ficheiro PDF aqui</h3>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-4 overflow-hidden">
                {/* Botão Interativo para Pré-visualizar o PDF Original */}
                <button 
                  onClick={openPreview}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0 transition-colors cursor-pointer"
                  title="Visualizar PDF"
                >
                  <FileType2 className="w-6 h-6" />
                </button>
                <div className="truncate">
                  <p className="font-medium text-primary truncate">{pdfFile.name}</p>
                  <p className="text-xs text-secondary">{formatBytes(pdfFile.size)}</p>
                </div>
              </div>
              <button onClick={clearAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-indigo-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!mdUrl ? (
              <button
                onClick={handleConvertToMarkdown}
                disabled={isProcessing}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analisando e Extraindo Texto...</>
                ) : (
                  <><Hash className="w-5 h-5" /> Converter para Markdown</>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Preview Box com Scroll Habilitado */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative flex flex-col group">
                   <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-bl-lg z-10">
                     PREVIEW
                   </div>
                   {/* Max-height ajustado e overflow-y-auto adicionado */}
                   <pre className="text-xs text-secondary font-mono whitespace-pre-wrap overflow-y-auto max-h-60 custom-scrollbar pr-2 pb-2">
                     {previewText}
                   </pre>
                   {/* Gradiente alterado para pointer-events-none para não bloquear o scroll */}
                   <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#111111] to-transparent pointer-events-none rounded-b-xl" />
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-indigo-400">
                  <span>Markdown gerado com sucesso!</span>
                  <span className="font-mono font-bold">{formatBytes(stats?.size || 0)}</span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={clearAll}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-primary rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Novo
                  </button>
                  <a
                    href={mdUrl}
                    download={`${pdfFile.name.replace(/\.[^/.]+$/, "")}.md`}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" /> Baixar Ficheiro (.md)
                  </a>
                </div>
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
                  <FileType2 className="w-5 h-5 text-indigo-400" /> Pré-visualização do Documento
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