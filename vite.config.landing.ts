import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.PNG"],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "/rapportini360/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/landing"),
    emptyOutDir: true,
    target: "es2015",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "client", "landing.html"),
    },
  },
});
