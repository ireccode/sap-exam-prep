// ESM-compatible Node.js script to dynamically generate sitemap.xml for SAPArchitectPrep.com
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SITE_URL = 'https://www.saparchitectprep.com';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBSITE_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(WEBSITE_DIR, 'sitemap.xml');
const EXCLUDE_PATHS = [
  'admin', 'dashboard', 'login', 'signup', 'user', 'js', 'css', 'images', '.DS_Store', 'robots.txt', 'generate-sitemap.js', 'generate-sitemap.mjs'
];

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const relPath = path.relative(WEBSITE_DIR, filePath);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!EXCLUDE_PATHS.includes(file)) {
        results = results.concat(getHtmlFiles(filePath));
      }
    } else if (file.endsWith('.html') && !EXCLUDE_PATHS.some(ex => relPath.startsWith(ex))) {
      results.push(relPath);
    }
  });
  return results;
}

function getLastMod(filePath) {
  const stat = fs.statSync(filePath);
  return stat.mtime.toISOString().split('T')[0];
}

function buildSitemap(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const footer = '</urlset>';
  const body = urls.map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n');
  return `${header}\n${body}\n${footer}\n`;
}

function main() {
  const htmlFiles = getHtmlFiles(WEBSITE_DIR);
  const urls = htmlFiles.map(relPath => {
    const loc = SITE_URL + '/' + relPath.replace(/\\/g, '/');
    const lastmod = getLastMod(path.join(WEBSITE_DIR, relPath));
    return { loc, lastmod };
  });
  // Add root index.html
  urls.unshift({ loc: SITE_URL + '/', lastmod: getLastMod(path.join(WEBSITE_DIR, 'index.html')) });
  fs.writeFileSync(OUTPUT_FILE, buildSitemap(urls));
  console.log('Sitemap generated with', urls.length, 'URLs.');
}

main();
