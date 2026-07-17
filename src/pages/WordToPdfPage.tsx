import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, Download, Loader2, X, FileText, ArrowRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHistoryStore } from '../store/useHistoryStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  
  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResultUrl(null);
      setStats(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
  });

  const clearAll = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setStats(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      // Cria o FormData para enviar o arquivo via requisição HTTP POST
      const formData = new FormData();
      formData.append('file', file);

      // Envia para o nosso novo Backend rodando na porta 3001
      const response = await fetch('http://localhost:3001/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha na conversão pelo servidor.');
      }

      // Recebe o PDF perfeito gerado pelo LibreOffice no backend
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName: `${file.name.replace(/\.(docx|doc)$/, '')}.pdf`,
        action: 'Word para PDF',
        originalSize: file.size,
        newSize: blob.size,
        format: 'PDF',
        url,
      });

    } catch (error) {
      console.error("Erro na conversão:", error);
      alert("Houve um erro de comunicação com o servidor de conversão. Verifique se o backend está a rodar na porta 3001.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          </div>
          Word para PDF
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Conversão de nível profissional utilizando motor de renderização dedicado.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
        
        {!file ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-blue-500' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste um ficheiro Word aqui</h3>
              <p className="text-xs text-secondary mt-2">Suporta .DOC e .DOCX</p>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                  <FileType2 className="w-6 h-6" />
                </div>
                <div className="truncate">
                  <p className="font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-secondary">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button onClick={clearAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-blue-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!resultUrl ? (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Renderizando no Servidor...</>
                ) : (
                  <>Converter para PDF <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs sm:text-sm bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                  <span>PDF gerado com perfeição!</span>
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
                    href={resultUrl}
                    download={`${file.name.replace(/\.(docx|doc)$/, '')}.pdf`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" /> Baixar Ficheiro PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}