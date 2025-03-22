import { defineConfig } from 'vite';

export default defineConfig({
  base: '/sap-exam-prep2/', // Update this to match your deployment subpath
  build: {
    outDir: 'dist', // Ensure this matches your output directory
  },
});

