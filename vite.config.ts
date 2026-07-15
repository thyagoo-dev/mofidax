import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    strictPort: true, // Se a porta estiver ocupada, o Vite exibirá um erro em vez de trocar automaticamente.
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      // Ativamos isso para podermos testar o PWA mesmo em ambiente de desenvolvimento
      devOptions: {
        enabled: true,
      },

      manifest: {
        name: 'Mofidax',
        short_name: 'Mofidax',
        description: 'Plataforma de processamento de imagens de alta performance',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',

        // Por enquanto usaremos o ícone padrão do Vite, depois substituiremos por um logo oficial
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})