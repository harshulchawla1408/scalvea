import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import sitemap from 'vite-plugin-sitemap';

// Helper to fetch dynamic routes for products and categories from Supabase
async function getDynamicRoutes(env: Record<string, string>) {
  const routes = [
    '/',
    '/shop',
    '/about',
    '/contact',
    '/blogs',
    '/faqs',
    '/faq',
    '/privacy-policy',
    '/terms-conditions',
    '/return-refund-policy',
    '/shipping-policy',
    '/payment-policy',
  ];

  // ── Blog routes from MDX files ─────────────────────────────────────────────
  try {
    const blogsDir = path.resolve(__dirname, 'src/content/blogs');
    if (fs.existsSync(blogsDir)) {
      const blogFiles = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of blogFiles) {
        const content = fs.readFileSync(path.join(blogsDir, file), 'utf-8');
        const slugMatch = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
        const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.mdx?$/, '');
        routes.push(`/blogs/${slug}`);
      }
    }
  } catch (error) {
    console.warn('Could not read blog files for sitemap:', error);
  }

  // ── Pre-seed static products ───────────────────────────────────────────────
  const staticProducts = [
    'follicle-8-hair-growth-serum',
    'hair-growth-serum-black-edition',
    'follicle-8-spray-serum'
  ];
  staticProducts.forEach(slug => {
    routes.push(`/product/${slug}`);
  });

  const staticCategories = ['Serums', 'Sprays'];
  staticCategories.forEach(cat => {
    routes.push(`/shop?category=${encodeURIComponent(cat)}`);
  });

  // ── Fetch live products from Supabase ─────────────────────────────────────
  try {
    const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dtehgajreecaonqalxlf.supabase.co';
    const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE';

    if (supabaseUrl && supabaseKey) {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=slug,category,is_active_australia,is_active_india`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const products = await response.json();
        if (Array.isArray(products) && products.length > 0) {
          const activeProducts = products.filter((p: any) => (p.is_active_australia ?? true) || (p.is_active_india ?? true));

          activeProducts.forEach((p: any) => {
            if (p.slug) {
              routes.push(`/product/${p.slug}`);
            }
          });

          const categories = [...new Set(activeProducts.map((p: any) => p.category).filter(Boolean))];
          categories.forEach((cat: any) => {
            routes.push(`/shop?category=${encodeURIComponent(cat)}`);
          });
        }
      }
    }
  } catch (error) {
    console.warn('Could not fetch products from Supabase during build:', error);
  }

  // Deduplicate
  return [...new Set(routes)];
}


// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dynamicRoutes = await getDynamicRoutes(env);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      sitemap({
        hostname: 'https://scalvea.com',
        dynamicRoutes,
        exclude: ['/admin', '/account', '/checkout', '/cart', '/wishlist', '/auth']
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
