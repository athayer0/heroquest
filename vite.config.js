import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the built game works from any subfolder,
  // e.g. https://<user>.github.io/<repo>/ on GitHub Pages.
  base: './',
});
