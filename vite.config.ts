import tailwindcss from '@tailwindcss/postcss';
import { nitro } from 'nitro/vite';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    plugins: [vinext(), nitro()],
    // Browser extensions can throw outside the app. Keep those errors in the
    // console instead of letting Vite cover the entire Dearly Us interface.
    server: { hmr: { overlay: false } },
  };
});
