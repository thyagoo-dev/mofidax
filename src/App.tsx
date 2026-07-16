import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Home } from './pages/Home';
import { CompressorPage } from './pages/CompressorPage';
import { ConverterPage } from './pages/ConverterPage';
import { SavedPage } from './pages/SavedPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResizePage } from './pages/ResizePage';
import { CropPage } from './pages/CropPage'; // Nova Rota importada
import { PdfPage } from './pages/PdfPage';
import { BgRemovePage } from './pages/BgRemovePage';
import { useSettingsStore } from './store/useSettingsStore';
import { useHistoryStore } from './store/useHistoryStore';

export default function App() {

  useEffect(() => {
    const handleUnload = () => {
      const { clearOnClose } = useSettingsStore.getState();
      if (clearOnClose) {
        useHistoryStore.getState().clearHistory();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen flex flex-col relative bg-background">
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compressor" element={<CompressorPage />} />
          <Route path="/convert" element={<ConverterPage />} />
          <Route path="/resize" element={<ResizePage />} />
          <Route path="/crop" element={<CropPage />} /> {/* Adicionado ao Roteador */}
          <Route path="/pdf" element={<PdfPage />} />
          <Route path="/remove-bg" element={<BgRemovePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}