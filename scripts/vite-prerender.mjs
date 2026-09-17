/**
 * vite-prerender.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Post-build static site generation script.
 *
 * How it works:
 *  1. Reads the Vite client build output (dist/index.html) as an HTML template.
 *  2. Loads the SSR server bundle (dist/.ssr/entry-server.js).
 *  3. For every public route, calls render(url) to get React's HTML output.
 *  4. Injects the rendered HTML into the <!--ssr-outlet--> placeholder.
 *  5. Writes the resulting file to dist/<route>/index.html.
 *
 * The result: Nginx serves fully-rendered HTML for the first request on any
 * known route. Subsequent navigation is handled by the SPA (React Router).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// ── Node.js environment polyfills ─────────────────────────────────────────────
// Supabase client, and potentially other browser libraries, reference
// localStorage/sessionStorage/window at module load time. We provide minimal
// in-memory shims so imports don't throw in the Node.js SSR environment.
// These are never persisted — SSR renders are stateless.
const memStore = {};
const storageMock = {
  getItem: (k) => memStore[k] ?? null,
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
  clear: () => { Object.keys(memStore).forEach(k => delete memStore[k]); },
  get length() { return Object.keys(memStore).length; },
  key: (i) => Object.keys(memStore)[i] ?? null,
};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = storageMock;
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = storageMock;
}
// NOTE: We intentionally do NOT set globalThis.window = globalThis.
// This keeps typeof window === 'undefined' true during SSR so all
// browser-only guards in the app code (contexts, animations, etc.) work correctly.
// ──────────────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const ssrBundle = path.resolve(__dirname, '../dist/.ssr/entry-server.js');

const SUPABASE_URL = 'https://dtehgajreecaonqalxlf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE';

/** Read blogs from MDX frontmatter */
function getBlogs() {
  const blogs = [];
  try {
    const blogsDir = path.resolve(__dirname, '../src/content/blogs');
    if (fs.existsSync(blogsDir)) {
      const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(blogsDir, file), 'utf-8');
        const slugMatch = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
        const titleMatch = content.match(/^title:\s*["']?([^"'\n]+)["']?/m);
        const descMatch = content.match(/^description:\s*["']?([^"'\n]+)["']?/m);
        
        const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.mdx?$/, '');
        const title = titleMatch ? titleMatch[1].trim() : '';
        const description = descMatch ? descMatch[1].trim() : '';
        
        blogs.push({ slug, title, description });
      }
    }
  } catch (e) {
    console.warn('[prerender] Could not read blog files:', e.message);
  }
  return blogs;
}

/** Fetch active product slugs from Supabase */
async function getProductSlugs() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=slug,is_active_australia,is_active_india`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    const products = await res.json();
    return products
      .filter(p => (p.is_active_australia ?? true) || (p.is_active_india ?? true))
      .map(p => p.slug)
      .filter(Boolean);
  } catch (e) {
    console.warn('[prerender] Could not fetch product slugs:', e.message);
    return [];
  }
}

async function main() {
  // ── Sanity checks ────────────────────────────────────────────────────────
  if (!fs.existsSync(ssrBundle)) {
    console.error(`[prerender] ERROR: SSR bundle not found at ${ssrBundle}`);
    console.error('  Run `npm run build:ssr` before `npm run prerender`.');
    process.exit(1);
  }

  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[prerender] ERROR: dist/index.html not found.`);
    console.error('  Run `vite build` before `npm run prerender`.');
    process.exit(1);
  }

  console.log('[prerender] Loading SSR bundle…');
  const { render } = await import(pathToFileURL(ssrBundle).href);
  const template = fs.readFileSync(templatePath, 'utf-8');

  // ── Collect all routes ───────────────────────────────────────────────────
  const staticRoutes = [
    '/',
    '/shop',
    '/about',
    '/contact',
    '/blogs',
    '/faq',
    '/privacy-policy',
    '/terms-of-service',
    '/returns-policy',
    '/shipping-policy',
    '/payment-policy',
    '/cancellation-policy',
  ];

  const blogsData = getBlogs();
  const blogSlugs = blogsData.map(b => `/blogs/${b.slug}`);
  const productSlugs = (await getProductSlugs()).map(s => `/product/${s}`);

  const allRoutes = [...new Set([...staticRoutes, ...blogSlugs, ...productSlugs])];
  console.log(`[prerender] Pre-rendering ${allRoutes.length} routes…`);

  // ── Render each route ────────────────────────────────────────────────────
  let success = 0;
  let failed = 0;

  for (const route of allRoutes) {
    try {
      const appHtml = render(route);

      // Replace the <!--ssr-outlet--> placeholder with the rendered HTML
      let html = template.replace('<!--ssr-outlet-->', appHtml);

      // --- Inject SEO Metadata for specific routes ---
      const PRODUCT_SEO = {
        'scalp-5-anti-dandruff-hair-serum': {
          title: "Scalp-5 Anti-Dandruff Serum – Dandruff Control | Scalvea",
          description: "Soothe itchy, flaky scalps with our anti-dandruff hair serum. Formulated with Salicylic Acid, Rosemary Oil & Piroctone Olamine. Fast shipping available.",
        },
        'follicle-8-hair-growth-serum': {
          title: "Follicle 8 Hair Growth Serum – Hair Density Serum | Scalvea",
          description: "Support thicker, healthier-looking hair with Follicle 8 hair growth serum. Powered by Redensyl, Procapil, Baicapil & Anagain to help reduce hair fall.",
        }
      };

      const STATIC_SEO = {
        '/': {
          title: "Science-Backed Hair & Scalp Care | Scalvea",
          description: "Science-backed hair growth serums & scalp treatments formulated with clinically researched ingredients. Shop Follicle 8 & Scalp-5. Fast shipping to Australia & India."
        },
        '/about': {
          title: "Our Story – Science-Backed Hair Care Brand | Scalvea",
          description: "Scalvea was built on one belief: that hair care should be honest, transparent, and clinically grounded. Read the story behind the brand."
        },
        '/blogs': {
          title: "Hair Care Blog – Scalp Health & Ingredient Guides | Scalvea",
          description: "Expert guides on scalp health, hair fall, dandruff, and ingredient science — from the Scalvea team."
        },
        '/contact': {
          title: "Contact Scalvea – Customer Support & Enquiries",
          description: "Get in touch with the Scalvea team. We aim to respond to all inquiries within 24 hours. Connect with us for support, wholesale, or press."
        },
        '/faq': {
          title: "FAQ – Hair Care Questions Answered | Scalvea",
          description: "Answers to common questions about Scalvea hair growth serums, anti-dandruff treatments, shipping, returns, and ingredients."
        },
        '/terms-of-service': {
          title: "Terms of Service | Scalvea",
          description: "Read Scalvea's terms of service governing purchases, pricing, orders, and website usage terms.",
          noindex: true
        }
      };

      let seo = null;
      let noindex = false;

      if (route.startsWith('/product/')) {
        const slug = route.split('/')[2];
        seo = PRODUCT_SEO[slug];
      } else if (route.startsWith('/blogs/')) {
        const slug = route.split('/')[2];
        const blog = blogsData.find(b => b.slug === slug);
        if (blog && blog.title) {
          seo = { title: blog.title, description: blog.description };
        }
      } else {
        seo = STATIC_SEO[route];
        if (seo?.noindex) noindex = true;
      }

      if (seo) {
        html = html.replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`);
        if (seo.description) {
          html = html.replace(/<meta name="description"[\s\n]*content="[^"]*"/, `<meta name="description" content="${seo.description}"`);
        }
      }

      if (noindex) {
        // Replace or add noindex
        if (html.includes('<meta name="robots"')) {
          html = html.replace(/<meta name="robots"[\s\n]*content="[^"]*"/, `<meta name="robots" content="noindex, follow"`);
        } else {
          html = html.replace(/<\/head>/, `  <meta name="robots" content="noindex, follow" />\n</head>`);
        }
      }

      // Determine output path: / → dist/index.html, /shop → dist/shop/index.html
      const outDir = route === '/'
        ? distDir
        : path.join(distDir, route);

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
      success++;
    } catch (err) {
      console.warn(`[prerender] WARN: Failed to render ${route}: ${err.message}`);
      failed++;
    }
  }

  console.log(`[prerender] Done. ✓ ${success} routes rendered, ${failed > 0 ? `⚠ ${failed} failed (served as SPA fallback)` : '0 failed'}.`);
}

main();
