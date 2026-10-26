import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');

console.log('=== COMPREHENSIVE TECHNICAL SEO & SITEMAP VALIDATION ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Validate main sitemap.xml exists and is valid XML
const distSitemap = path.join(distDir, 'sitemap.xml');
const publicSitemap = path.join(publicDir, 'sitemap.xml');

assert(fs.existsSync(distSitemap), 'dist/sitemap.xml exists');
assert(fs.existsSync(publicSitemap), 'public/sitemap.xml exists');

const sitemapContent = fs.readFileSync(distSitemap, 'utf8');
assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml starts with valid UTF-8 XML declaration');
assert(sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'sitemap.xml has valid sitemap namespace');
assert(!sitemapContent.includes('<!DOCTYPE html>'), 'sitemap.xml is NOT HTML');

// Count URLs in sitemap
const locMatches = sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g);
const sitemapUrls = Array.from(locMatches).map(m => m[1]);
assert(sitemapUrls.length === 30, `sitemap.xml contains exactly 30 canonical URLs (found ${sitemapUrls.length})`);

// Verify all URLs belong to https://scalvea.com and have no query params
const invalidHostUrls = sitemapUrls.filter(u => !u.startsWith('https://scalvea.com/'));
assert(invalidHostUrls.length === 0, 'All sitemap URLs use canonical hostname https://scalvea.com');
const queryParamUrls = sitemapUrls.filter(u => u.includes('?'));
assert(queryParamUrls.length === 0, 'No query parameters exist in sitemap URLs');

// 2. Validate video-sitemap.xml
const distVideoSitemap = path.join(distDir, 'video-sitemap.xml');
const publicVideoSitemap = path.join(publicDir, 'video-sitemap.xml');

assert(fs.existsSync(distVideoSitemap), 'dist/video-sitemap.xml exists');
assert(fs.existsSync(publicVideoSitemap), 'public/video-sitemap.xml exists');

const videoSitemapContent = fs.readFileSync(distVideoSitemap, 'utf8');
assert(videoSitemapContent.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'), 'video-sitemap.xml has Google Video sitemap namespace');

// Ensure NO player_loc conflicts with loc
const videoLocMatches = Array.from(videoSitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
const contentLocMatches = Array.from(videoSitemapContent.matchAll(/<video:content_loc>([^<]+)<\/video:content_loc>/g)).map(m => m[1]);
const playerLocMatches = Array.from(videoSitemapContent.matchAll(/<video:player_loc>([^<]+)<\/video:player_loc>/g)).map(m => m[1]);

assert(videoLocMatches.length === 3, `video-sitemap.xml contains 3 video watch page entries (found ${videoLocMatches.length})`);
assert(contentLocMatches.length === 3, `video-sitemap.xml contains 3 direct media content_loc entries (found ${contentLocMatches.length})`);
assert(playerLocMatches.length === 0, 'video:player_loc is omitted to prevent "player_loc is the same as parent loc" error');

// Verify all video locs point to dedicated watch pages
videoLocMatches.forEach(loc => {
  assert(loc.includes('/videos/'), `Video sitemap <loc> points to dedicated watch page: ${loc}`);
});

// 3. Validate watch pages in dist/
const videoWatchSlugs = [
  'follicle-8-application-guide',
  'scalvea-hair-growth-science-showcase',
  'about-scalvea-brand-story'
];

videoWatchSlugs.forEach(slug => {
  const watchPagePath = path.join(distDir, 'videos', slug, 'index.html');
  assert(fs.existsSync(watchPagePath), `Prerendered watch page exists: dist/videos/${slug}/index.html`);
  if (fs.existsSync(watchPagePath)) {
    const html = fs.readFileSync(watchPagePath, 'utf8');
    assert(html.includes('<video'), `Watch page contains <video tag: ${slug}`);
    assert(html.includes('"@type":"VideoObject"'), `Watch page contains VideoObject JSON-LD schema: ${slug}`);
    assert(html.includes(`<link rel="canonical" href="https://scalvea.com/videos/${slug}" />`), `Watch page has self-referencing canonical: ${slug}`);
    assert(!html.includes('noindex'), `Watch page does NOT have noindex tag: ${slug}`);
  }
});

// 4. Validate Video Hub page
const videoHubPath = path.join(distDir, 'videos', 'index.html');
assert(fs.existsSync(videoHubPath), 'Prerendered video hub exists: dist/videos/index.html');
if (fs.existsSync(videoHubPath)) {
  const hubHtml = fs.readFileSync(videoHubPath, 'utf8');
  assert(hubHtml.includes('"@type":"CollectionPage"'), 'Video hub contains CollectionPage schema');
  assert(hubHtml.includes('/videos/follicle-8-application-guide'), 'Video hub links to follicle-8-application-guide');
  assert(hubHtml.includes('/videos/scalvea-hair-growth-science-showcase'), 'Video hub links to scalvea-hair-growth-science-showcase');
  assert(hubHtml.includes('/videos/about-scalvea-brand-story'), 'Video hub links to about-scalvea-brand-story');
}

// 5. Validate policy pages have NO noindex
const policyPages = [
  'privacy-policy',
  'terms-of-service',
  'payment-policy',
  'cancellation-policy',
  'shipping-policy',
  'returns-policy'
];

policyPages.forEach(p => {
  const pagePath = path.join(distDir, p, 'index.html');
  assert(fs.existsSync(pagePath), `Policy page exists: dist/${p}/index.html`);
  if (fs.existsSync(pagePath)) {
    const html = fs.readFileSync(pagePath, 'utf8');
    assert(!html.includes('noindex'), `Policy page does NOT contain accidental noindex: ${p}`);
  }
});

// 6. Validate robots.txt
const robotsPath = path.join(distDir, 'robots.txt');
assert(fs.existsSync(robotsPath), 'dist/robots.txt exists');
const robotsText = fs.readFileSync(robotsPath, 'utf8');
assert(robotsText.includes('Allow: /videos'), 'robots.txt allows /videos');
assert(!robotsText.includes('Disallow: /support'), 'robots.txt does NOT block /support');
assert(robotsText.includes('Sitemap: https://scalvea.com/sitemap.xml'), 'robots.txt references sitemap.xml');
assert(robotsText.includes('Sitemap: https://scalvea.com/video-sitemap.xml'), 'robots.txt references video-sitemap.xml');

console.log(`\n=== VALIDATION SUMMARY: ${passCount} Passed, ${failCount} Failed ===`);
if (failCount > 0) process.exit(1);
