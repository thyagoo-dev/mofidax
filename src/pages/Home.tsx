import { Search, Minimize2, ArrowRightLeft, Maximize, Scissors, FileType2, Eraser, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const tools = [
  { id: 'compress', name: 'Comprimir imagens', icon: Minimize2, path: '/compressor', color: 'text-blue-400', bg: 'bg-blue-400/10', isReady: true },
  { id: 'convert', name: 'Converter formatos', icon: ArrowRightLeft, path: '/convert', color: 'text-purple-400', bg: 'bg-purple-400/10', isReady: true },
  { id: 'resize', name: 'Redimensionar', icon: Maximize, path: '/resize', color: 'text-emerald-400', bg: 'bg-emerald-400/10', isReady: true },
  { id: 'crop', name: 'Cortar imagens', icon: Scissors, path: '/crop', color: 'text-amber-400', bg: 'bg-amber-400/10', isReady: true }, // Ferramenta de Cortar Desbloqueada!
  
  // Ferramentas futuras
  { id: 'pdf', name: 'Imagem para PDF', icon: FileType2, path: '#', color: 'text-rose-400', bg: 'bg-rose-400/10', isReady: false },
  { id: 'bg', name: 'Remover Fundo', icon: Eraser, path: '#', color: 'text-cyan-400', bg: 'bg-cyan-400/10', isReady: false },
];

export function Home() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-24 pb-24 sm:pb-8 flex flex-col">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center sm:text-left tracking-tight">O que você precisa hoje?</h1>
        <div className="relative max-w-2xl mx-auto sm:mx-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-secondary" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ferramenta..."
            className="w-full pl-11 pr-4 py-4 bg-surface border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-primary placeholder:text-secondary shadow-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.isReady ? tool.path : '#'}
            onClick={(e) => {
              if (!tool.isReady) e.preventDefault();
            }}
            className={`relative flex flex-col items-center sm:items-start p-4 sm:p-6 bg-surface border border-white/5 rounded-2xl transition-all ${
              tool.isReady 
                ? 'hover:border-white/10 hover:scale-[1.02] hover:bg-white/[0.02] group cursor-pointer' 
                : 'opacity-40 grayscale-[30%] cursor-not-allowed'
            }`}
          >
            {!tool.isReady && (
              <span className="absolute top-3 right-3 bg-black/40 text-secondary text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 border border-white/5">
                <Lock className="w-2.5 h-2.5" /> Breve
              </span>
            )}

            <div className={`p-3 rounded-xl mb-4 ${tool.bg} border border-white/5 ${tool.isReady ? 'group-hover:scale-110 transition-transform' : ''}`}>
              <tool.icon className={`w-6 h-6 ${tool.color}`} />
            </div>
            <span className="text-sm sm:text-base font-semibold text-center sm:text-left leading-tight">
              {tool.name}
            </span>
          </Link>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12 text-secondary">
          Nenhuma ferramenta encontrada para "{searchTerm}".
        </div>
      )}
    </div>
  );
}