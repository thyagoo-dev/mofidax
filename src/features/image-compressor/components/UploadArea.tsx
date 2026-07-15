import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, FileType } from 'lucide-react';
import { useCompressorStore } from '../store/useCompressorStore';

export function UploadArea() {
  const setOriginalFile = useCompressorStore((state) => state.setOriginalFile);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setOriginalFile(acceptedFiles[0]); // Envia a imagem para o Zustand!
    }
  }, [setOriginalFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-2xl mx-auto mt-24">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">Otimize suas imagens</h2>
        <p className="text-secondary">
          Compressão inteligente com redução de tamanho e preservação de qualidade máxima.
        </p>
      </div>

      <div {...getRootProps()} className="focus:outline-none">
        <input {...getInputProps()} />
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`
            relative cursor-pointer flex flex-col items-center justify-center p-12 
            border-2 border-dashed rounded-3xl transition-all duration-200 ease-in-out
            bg-surface/50 overflow-hidden group
            ${isDragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20 hover:bg-surface'}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-white/5 rounded-2xl mb-4 border border-white/5 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-accent' : 'text-primary'}`} />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive ? 'Solte a imagem aqui...' : 'Clique ou arraste uma imagem'}
          </h3>
          <p className="text-sm text-secondary text-center max-w-sm mb-6">
            Suporta JPG, PNG, WebP e AVIF.
          </p>
          <div className="flex gap-4 text-xs font-medium text-secondary">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/5">
              <ImageIcon className="w-3.5 h-3.5" /> Alta Qualidade
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/5">
              <FileType className="w-3.5 h-3.5" /> Processamento Local
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}