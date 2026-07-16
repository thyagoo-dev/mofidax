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
import { CropPage } from './pages/CropPage';
import { ImageToPdfPage } from './pages/ImageToPdfPage';
import { MergePdfPage } from './pages/MergePdfPage';
import { SplitPdfPage } from './pages/SplitPdfPage';
import { PdfToImagePage } from './pages/PdfToImagePage';
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
          <Route path="/crop" element={<CropPage />} />
          <Route path="/pdf" element={<ImageToPdfPage />} />
          <Route path="/merge-pdf" element={<MergePdfPage />} />
          <Route path="/split-pdf" element={<SplitPdfPage />} />
          <Route path="/pdf-to-image" element={<PdfToImagePage />} />
          <Route path="/bg-remove" element={<BgRemovePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}