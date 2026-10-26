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
        const seoTitleMatch = content.match(/^seoTitle:\s*["']?([^"'\n]+)["']?/m);
        const seoDescMatch = content.match(/^seoDescription:\s*["']?([^"'\n]+)["']?/m);
        
        const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.mdx?$/, '');
        const title = titleMatch ? titleMatch[1].trim() : '';
        const description = descMatch ? descMatch[1].trim() : '';
        const seoTitle = seoTitleMatch ? seoTitleMatch[1].trim() : '';
        const seoDescription = seoDescMatch ? seoDescMatch[1].trim() : '';
        
        blogs.push({ slug, title, description, seoTitle, seoDescription });
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

    // Persist a snapshot for SSR fallback
    try {
      const snapshotPath = path.resolve(__dirname, '../src/data/products_snapshot.json');
      fs.writeFileSync(snapshotPath, JSON.stringify(products, null, 2));
    } catch (_) {}

    return products
      .filter(p => (p.is_active_australia ?? true) || (p.is_active_india ?? true))
      .map(p => p.slug)
      .filter(Boolean);
  } catch (e) {
    console.warn('[prerender] Could not fetch product slugs:', e.message);
    // Try loading the snapshot fallback
    try {
      const snapshotPath = path.resolve(__dirname, '../src/data/products_snapshot.json');
      if (fs.existsSync(snapshotPath)) {
        const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        return snapshot.map((p) => p.slug).filter(Boolean);
      }
    } catch (_) {}
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
  const cleanTemplatePath = path.join(distDir, '.template.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[prerender] ERROR: dist/index.html not found.`);
    console.error('  Run `vite build` before `npm run prerender`.');
    process.exit(1);
  }

  console.log('[prerender] Loading SSR bundle…');
  const { render } = await import(pathToFileURL(ssrBundle).href);
  let template = fs.existsSync(cleanTemplatePath)
    ? fs.readFileSync(cleanTemplatePath, 'utf-8')
    : fs.readFileSync(templatePath, 'utf-8');
  if (!fs.existsSync(cleanTemplatePath) && template.includes('<!--ssr-outlet-->')) {
    fs.writeFileSync(cleanTemplatePath, template, 'utf-8');
  }

  // ── Critical CSS Dynamic Extraction & Non-Blocking Loading ────────────────
  const criticalCssPath = path.resolve(__dirname, '../src/critical.css');
  let criticalCss = '';
  try {
    const assetsDir = path.join(distDir, 'assets');
    const distAssets = fs.readdirSync(assetsDir);
    const cssFile = distAssets.find(f => f.startsWith('index-') && f.endsWith('.css'));
    if (cssFile) {
      const fullCss = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
      const homeHtml = render('/');
      const combinedHtml = template + '\n' + homeHtml;
      const classMatches = combinedHtml.matchAll(/class="([^"]+)"/g);
      const usedClasses = new Set();
      for (const m of classMatches) {
        m[1].split(/\s+/).forEach(c => { if (c) usedClasses.add(c); });
      }

      const fontFaces = fullCss.match(/@font-face\s*\{[^}]+\}/g) || [];
      const rootDecls = fullCss.match(/:root\s*\{[^}]+\}/g) || [];
      const universalRules = fullCss.match(/(\*|body|html)[^{]*\{[^}]+\}/g) || [];

      const extractedRules = new Set([
        ...fontFaces,
        ...rootDecls,
        ...universalRules
      ]);

      const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
      let match;
      while ((match = ruleRegex.exec(fullCss)) !== null) {
        const selector = match[1].trim();
        const body = match[2].trim();
        let isUsed = false;
        for (const cls of usedClasses) {
          const escaped = cls.replace(/[[\]()#%]/g, '\\$&');
          if (new RegExp('\\.' + escaped + '(?=[^a-zA-Z0-9_-]|$)', 'i').test(selector)) {
            isUsed = true;
            break;
          }
        }
        if (isUsed || selector.includes(':root') || selector.includes('body') || selector.includes('html')) {
          extractedRules.add(`${selector}{${body}}`);
        }
      }

      const mediaRegex = /@media[^{]+\{(?:[^{}]+\{[^{}]+\})+\}/g;
      while ((match = mediaRegex.exec(fullCss)) !== null) {
        const mediaBlock = match[0];
        let isUsed = false;
        for (const cls of usedClasses) {
          if (mediaBlock.includes('.' + cls)) {
            isUsed = true;
            break;
          }
        }
        if (isUsed) {
          extractedRules.add(mediaBlock);
        }
      }

      criticalCss = Array.from(extractedRules).join('\n');
      fs.writeFileSync(criticalCssPath, criticalCss, 'utf8');
    }
  } catch (err) {
    console.warn('[prerender] Dynamic critical CSS generation note:', err.message);
  }

  if (!criticalCss && fs.existsSync(criticalCssPath)) {
    criticalCss = fs.readFileSync(criticalCssPath, 'utf-8').trim();
  }

  if (criticalCss) {
    const cssLinkRegex = /<link\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/index-[^"]+\.css)">/i;
    const match = template.match(cssLinkRegex);
    if (match) {
      const cssHref = match[1];
      const nonBlockingReplacement = [
        `<style id="scalvea-critical-css">${criticalCss}</style>`,
        `<link rel="preload" href="${cssHref}" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
        `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`
      ].join('\n  ');
      template = template.replace(match[0], nonBlockingReplacement);
      console.log(`[prerender] ✓ Inlined Critical CSS (${(criticalCss.length / 1024).toFixed(1)} KiB) and deferred ${cssHref} without render-blocking.`);
    }
  }

  // ── Collect all routes ───────────────────────────────────────────────────
  const staticRoutes = [
    '/',
    '/shop',
    '/about',
    '/contact',
    '/blogs',
    '/videos',
    '/videos/follicle-8-application-guide',
    '/videos/scalvea-hair-growth-science-showcase',
    '/videos/about-scalvea-brand-story',
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

      // Replace the <!--ssr-outlet--> placeholder or #root content with the rendered HTML
      let html = template.includes('<!--ssr-outlet-->')
        ? template.replace('<!--ssr-outlet-->', appHtml)
        : template.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${appHtml}</div>`);

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
        '/shop': {
          title: "Hair Care Products | Hair Growth & Scalp Care Serums | Scalvea",
          description: "Shop Scalvea's science-backed hair growth serums and anti-dandruff scalp treatments. Clinically researched ingredients, lightweight formulas. Free shipping to Australia & India."
        },
        '/about': {
          title: "About Scalvea | Science-Backed Hair Care",
          description: "Scalvea was built on one belief: that hair care should be honest, transparent, and clinically grounded. Read the story behind the brand."
        },
        '/blogs': {
          title: "Hair Care Journal | Hair Growth, Scalp Care & Ingredient Guides | Scalvea",
          description: "Science-backed hair care articles, scalp health guides, ingredient breakdowns, and hair growth research from the Scalvea team. Practical advice for Australia & India."
        },
        '/videos': {
          title: "Hair Care Guides & Application Videos | Scalvea",
          description: "Watch Scalvea educational videos: Follicle 8 application guides, hair growth science breakdowns, and ingredient tutorials. Clinically inspired scalp care."
        },
        '/videos/follicle-8-application-guide': {
          title: "How to Apply Follicle 8 Hair Growth Serum | Scalvea Video Guide",
          description: "Watch our step-by-step application guide for Scalvea Follicle 8 Hair Growth Serum. Learn how to target thinning areas and maximize follicle absorption daily."
        },
        '/videos/scalvea-hair-growth-science-showcase': {
          title: "Scalvea Formulation & Active Ingredients Showcase | Video",
          description: "Discover the science behind Scalvea hair growth serums and scalp care formulations. Explore clinically researched actives designed for scalp comfort and follicle resilience."
        },
        '/videos/about-scalvea-brand-story': {
          title: "The Scalvea Story — Brand Journey & Philosophy | Scalvea Video",
          description: "Watch the story behind Scalvea. Learn how clinical transparency, evidence-backed hair care actives, and Australian formulation principles shape our products."
        },
        '/contact': {
          title: "Contact Scalvea | Hair Care Support & Enquiries",
          description: "Get in touch with the Scalvea team. We aim to respond to all inquiries within 24 hours. Connect with us for support, wholesale, or press."
        },
        '/faq': {
          title: "FAQ – Hair Care Questions Answered | Scalvea",
          description: "Answers to common questions about Scalvea hair growth serums, anti-dandruff treatments, shipping, returns, and ingredients."
        },
        '/shipping-policy': {
          title: "Shipping Policy | Scalvea",
          description: "Scalvea shipping information for Australia and India — delivery timelines, free shipping thresholds, order tracking, and dispatch guidelines."
        },
        '/returns-policy': {
          title: "Returns & Refunds Policy | Scalvea",
          description: "Scalvea's returns and refunds policy — eligibility, process, timelines, and how to request a return for orders in Australia and India."
        },
        '/terms-of-service': {
          title: "Terms of Service | Scalvea",
          description: "Read Scalvea's terms of service governing purchases, pricing, orders, and website usage terms."
        },
        '/privacy-policy': {
          title: "Privacy Policy | Scalvea",
          description: "Learn how Scalvea collects, uses, and safeguards your personal data under global data protection standards."
        },
        '/payment-policy': {
          title: "Payment Policy | Scalvea",
          description: "Learn about Scalvea's secure payment methods, billing, and failed transaction resolution guidelines for India and Australia."
        },
        '/cancellation-policy': {
          title: "Cancellation Policy | Scalvea",
          description: "Read Scalvea's order cancellation terms — timelines, dispatch rules, and approval guidelines."
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
          // Issue 10: Use seoTitle from frontmatter if available, else append | Scalvea to raw title
          const finalTitle = blog.seoTitle || `${blog.title} | Scalvea`;
          const finalDesc = blog.seoDescription || blog.description;
          seo = { title: finalTitle, description: finalDesc };
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

      // ── Issue 11: Inject correct per-route canonical ─────────────────────
      // The index.html template has canonical pointing to homepage.
      // Every prerendered page needs its own canonical injected before JS hydrates.
      const canonicalUrl = `https://scalvea.com${route === '/' ? '/' : route}`;
      if (html.includes('<link rel="canonical"')) {
        html = html.replace(
          /<link rel="canonical"[^>]*>/,
          `<link rel="canonical" href="${canonicalUrl}" />`
        );
      } else {
        html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
      }

      // ── Issue 12: Inject correct per-route og:url ────────────────────────
      if (html.includes('property="og:url"')) {
        html = html.replace(
          /<meta property="og:url"[^>]*>/,
          `<meta property="og:url" content="${canonicalUrl}" />`
        );
      } else {
        html = html.replace('</head>', `  <meta property="og:url" content="${canonicalUrl}" />\n</head>`);
      }

      if (noindex) {
        // Replace or add noindex
        if (html.includes('<meta name="robots"')) {
          html = html.replace(/<meta name="robots"[\s\n]*content="[^"]*"/, `<meta name="robots" content="noindex, follow"`);
        } else {
          html = html.replace(/<\/head>/, `  <meta name="robots" content="noindex, follow" />\n</head>`);
        }
      }

      // ── Issue 1: Responsive LCP Hero Image Preload for Route / ───
      if (route === '/') {
        const heroPicMatch = appHtml.match(/<picture[^>]*>([\s\S]*?)<\/picture>/);
        if (heroPicMatch) {
          const picInner = heroPicMatch[1];
          const sourceMatch = picInner.match(/<source\b[^>]*>/);
          const imgMatch = picInner.match(/<img\b[^>]*>/);
          let preloadTags = '';

          if (imgMatch) {
            const srcMatch = imgMatch[0].match(/\bsrc="([^"]+)"/i);
            const srcSetMatch = imgMatch[0].match(/\bsrcset="([^"]+)"/i);
            const sizesMatch = imgMatch[0].match(/\bsizes="([^"]+)"/i);
            if (srcMatch && srcSetMatch) {
              const sizesAttr = sizesMatch ? ` imagesizes="${sizesMatch[1]}"` : '';
              preloadTags += `  <link rel="preload" as="image" href="${srcMatch[1]}" imagesrcset="${srcSetMatch[1]}"${sizesAttr} media="(min-width: 769px)" fetchpriority="high">\n`;
            }
          }

          if (sourceMatch) {
            const srcSetMatch = sourceMatch[0].match(/\bsrcset="([^"]+)"/i);
            const sizesMatch = sourceMatch[0].match(/\bsizes="([^"]+)"/i);
            if (srcSetMatch) {
              const firstHref = srcSetMatch[1].split(',')[0].trim().split(' ')[0];
              const sizesAttr = sizesMatch ? ` imagesizes="${sizesMatch[1]}"` : '';
              preloadTags += `  <link rel="preload" as="image" href="${firstHref}" imagesrcset="${srcSetMatch[1]}"${sizesAttr} media="(max-width: 768px)" fetchpriority="high">\n`;
            }
          }

          if (preloadTags) {
            html = html.replace('</head>', `${preloadTags}</head>`);
            console.log('[prerender] ✓ Injected responsive LCP hero preloads for route /');
          }
        }
      }

      // Determine output path: / → dist/index.html, /shop → dist/shop/index.html
      const outDir = route === '/'
        ? distDir
        : path.join(distDir, route);

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
      if (route !== '/') {
        fs.writeFileSync(`${outDir}.html`, html, 'utf-8');
      }
      success++;
    } catch (err) {
      console.warn(`[prerender] WARN: Failed to render ${route}: ${err.message}`);
      failed++;
    }
  }

  console.log(`[prerender] Done. ✓ ${success} routes rendered, ${failed > 0 ? `⚠ ${failed} failed (served as SPA fallback)` : '0 failed'}.`);
}

main();
