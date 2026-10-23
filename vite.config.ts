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
      // Disable source maps in production to reduce bundle size
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Manual chunk splitting to reduce initial JS bundle
          manualChunks: isSsrBuild ? undefined : {
            // Vendor: React core
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Framer Motion — heavy animation library
            'vendor-motion': ['framer-motion'],
            // Radix UI primitives — tree-shake by grouping commonly used ones
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-accordion',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-popover',
              '@radix-ui/react-dropdown-menu',
            ],
            // Supabase client
            'vendor-supabase': ['@supabase/supabase-js'],
            // TanStack Query
            'vendor-query': ['@tanstack/react-query'],
            // Heavy utilities (only loaded on specific pages)
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            'vendor-charts': ['recharts'],
            'vendor-stripe': ['@stripe/stripe-js'],
          },
        },
      },
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
