const fs = require('fs');
const path = require('path');

const HOSTNAME = 'https://scalvea.com';
const SUPABASE_URL = 'https://dtehgajreecaonqalxlf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE';

// Define static routes with their SEO priorities and change frequencies
const staticRoutes = [
  { path: '/',                    priority: '1.0', changefreq: 'daily' },
  { path: '/shop',                priority: '0.9', changefreq: 'daily' },
  { path: '/about',               priority: '0.8', changefreq: 'weekly' },
  { path: '/contact',             priority: '0.8', changefreq: 'weekly' },
  { path: '/blogs',               priority: '0.8', changefreq: 'weekly' },
  { path: '/faqs',                priority: '0.7', changefreq: 'weekly' },
  { path: '/faq',                 priority: '0.7', changefreq: 'weekly' },
  { path: '/privacy-policy',      priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-conditions',    priority: '0.5', changefreq: 'monthly' },
  { path: '/return-refund-policy',priority: '0.5', changefreq: 'monthly' },
  { path: '/shipping-policy',     priority: '0.5', changefreq: 'monthly' },
  { path: '/payment-policy',      priority: '0.4', changefreq: 'monthly' },
];

const staticProducts = [
  'follicle-8-hair-growth-serum',
  'hair-growth-serum-black-edition',
  'follicle-8-spray-serum'
];

const staticCategories = ['Serums', 'Sprays'];

// Read blog slugs from MDX frontmatter
function getBlogRoutes() {
  const routes = [];
  try {
    const blogsDir = path.resolve(__dirname, '../src/content/blogs');
    if (fs.existsSync(blogsDir)) {
      const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(blogsDir, file), 'utf-8');
        const slugMatch = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
        const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.mdx?$/, '');
        routes.push({
          path: `/blogs/${slug}`,
          priority: '0.7',
          changefreq: 'monthly'
        });
      }
    }
  } catch (error) {
    console.warn('Could not read blog files for sitemap:', error);
  }
  return routes;
}

async function getDynamicRoutes() {
  const routes = [];

  // Static products
  staticProducts.forEach(slug => {
    routes.push({ path: `/product/${slug}`, priority: '0.8', changefreq: 'weekly' });
  });

  // Static categories
  staticCategories.forEach(cat => {
    routes.push({ path: `/shop?category=${encodeURIComponent(cat)}`, priority: '0.7', changefreq: 'weekly' });
  });

  // Blog routes from MDX files
  routes.push(...getBlogRoutes());

  // Live products from Supabase
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
        const activeProducts = products.filter(p => (p.is_active_australia ?? true) || (p.is_active_india ?? true));

        activeProducts.forEach(p => {
          if (p.slug) {
            routes.push({ path: `/product/${p.slug}`, priority: '0.8', changefreq: 'weekly' });
          }
        });

        const categories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))];
        categories.forEach(cat => {
          routes.push({ path: `/shop?category=${encodeURIComponent(cat)}`, priority: '0.7', changefreq: 'weekly' });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching dynamic routes for sitemap:', error);
  }

  // Deduplicate routes by path
  const seenPaths = new Set();
  return routes.filter(r => {
    if (seenPaths.has(r.path)) return false;
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
  console.log(`  ✓ ${allRoutes.length} URLs indexed (incl. ${getBlogRoutes().length} blogs)`);

  // Copy robots.txt from public to dist
  const robotsSrc = path.resolve(__dirname, '../public/robots.txt');
  const robotsDist = path.join(distDir, 'robots.txt');
  if (fs.existsSync(robotsSrc)) {
    fs.copyFileSync(robotsSrc, robotsDist);
    console.log('Robots.txt copied successfully from public/ to dist/');
  }
}

buildSitemap();
