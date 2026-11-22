import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Writes robots.txt, and sitemap.xml when the site's public address is known.
 * Netlify provides that address at build time as the URL environment variable;
 * local builds have none, so they get a plain robots.txt and no sitemap.
 */
function seoFiles(): Plugin {
  return {
    name: 'seo-files',
    generateBundle() {
      const origin = process.env.URL?.replace(/\/$/, '');
      const routes = Object.keys(JSON.parse(readFileSync('src/data/pages.json', 'utf8')) as Record<string, unknown>);
      let robots = 'User-agent: *\nAllow: /\n';
      if (origin) {
        const urls = routes.map((route) => `  <url><loc>${origin}${route === '/' ? '' : route}</loc></url>`).join('\n');
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        });
        robots += `\nSitemap: ${origin}/sitemap.xml\n`;
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
    },
  };
}

/**
 * Puts the page-transition blanket (quilt, running puppy, tagline) into the
 * HTML itself, already covering the screen. Visitors see it as soon as the
 * stylesheet arrives instead of a blank page while the JavaScript loads; React
 * then replaces it with its own copy and lifts it.
 */
function firstPaintCurtain(): Plugin {
  return {
    name: 'first-paint-curtain',
    transformIndexHtml(html) {
      const shell = readFileSync('src/templates/shell-head.html', 'utf8');
      const curtain = shell.slice(0, shell.indexOf('<a ')).replace('data-state="intro"', 'data-state="covered"');
      return html.replace('<!-- first-paint-curtain -->', curtain);
    },
  };
}

export default defineConfig({
  plugins: [react(), seoFiles(), firstPaintCurtain()],
  build: {
    rollupOptions: {
      output: {
        // Keep the libraries in their own long-lived chunk so app changes do not bust their cache.
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
});
