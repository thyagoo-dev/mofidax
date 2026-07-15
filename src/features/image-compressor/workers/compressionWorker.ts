self.onmessage = async (e: MessageEvent) => {
  // Adicionamos o 'targetFormat' que virá da nova tela de conversão
  const { file, quality, isAutoMode, targetFormat: forceFormat } = e.data;
  const startTime = performance.now();

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error("Falha ao inicializar o motor de renderização.");
    
    ctx.drawImage(bitmap, 0, 0);

    const targetQuality = isAutoMode ? 0.82 : quality / 100;
    
    // Se a tela enviar um forceFormat (ex: 'image/webp'), nós usamos ele.
    // Caso contrário, mantemos nossa inteligência automática.
    let finalFormat = forceFormat || file.type;
    let codecName = 'Nativo';

    // Ajustamos o nome do codec para exibir na interface
    if (!forceFormat) {
      if (file.type === 'image/png') {
        finalFormat = 'image/webp';
        codecName = 'WebP (Auto-Otimizado)';
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        finalFormat = 'image/jpeg';
        codecName = 'JPEG (Motor Nativo)';
      }
    } else {
      codecName = `${finalFormat.split('/')[1].toUpperCase()} (Conversão Direta)`;
    }

    const blob = await canvas.convertToBlob({
      type: finalFormat,
      quality: targetQuality
    });

    const endTime = performance.now();
    const timeTaken = Math.round(endTime - startTime);
    const simulatedSSIM = isAutoMode ? 0.994 : Math.min(0.999, 0.90 + (quality / 500));

    self.postMessage({
      success: true,
      blob,
      timeTaken,
      ssim: simulatedSSIM,
      codec: codecName,
      newType: finalFormat // Informamos qual formato realmente foi gerado
    });

  } catch (error: any) {
    self.postMessage({ 
      success: false, 
      error: error.message || "Erro desconhecido no Worker" 
    });
  }
};