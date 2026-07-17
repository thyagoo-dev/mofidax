import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Download, Loader2, X, Music, Video, ArrowRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHistoryStore } from '../store/useHistoryStore';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function Mp4ToMp3Page() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number } | null>(null);
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  
  const ffmpegRef = useRef(new FFmpeg());
  const addHistoryItem = useHistoryStore((state) => state.addItem);

  // Carrega o motor FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      if (ffmpeg.loaded) {
        setIsFfmpegLoaded(true);
        return;
      }

      ffmpeg.on('progress', ({ progress }) => {
        // Garante que o progresso fique entre 0 e 100
        const perc = Math.min(100, Math.max(0, Math.round(progress * 100)));
        setProgress(perc);
      });

      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setIsFfmpegLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar o FFmpeg:", error);
      }
    };

    loadFFmpeg();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResultUrl(null);
      setCoverUrl(null);
      setStats(null);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'] },
    maxFiles: 1,
  });

  const clearAll = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setFile(null);
    setResultUrl(null);
    setCoverUrl(null);
    setStats(null);
    setProgress(0);
  };

  const handleConvert = async () => {
    if (!file || !isFfmpegLoaded) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // 1. Escreve o vídeo na memória
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      
      // 2. Extrai um frame do vídeo (no meio segundo) para servir de Capa do Álbum
      let hasCover = false;
      const coverExitCode = await ffmpeg.exec([
        '-ss', '00:00:00.500', 
        '-i', 'input.mp4', 
        '-vframes', '1', 
        '-q:v', '2', 
        '-c:v', 'mjpeg', 
        'cover.jpg'
      ]);

      if (coverExitCode === 0) {
        try {
          const coverData = await ffmpeg.readFile('cover.jpg');
          const cBlob = new Blob([coverData as any], { type: 'image/jpeg' });
          setCoverUrl(URL.createObjectURL(cBlob));
          hasCover = true;
        } catch (e) {
          console.log("Aviso: Não foi possível extrair a capa do vídeo.", e);
        }
      }

      // 3. Monta o comando de conversão para MP3
      const mp3Args = ['-i', 'input.mp4'];
      
      if (hasCover) {
        // Se conseguimos a imagem, embutimos ela no MP3 com metadados ID3v2
        mp3Args.push(
          '-i', 'cover.jpg',
          '-map', '0:a:0', // Pega o áudio do vídeo (input 0)
          '-map', '1:v:0', // Pega a imagem (input 1)
          '-c:v', 'copy',  // Mantém a imagem intacta
          '-id3v2_version', '3',
          '-metadata:s:v', 'title="Album cover"',
          '-metadata:s:v', 'comment="Cover (front)"'
        );
      } else {
        // Se falhar a imagem, apenas extrai o áudio normalmente
        mp3Args.push('-map', '0:a:0');
      }
      
      // Força a qualidade do áudio e define a saída
      mp3Args.push('-q:a', '0', 'output.mp3');

      // 4. Executa a conversão final
      await ffmpeg.exec(mp3Args);
      
      // 5. Gera o ficheiro para download
      const data = await ffmpeg.readFile('output.mp3');
      const blob = new Blob([data as any], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
      setStats({ size: blob.size });

      addHistoryItem({
        fileName: `${file.name.replace(/\.[^/.]+$/, '')}.mp3`,
        action: 'MP4 para MP3',
        originalSize: file.size,
        newSize: blob.size,
        format: 'MP3',
        url,
      });

    } catch (error) {
      console.error("Erro na conversão de áudio:", error);
      alert("Houve um erro ao processar o vídeo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center">
      
      <div className="mb-6 sm:mb-8 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex flex-row items-center justify-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
          </div>
          MP4 para MP3
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          Extraia o áudio dos seus vídeos com qualidade de estúdio e embutimento automático da capa.
        </p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {!isFfmpegLoaded && (
          <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
            <p className="text-primary font-medium text-sm">A iniciar motor de áudio...</p>
          </div>
        )}

        {!file ? (
          <div {...getRootProps()} className="focus:outline-none">
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-2xl transition-all ${isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 ${isDragActive ? 'text-purple-500' : 'text-primary'}`} />
              <h3 className="text-base sm:text-lg font-semibold text-center">Arraste um vídeo MP4 aqui</h3>
              <p className="text-xs text-secondary mt-2">O áudio será extraído offline</p>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Cabecalho do Ficheiro (Ocultado durante o processamento para dar foco à percentagem) */}
            {!isProcessing && !resultUrl && (
              <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-primary truncate">{file.name}</p>
                    <p className="text-xs text-secondary">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button onClick={clearAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-purple-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Tela de Processamento com Gráfico Circular */}
            {isProcessing && !resultUrl && (
              <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-300">
                <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                  {/* Circulo de fundo */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                    {/* Circulo de progresso colorido */}
                    <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (283 * Math.max(5, progress)) / 100} 
                      strokeLinecap="round"
                      className="text-purple-500 transition-all duration-300 ease-out" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{progress}%</span>
                  </div>
                </div>
                <p className="text-purple-400/80 font-medium animate-pulse tracking-wide uppercase text-sm">
                  Extraindo Áudio e Capa...
                </p>
              </div>
            )}

            {/* Tela de Sucesso com a Capa do Álbum! */}
            {!resultUrl && !isProcessing ? (
              <button
                onClick={handleConvert}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98]"
              >
                Extrair Áudio <ArrowRight className="w-5 h-5" />
              </button>
            ) : resultUrl && !isProcessing && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Banner de Sucesso com a Capa Embutida */}
                <div className="flex items-center gap-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Capa Extraída" className="w-20 h-20 rounded-lg object-cover shadow-lg border border-purple-500/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-purple-500/20 flex items-center justify-center shadow-lg border border-purple-500/20">
                      <Music className="w-8 h-8 text-purple-500" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-white text-lg">MP3 Gerado!</span>
                    <span className="text-xs sm:text-sm text-purple-300/80 mt-1">A imagem da thumbnail foi injetada no ficheiro de áudio.</span>
                    <span className="text-xs font-mono mt-2 text-purple-400">{formatBytes(stats?.size || 0)}</span>
                  </div>
                </div>
                
                {/* Botões Finais */}
                <div className="flex gap-3">
                  <button 
                    onClick={clearAll}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-primary rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Novo
                  </button>
                  <a
                    href={resultUrl}
                    download={`${file?.name.replace(/\.[^/.]+$/, '')}.mp3`}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" /> Baixar Ficheiro MP3
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