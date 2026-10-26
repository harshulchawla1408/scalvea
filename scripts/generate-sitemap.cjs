const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOSTNAME = 'https://scalvea.com';
const SUPABASE_URL = 'https://dtehgajreecaonqalxlf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE';

/**
 * Get reliable last modification date (YYYY-MM-DD) from Git log,
 * falling back to file mtime, then fallback date.
 * Never assigns today's date to unchanged files.
 */
function getFileLastmod(relativeFilePath, fallbackDate = '2026-10-24') {
  try {
    const fullPath = path.resolve(__dirname, '..', relativeFilePath);
    if (fs.existsSync(fullPath)) {
      const gitDate = execSync(`git log -1 --format=%cs -- "${fullPath}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
        return gitDate;
      }
      const stat = fs.statSync(fullPath);
      return stat.mtime.toISOString().split('T')[0];
    }
  } catch (_) {}
  return fallbackDate;
}

// Canonical static routes mapped to their primary source file
const staticRoutesConfig = [
  { path: '/',                     priority: '1.0', changefreq: 'daily',   source: 'src/pages/Index.tsx' },
  { path: '/shop',                 priority: '0.9', changefreq: 'daily',   source: 'src/pages/Shop.tsx' },
  { path: '/about',                priority: '0.8', changefreq: 'weekly',  source: 'src/pages/About.tsx' },
  { path: '/contact',              priority: '0.8', changefreq: 'weekly',  source: 'src/pages/Contact.tsx' },
  { path: '/blogs',                priority: '0.8', changefreq: 'daily',   source: 'src/pages/BlogList.tsx' },
  { path: '/videos',               priority: '0.8', changefreq: 'weekly',  source: 'src/pages/VideoList.tsx' },
  { path: '/faq',                  priority: '0.7', changefreq: 'weekly',  source: 'src/pages/FAQ.tsx' },
  { path: '/shipping-policy',      priority: '0.5', changefreq: 'monthly', source: 'src/pages/ShippingPolicy.tsx' },
  { path: '/returns-policy',       priority: '0.5', changefreq: 'monthly', source: 'src/pages/ReturnsPolicy.tsx' },
  { path: '/privacy-policy',       priority: '0.5', changefreq: 'monthly', source: 'src/pages/PrivacyPolicy.tsx' },
  { path: '/terms-of-service',     priority: '0.5', changefreq: 'monthly', source: 'src/pages/TermsOfService.tsx' },
  { path: '/payment-policy',       priority: '0.5', changefreq: 'monthly', source: 'src/pages/PaymentPolicy.tsx' },
  { path: '/cancellation-policy',  priority: '0.5', changefreq: 'monthly', source: 'src/pages/CancellationPolicy.tsx' },
];

// Dedicated video watch pages
const videoWatchRoutes = [
  {
    path: '/videos/follicle-8-application-guide',
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: '2026-09-01',
    video: {
      title: 'How to Apply Scalvea Follicle 8 Hair Growth Serum — Demonstration & Routine Guide',
      description: 'Watch how to apply Scalvea Follicle 8 Hair Growth Serum featuring 4% Anagain, 3% Redensyl, 3% Baicapil, and 3% Procapil.',
      contentUrl: 'https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/Reel4.mp4',
      thumbnailUrl: `${HOSTNAME}/og-image.webp`,
      duration: 45,
      uploadDate: '2026-09-01T08:00:00+00:00'
    }
  },
  {
    path: '/videos/scalvea-hair-growth-science-showcase',
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: '2026-09-05',
    video: {
      title: 'Scalvea Hair & Scalp Care — Formulation & Active Ingredients Showcase',
      description: 'Explore Scalvea science-backed hair growth and scalp revitalization solutions.',
      contentUrl: 'https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/demanded.mp4',
      thumbnailUrl: `${HOSTNAME}/og-image.webp`,
      duration: 30,
      uploadDate: '2026-09-05T08:00:00+00:00'
    }
  },
  {
    path: '/videos/about-scalvea-brand-story',
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: '2026-09-01',
    video: {
      title: 'The Scalvea Story — Australian Science Meets Daily Hair Wellness',
      description: 'Our journey, philosophy, and dedication to transparent, clinically inspired formulations.',
      contentUrl: 'https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/About.mp4',
      thumbnailUrl: `${HOSTNAME}/og-image.webp`,
      duration: 60,
      uploadDate: '2026-09-01T08:00:00+00:00'
    }
  }
];

function getBlogRoutes() {
  const routes = [];
  try {
    const blogsDir = path.resolve(__dirname, '../src/content/blogs');
    if (fs.existsSync(blogsDir)) {
      const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of files) {
        const fullPath = path.join(blogsDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const slugMatch = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
        const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.mdx?$/, '');
        const lastmod = getFileLastmod(`src/content/blogs/${file}`);
        routes.push({
          path: `/blogs/${slug}`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod
        });
      }
    }
  } catch (error) {
    console.warn('[sitemap] Could not read blog files:', error.message);
  }
  return routes;
}

async function getProductRoutes() {
  const routes = [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=slug,is_active_australia,is_active_india,updated_at`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (response.ok) {
      const products = await response.json();
      if (Array.isArray(products) && products.length > 0) {
        const active = products.filter(p => (p.is_active_australia ?? true) || (p.is_active_india ?? true));
        active.forEach(p => {
          if (p.slug) {
            const lastmod = p.updated_at ? p.updated_at.split('T')[0] : getFileLastmod('src/pages/ProductDetail.tsx');
            routes.push({
              path: `/product/${p.slug}`,
              priority: '0.8',
              changefreq: 'weekly',
              lastmod
            });
          }
        });
      }
    }
  } catch (error) {
    console.warn('[sitemap] Supabase product fetch error, using fallback:', error.message);
    const fallbackProducts = ['follicle-8-hair-growth-serum', 'scalp-5-anti-dandruff-hair-serum'];
    fallbackProducts.forEach(slug => {
      routes.push({
        path: `/product/${slug}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: getFileLastmod('src/pages/ProductDetail.tsx')
      });
    });
  }
  return routes;
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildSitemap() {
  console.log('[sitemap] Generating canonical sitemap.xml and video-sitemap.xml...');

  // 1. Static routes with per-file lastmod
  const staticRoutes = staticRoutesConfig.map(r => ({
    path: r.path,
    priority: r.priority,
    changefreq: r.changefreq,
    lastmod: getFileLastmod(r.source)
  }));

  // 2. Blog routes
  const blogRoutes = getBlogRoutes();

  // 3. Product routes
  const productRoutes = await getProductRoutes();

  // 4. Video watch page routes
  const videoRoutes = videoWatchRoutes.map(v => ({
    path: v.path,
    priority: v.priority,
    changefreq: v.changefreq,
    lastmod: v.lastmod
  }));

  const allRoutes = [...staticRoutes, ...productRoutes, ...videoRoutes, ...blogRoutes];

  // Deduplicate and filter non-canonical
  const seenPaths = new Set();
  const canonicalRoutes = allRoutes.filter(r => {
    if (!r.path || r.path.includes('?') || seenPaths.has(r.path)) return false;
    seenPaths.add(r.path);
    return true;
  });

  // ── Build Main sitemap.xml ───────────────────────────────────────────────
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';

  canonicalRoutes.forEach(r => {
    xml += '  <url>\n';
    xml += `    <loc>${HOSTNAME}${r.path}</loc>\n`;
    xml += `    <lastmod>${r.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
    xml += `    <priority>${r.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  // ── Build Video sitemap.xml ──────────────────────────────────────────────
  // Uses dedicated watch pages (/videos/[slug]) as <loc>, content_loc as direct media
  // Omits player_loc to guarantee 0% conflict with parent loc
  let videoXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  videoXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  videoXml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

  videoWatchRoutes.forEach(v => {
    xml += '';
    videoXml += '  <url>\n';
    videoXml += `    <loc>${HOSTNAME}${v.path}</loc>\n`;
    videoXml += '    <video:video>\n';
    videoXml += `      <video:thumbnail_loc>${escapeXml(v.video.thumbnailUrl)}</video:thumbnail_loc>\n`;
    videoXml += `      <video:title>${escapeXml(v.video.title)}</video:title>\n`;
    videoXml += `      <video:description>${escapeXml(v.video.description)}</video:description>\n`;
    videoXml += `      <video:content_loc>${escapeXml(v.video.contentUrl)}</video:content_loc>\n`;
    videoXml += `      <video:duration>${v.video.duration}</video:duration>\n`;
    videoXml += `      <video:publication_date>${v.video.uploadDate}</video:publication_date>\n`;
    videoXml += '      <video:family_friendly>yes</video:family_friendly>\n';
    videoXml += '    </video:video>\n';
    videoXml += '  </url>\n';
  });

  videoXml += '</urlset>\n';

  // ── Write output to both dist/ and public/ ────────────────────────────────
  const distDir = path.resolve(__dirname, '../dist');
  const publicDir = path.resolve(__dirname, '../public');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Write sitemap.xml to both locations
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] ✓ sitemap.xml generated with ${canonicalRoutes.length} canonical URLs.`);
  console.log(`          Written to: dist/sitemap.xml & public/sitemap.xml`);

  // Write video-sitemap.xml to both locations
  fs.writeFileSync(path.join(distDir, 'video-sitemap.xml'), videoXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'video-sitemap.xml'), videoXml, 'utf8');
  console.log(`[sitemap] ✓ video-sitemap.xml generated with ${videoWatchRoutes.length} compliant video watch entries.`);
  console.log(`          Written to: dist/video-sitemap.xml & public/video-sitemap.xml`);

  // Ensure robots.txt is present in dist
  const robotsSrc = path.join(publicDir, 'robots.txt');
  const robotsDist = path.join(distDir, 'robots.txt');
  if (fs.existsSync(robotsSrc)) {
    fs.copyFileSync(robotsSrc, robotsDist);
    console.log('[sitemap] ✓ robots.txt synced to dist/robots.txt');
  }
}

buildSitemap();
