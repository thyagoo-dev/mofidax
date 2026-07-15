import { UploadArea } from '../features/image-compressor/components/UploadArea';
import { CompressorModal } from '../features/image-compressor/components/CompressorModal';

export function CompressorPage() {
  return (
    <div className="flex-1 flex flex-col w-full relative pt-16">
      {/* Background sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))] pointer-events-none" />
      
      <main className="flex-1 flex flex-col items-center p-6 relative z-10 pb-24 sm:pb-6">
        <UploadArea />
      </main>

      <CompressorModal />
    </div>
  );
}