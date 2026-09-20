import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // Only tag components during development (not SSR build)
      !isSsrBuild && componentTagger(),
      // Bundle visualizer only for client production builds
      !isSsrBuild && mode === 'production' && visualizer({
        filename: "dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: true,
    },
    // SSR build configuration
    ...(isSsrBuild && {
      build: {
        outDir: "dist/.ssr",
        rollupOptions: {
          input: "src/entry-server.tsx",
        },
        // Emit CJS for Node.js compatibility in the prerender script
        ssr: "src/entry-server.tsx",
      },
      ssr: {
        // Don't externalize these — they need to be bundled for SSR
        noExternal: [
          "@radix-ui",
          "lucide-react",
          "framer-motion",
          "lenis",
          "embla-carousel-react",
        ],
      },
    }),
  };
});
