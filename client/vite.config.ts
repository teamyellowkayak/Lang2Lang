// client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// import tailwindcss from '@tailwindcss/postcss';
// import autoprefixer from 'autoprefixer';
// import shadcnThemeJson from "@replit/vite-plugin-shadcn-theme-json";

export default defineConfig(({ command, mode }) => {
  // `mode` will be 'development' during `npm run dev`
  // `mode` will be 'production' during `npm run build`

  const base = mode === 'production' ? '/lang2lang-dev_frontend/' : '/';

  return {
      plugins: [
        react(),
        // shadcnThemeJson({
        //   themeJson: 'theme.json',
        //   outputFile: 'src/downloadtheme.json', 
        //   outputPath: 'src/downloadindex.css', 
        // }),
      ],
      base: base,
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Resolves @/ to client/src/
          '@/shared': path.resolve(__dirname, '../shared'),
        },
      },
  };
});