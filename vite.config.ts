import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import svgr from 'vite-plugin-svgr';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    svgr(),
    viteStaticCopy({
      targets: [
        {
          src: `src/GAME_DATA/${process.env.VITE_GAME_ID}/assets`,
          dest: '.',
        },
      ],
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    outDir: `dist/${process.env.VITE_GAME_ID || 'default'}`,
    rollupOptions: {
      external: (fName: string) => fName.includes('GAME_DATA') && !fName.includes(`${process.env.VITE_GAME_ID}`),
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
}));
