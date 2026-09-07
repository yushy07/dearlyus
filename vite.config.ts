import tailwindcss from '@tailwindcss/postcss';
import { nitro } from 'nitro/vite';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    plugins: [
      vinext(),
      nitro(),
    ],
  };
});
