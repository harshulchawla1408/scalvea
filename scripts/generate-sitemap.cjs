const fs = require('fs');
const path = require('path');

const HOSTNAME = 'https://scalvea.com';
const SUPABASE_URL = 'https://dtehgajreecaonqalxlf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE';

// Define static routes with their SEO priorities and change frequencies
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.8', changefreq: 'weekly' },
  { path: '/support', priority: '0.8', changefreq: 'weekly' },
  { path: '/faq', priority: '0.8', changefreq: 'weekly' },
  { path: '/faqs', priority: '0.8', changefreq: 'weekly' },
  { path: '/shipping-returns', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-of-service', priority: '0.5', changefreq: 'monthly' },
  { path: '/shipping-policy', priority: '0.5', changefreq: 'monthly' },
  { path: '/returns-policy', priority: '0.5', changefreq: 'monthly' }
];

const staticProducts = [
  'follicle-8-hair-growth-serum',
  'hair-growth-serum-black-edition',
  'follicle-8-spray-serum'
];

const staticCategories = ['Serums', 'Sprays'];

async function getDynamicRoutes() {
  const routes = [];

  // Pre-seed static products and categories to guarantee their presence in the sitemap
  staticProducts.forEach(slug => {
    routes.push({
      path: `/product/${slug}`,
      priority: '0.8',
      changefreq: 'weekly'
    });
  });

  staticCategories.forEach(cat => {
    routes.push({
      path: `/shop?category=${encodeURIComponent(cat)}`,
      priority: '0.7',
      changefreq: 'weekly'
    });
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=slug,category,is_active_australia,is_active_india`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (response.ok) {
      const products = await response.json();
      if (Array.isArray(products) && products.length > 0) {
        // Filter active products
        const activeProducts = products.filter(p => (p.is_active_australia ?? true) || (p.is_active_india ?? true));

        // Add dynamic Product routes
        activeProducts.forEach(p => {
          if (p.slug) {
            routes.push({
              path: `/product/${p.slug}`,
              priority: '0.8',
              changefreq: 'weekly'
            });
          }
        });

        // Add dynamic Category routes
        const categories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))];
        categories.forEach(cat => {
          routes.push({
            path: `/shop?category=${encodeURIComponent(cat)}`,
            priority: '0.7',
            changefreq: 'weekly'
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching dynamic routes for sitemap:', error);
  }

  // Deduplicate routes by path
  const seenPaths = new Set();
  return routes.filter(r => {
    if (seenPaths.has(r.path)) {
      return false;
    }
    seenPaths.add(r.path);
    return true;
  });
}

async function buildSitemap() {
  console.log('Generating sitemap.xml...');
  const dynamicRoutes = await getDynamicRoutes();
  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  const lastmod = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';

  allRoutes.forEach(r => {
    // Escape query parameters for XML validity
    const escapedPath = r.path.replace(/&/g, '&amp;');
    xml += '  <url>\n';
    xml += `    <loc>${HOSTNAME}${escapedPath}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
    xml += `    <priority>${r.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  const distDir = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const sitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Sitemap generated successfully at: ${sitemapPath}`);

  // Copy robots.txt from public to dist to prevent plugins from overwriting it
  const robotsSrc = path.resolve(__dirname, '../public/robots.txt');
  const robotsDist = path.join(distDir, 'robots.txt');
  if (fs.existsSync(robotsSrc)) {
    fs.copyFileSync(robotsSrc, robotsDist);
    console.log(`Robots.txt copied successfully from public/ to dist/`);
  }
}

buildSitemap();
