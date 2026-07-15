import { HardDrive, Zap, Moon, Sun, Monitor, Shield, Code2, LogOut, ChevronRight, Crown } from 'lucide-react';
import { useHistoryStore } from '../store/useHistoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ProfilePage() {
  const { items } = useHistoryStore();
  
  const { 
    hardwareAcceleration, toggleHardwareAcceleration,
    theme, setTheme,
    clearOnClose, toggleClearOnClose 
  } = useSettingsStore();
  
  const totalSavedSize = items.reduce((acc, item) => acc + item.newSize, 0);

  const user = {
    name: "Cícero Thyago",
    email: "contato@th16technologies.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thyago&backgroundColor=3b82f6",
  };

  const handleThemeChange = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 pt-20 pb-24 flex flex-col gap-6">
      
      <div className="flex items-center gap-5 p-6 bg-surface border border-white/10 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-lg bg-white/5" />
        <div className="flex-1 z-10">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            {user.name}
            <span className="bg-gradient-to-r from-amber-200 to-amber-500 text-black text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/20">
              <Crown className="w-3 h-3" /> Pro
            </span>
          </h1>
          <p className="text-secondary text-sm">{user.email}</p>
        </div>
      </div>

      <div className="bg-surface border border-white/10 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-accent" /> Uso do Dispositivo
          </h2>
          <span className="text-xs text-secondary bg-white/5 px-2 py-1 rounded-lg">Cache Local</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Imagens Salvas ({items.length})</span>
            <span className="font-mono font-medium">{formatBytes(totalSavedSize)}</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min((totalSavedSize / (500 * 1024 * 1024)) * 100, 100)}%` }} 
            />
          </div>
          <p className="text-xs text-secondary/60 text-right mt-1">Limite flexível do PWA (500 MB)</p>
        </div>
      </div>

      <div className="bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-lg">
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider px-6 py-4 bg-white/5 border-b border-white/5">
          Preferências do Motor
        </h2>
        
        <div className="divide-y divide-white/5">
          
          <button onClick={toggleHardwareAcceleration} className="w-full flex items-center justify-between p-4 sm:px-6 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${hardwareAcceleration ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-secondary'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Aceleração de Hardware</p>
                <p className="text-xs text-secondary">Usa a GPU para WebAssembly</p>
              </div>
            </div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hardwareAcceleration ? 'bg-blue-500' : 'bg-white/10'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hardwareAcceleration ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>

          <button onClick={handleThemeChange} className="w-full flex items-center justify-between p-4 sm:px-6 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Tema da Interface</p>
                <p className="text-xs text-secondary capitalize">
                  {theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro (Em breve)' : 'Sistema'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-secondary" />
          </button>

          <button onClick={toggleClearOnClose} className="w-full flex items-center justify-between p-4 sm:px-6 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${clearOnClose ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-secondary'}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Privacidade Offline</p>
                <p className="text-xs text-secondary">Limpar dados ao fechar app</p>
              </div>
            </div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${clearOnClose ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${clearOnClose ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <a 
          href="https://github.com/SeuUsuario/Mofidax"
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium transition-colors"
        >
          <Code2 className="w-4 h-4" /> Código Fonte
        </a>
        <button className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-sm font-medium transition-colors">
          <LogOut className="w-4 h-4" /> Sair da Conta
        </button>
      </div>

      <div className="text-center mt-6 pb-4">
        <p className="text-xs text-secondary/50 font-mono">Mofidax v1.0.0 • Engine Wasm-0.9.4</p>
      </div>
    </div>
  );
}