import { Home, Grid, FolderHeart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md border-t border-white/10 z-50 sm:hidden">
      <div className="flex items-center justify-around h-full px-4">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-accent' : 'text-secondary hover:text-primary'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Início</span>
        </Link>
        <Link to="#" className={`flex flex-col items-center gap-1 ${isActive('/tools') ? 'text-accent' : 'text-secondary hover:text-primary'}`}>
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </Link>
        <Link to="/saved" className={`flex flex-col items-center gap-1 ${isActive('/saved') ? 'text-accent' : 'text-secondary hover:text-primary'}`}>
          <FolderHeart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Salvos</span>
        </Link>
        {/* Rota do Perfil adicionada aqui */}
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-accent' : 'text-secondary hover:text-primary'}`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}