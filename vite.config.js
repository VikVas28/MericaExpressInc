import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built site works from GitHub Pages (/docs) at any path.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
