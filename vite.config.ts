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
          // Manual chunk splitting to eliminate unused JS from initial homepage load
          manualChunks: isSsrBuild ? undefined : (id) => {
            // Internal runtime helpers: keep with vendor-react
            if (
              id.includes('vite/preload-helper') ||
              id.includes('modulepreload-polyfill') ||
              id.includes('commonjsHelpers')
            ) {
              return 'vendor-react';
            }

            if (id.includes('node_modules')) {
              // React core, router, react-is, babel runtime & scheduler
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/react-router/') ||
                id.includes('/react-router-dom/') ||
                id.includes('/scheduler/') ||
                id.includes('react-is') ||
                id.includes('@babel/runtime')
              ) {
                return 'vendor-react';
              }

              // Isolated heavy PDF & canvas tools (NEVER loaded on public routes)
              if (
                id.includes('jspdf') ||
                id.includes('jspdf-autotable') ||
                id.includes('canvg') ||
                id.includes('html2canvas') ||
                id.includes('dompurify')
              ) {
                return 'vendor-pdf';
              }

              // Isolated charts (only loaded on admin / analytics)
              if (
                id.includes('recharts') ||
                id.includes('d3-') ||
                id.includes('victory-vendor') ||
                id.includes('decimal.js-light')
              ) {
                return 'vendor-charts';
              }

              // Framer motion (isolated for routes that animate)
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }

              // Stripe SDK
              if (id.includes('@stripe/stripe-js')) {
                return 'vendor-stripe';
              }

              // Supabase client
              if (id.includes('@supabase/')) {
                return 'vendor-supabase';
              }

              // TanStack Query
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }

              // Radix UI: Primitives + Toast + Tooltip + Dialog/Sheet in core, heavy components (select, tabs, accordion) in heavy
              if (id.includes('@radix-ui/')) {
                if (
                  id.includes('primitive') ||
                  id.includes('compose-refs') ||
                  id.includes('context') ||
                  id.includes('react-slot') ||
                  id.includes('react-use-') ||
                  id.includes('react-id') ||
                  id.includes('react-presence') ||
                  id.includes('react-portal') ||
                  id.includes('react-dismissable-layer') ||
                  id.includes('react-focus-scope') ||
                  id.includes('react-focus-guards') ||
                  id.includes('react-arrow') ||
                  id.includes('react-popper') ||
                  id.includes('react-collection') ||
                  id.includes('react-visually-hidden') ||
                  id.includes('react-direction') ||
                  id.includes('react-dialog') ||
                  id.includes('react-toast') ||
                  id.includes('react-tooltip')
                ) {
                  return 'vendor-radix-core';
                }
                return 'vendor-radix-heavy';
              }

              // Styling utilities (clsx, tailwind-merge, cva)
              if (
                id.includes('clsx') ||
                id.includes('tailwind-merge') ||
                id.includes('class-variance-authority')
              ) {
                return 'vendor-utils';
              }
            }
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
