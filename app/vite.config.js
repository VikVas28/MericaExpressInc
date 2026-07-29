import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Source lives in app/. Build emits the static site to the repo ROOT
// (index.html + assets/) so GitHub Pages "deploy from branch → / (root)"
// works. We also mirror the output into /docs after building, so the site
// works whether Pages is set to root OR /docs. base:"./" keeps asset URLs
// relative, valid at any path.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "assets",
  },
});
