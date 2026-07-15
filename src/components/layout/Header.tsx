import { Settings2, Code2, FolderHeart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const isSavedPage = location.pathname === '/saved';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-surface rounded-lg border border-white/10 group-hover:border-accent/50 transition-colors">
            <Settings2 className="w-5 h-5 text-accent" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Mofidax</span>
        </Link>
        
        <nav className="flex items-center gap-2">
          <Link 
            to="/saved" 
            className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isSavedPage ? 'bg-white/10 text-primary' : 'text-secondary hover:text-primary hover:bg-white/5'}`}
          >
            <FolderHeart className="w-4 h-4" />
            <span className="text-sm font-medium">Salvos</span>
          </Link>

          <button className="p-2 text-secondary hover:text-primary transition-colors rounded-md hover:bg-white/5">
            <Code2 className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}