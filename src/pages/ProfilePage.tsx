import { useState } from 'react';
import { HardDrive, Zap, Moon, Sun, Monitor, Shield, Code2, ChevronRight, ChevronDown, Sparkles, Check } from 'lucide-react';
import { useHistoryStore } from '../store/useHistoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FREE_PLAN_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

const PRO_FEATURES = [
  'Cache estendido (até 5 GB)',
  'Fila de processamento em lote',
  'Remoção de fundo com IA',
  'Sincronização entre dispositivos',
];

export function ProfilePage() {
  const { items } = useHistoryStore();

  const {
    hardwareAcceleration, toggleHardwareAcceleration,
    theme, setTheme,
    clearOnClose, toggleClearOnClose
  } = useSettingsStore();

  const [showProDetails, setShowProDetails] = useState(false);

  const totalSavedSize = items.reduce((acc, item) => acc + item.newSize, 0);
  const usagePercent = Math.min((totalSavedSize / FREE_PLAN_LIMIT_BYTES) * 100, 100);
  const isNearLimit = usagePercent >= 80;

  const handleThemeChange = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 pt-20 pb-24 flex flex-col gap-6">

      {/* Card de plano — compacto, com detalhes do Pro escondidos por padrão */}
      <div className="bg-surface border border-white/10 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center justify-between p-6 z-10 relative">
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Seu plano</p>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Gratuito</h1>
          </div>
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all shrink-0">
            <Sparkles className="w-4 h-4" /> Upgrade
          </button>
        </div>

        <button
          onClick={() => setShowProDetails((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-3 border-t border-white/5 text-sm text-secondary hover:bg-white/5 transition-colors z-10 relative"
        >
          <span>Ver o que muda no Pro</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showProDetails ? 'rotate-180' : ''}`} />
        </button>

        {showProDetails && (
          <ul className="px-6 pb-5 space-y-2 z-10 relative">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-secondary">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Uso do dispositivo — aviso quando perto do limite gratuito */}
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
              className={`h-full rounded-full transition-all duration-1000 ${isNearLimit ? 'bg-amber-400' : 'bg-accent'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className={`text-xs text-right mt-1 ${isNearLimit ? 'text-amber-400' : 'text-secondary/60'}`}>
            {isNearLimit
              ? 'Você está perto do limite do plano gratuito (500 MB)'
              : 'Limite do plano gratuito (500 MB)'}
          </p>
        </div>
      </div>

      {/* Preferências — agora logo em seguida, sem bloco promocional no meio */}
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
    href="https://github.com/thyagoo-dev/mofidax"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium transition-colors"
  >
    <Code2 className="w-4 h-4" />
    Código Fonte
  </a>
</div>

      <div className="text-center mt-6 pb-4">
        <p className="text-xs text-secondary/50 font-mono">Mofidax v1.0.0 • Engine Wasm-0.9.4</p>
      </div>
    </div>
  );
}