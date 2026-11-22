// Pixel comparison of interactive states between this build and the reference.
//
// Each scenario is set up on both sites (open a note, submit an empty form,
// open the menu ...), screenshotted, and compared pixel by pixel inside the
// browser. A pixel counts as different when its RGB channels differ by more
// than 90 in total. Prints the percentage that differs and where.
//
// usage: node tests/compare-pixels.cjs
const { chromium } = require('playwright');

const sites = {
  clone: process.env.CLONE_URL || 'http://localhost:4173',
  ref: process.env.REFERENCE_URL || 'https://puppy.instabizweb.com',
};

async function compare(page) {
  const S = [
    {
      n: 'faq-open',
      w: 1440,
      h: 900,
      p: '/faq',
      act: async () => {
        await page.locator('li.tp-note button').first().click();
      },
    },
    {
      n: 'faq-search',
      w: 1440,
      h: 900,
      p: '/faq',
      act: async () => {
        await page.locator('.tp-notes__search input').fill('deliver');
      },
    },
    {
      n: 'viewer',
      w: 1440,
      h: 900,
      p: '/happy-families',
      act: async () => {
        await page.locator('button[aria-label^="Open photo "]').nth(2).click();
      },
      wait: 5000,
    },
    {
      n: 'contact-error',
      w: 1440,
      h: 900,
      p: '/contact',
      act: async () => {
        await page.locator('form.tp-letterform button[type=submit]').click();
        await page.waitForTimeout(1500);
        await page.evaluate(() => document.activeElement && document.activeElement.blur());
        await page.evaluate(() => scrollTo({ top: 250, behavior: 'instant' }));
      },
      wait: 1200,
    },
    {
      n: 'filter',
      w: 1440,
      h: 900,
      p: '/puppies',
      act: async () => {
        await page.locator('button.tp-sticker-chip', { hasText: 'Maltipoo' }).click();
      },
      wait: 2500,
    },
    { n: 'profile-top', w: 1440, h: 900, p: '/puppies/maltipoo-max-male', act: async () => {} },
    {
      n: 'profile-form-error',
      w: 1440,
      h: 900,
      p: '/puppies/maltipoo-max-male',
      act: async () => {
        await page.locator('main form button[type=submit]').click();
        await page.waitForTimeout(1500);
        await page.evaluate(() => {
          const f = document.querySelector('main form');
          scrollTo({ top: f.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' });
        });
      },
      wait: 1200,
    },
    {
      n: 'gallery-full',
      w: 1440,
      h: 900,
      p: '/puppies/maltipoo-max-male',
      act: async () => {
        await page.locator('.tp-storypage button[aria-label*="full screen"]').click();
      },
      wait: 2500,
    },
    {
      n: 'menu-375',
      w: 375,
      h: 812,
      p: '/',
      act: async () => {
        await page.locator('button[aria-haspopup=dialog]').click();
      },
      wait: 1500,
    },
    {
      n: 'tabs-imported',
      w: 1440,
      h: 900,
      p: '/how-it-works',
      act: async () => {
        await page.locator('#tab-imported').click();
        await page.evaluate(() => scrollTo({ top: 620, behavior: 'instant' }));
      },
      wait: 1500,
    },
    { n: 'notfound', w: 1440, h: 900, p: '/nope-not-here', act: async () => {} },
    {
      n: 'contact-375',
      w: 375,
      h: 812,
      p: '/contact',
      act: async () => {
        await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
      },
    },
    {
      n: 'puppies-768',
      w: 768,
      h: 1024,
      p: '/puppies',
      act: async () => {
        await page.evaluate(() => scrollTo({ top: 500, behavior: 'instant' }));
      },
    },
    { n: 'gone-1024', w: 1024, h: 768, p: '/gone-home', act: async () => {} },
  ];
  const shots = {};
  for (const [name, base] of Object.entries(sites)) {
    for (const s of S) {
      await page.setViewportSize({ width: s.w, height: s.h });
      await page.goto(base + s.p, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(2600);
      await page.mouse.move(5, s.h - 5);
      try {
        await s.act();
      } catch (e) {
        shots[s.n + '!' + name] = String(e).slice(0, 120);
      }
      await page.waitForTimeout(s.wait || 1000);
      const buf = await page.screenshot({ type: 'png' });
      (shots[s.n] = shots[s.n] || {})[name] = buf.toString('base64');
    }
  }
  await page.goto('about:blank');
  const out = [];
  for (const s of S) {
    const pair = shots[s.n];
    const r = await page.evaluate(
      async ({ a, b }) => {
        const load = (d) =>
          new Promise((res) => {
            const i = new Image();
            i.onload = () => res(i);
            i.src = 'data:image/png;base64,' + d;
          });
        const [ia, ib] = await Promise.all([load(a), load(b)]);
        const w = Math.min(ia.width, ib.width),
          h = Math.min(ia.height, ib.height);
        const cv = (i) => {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const x = c.getContext('2d');
          x.drawImage(i, 0, 0);
          return x.getImageData(0, 0, w, h).data;
        };
        const da = cv(ia),
          db = cv(ib);
        let n = 0,
          x0 = w,
          y0 = h,
          x1 = 0,
          y1 = 0;
        const rows = new Array(Math.ceil(h / 50)).fill(0);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 90) {
              n++;
              rows[Math.floor(y / 50)]++;
              if (x < x0) x0 = x;
              if (y < y0) y0 = y;
              if (x > x1) x1 = x;
              if (y > y1) y1 = y;
            }
          }
        return {
          pct: Math.round((n / (w * h)) * 10000) / 100,
          bbox: n ? [x0, y0, x1, y1] : null,
          bands: rows
            .map((v, i) => (v > 200 ? i * 50 + ':' + v : null))
            .filter(Boolean)
            .slice(0, 8),
        };
      },
      { a: pair.clone, b: pair.ref },
    );
    out.push(
      s.n +
        ' ' +
        JSON.stringify(r) +
        (shots[s.n + '!clone'] ? ' CLONE-ERR ' + shots[s.n + '!clone'] : '') +
        (shots[s.n + '!ref'] ? ' REF-ERR ' + shots[s.n + '!ref'] : ''),
    );
  }
  return out.join('\n');
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  console.log(await compare(page));
  await browser.close();
})();
