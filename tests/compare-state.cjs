// Scroll-state comparison between this build and the reference site.
//
// Loads both sites in headless Chromium, scrolls each from top to bottom with
// identical mouse-wheel input, and after every step records each styled
// element's data attributes, opacity, visibility, transform and position.
// Differences are grouped by element and printed, most frequent first.
//
// usage: node tests/compare-state.cjs [path] [width] [height] [wheelStep]
//        node tests/compare-state.cjs /puppies 375 812 900
const { chromium } = require('playwright');

const sites = {
  clone: process.env.CLONE_URL || 'http://localhost:4173',
  ref: process.env.REFERENCE_URL || 'https://puppy.instabizweb.com',
};
const [path = '/', w = '1440', h = '900', step = '600'] = process.argv.slice(2);
const P = { path, w: Number(w), h: Number(h), step: Number(step) };

async function compare(page) {
  const collect = () => {
    const res = {};
    const counts = {};
    const skip = /tp-twinkle|tp-lineup|tp-curtain|tp-runner/;
    const els = [...document.querySelectorAll('body *')].filter((el) => {
      if (el.closest('svg') && el.tagName !== 'svg') return false;
      const c = typeof el.className === 'string' ? el.className : el.className?.baseVal || '';
      if (skip.test(c)) return false;
      if (el.closest('.pup-layer, .pup-prints, .pup-buddy, .tp-lineup, .tp-curtain, dialog')) return false;
      const d = Object.keys(el.dataset || {}).filter((k) => k !== 'nimg');
      return /(^|\s)(tp-|pup-)/.test(c) || d.length > 0 || el.tagName === 'HEADER';
    });
    for (const el of els) {
      const c = (typeof el.className === 'string' ? el.className : el.className?.baseVal || '')
        .split(/\s+/)
        .filter((x) => /^(tp-|pup-)/.test(x))
        .slice(0, 2)
        .join('.');
      const base =
        el.tagName.toLowerCase() +
        (el.id && !el.id.startsWith('_') ? '#' + el.id.replace(/[0-9a-f-]{20,}/, 'ID') : '') +
        (c ? '.' + c : '');
      counts[base] = (counts[base] || 0) + 1;
      const key = base + '[' + counts[base] + ']';
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const d = { ...el.dataset };
      delete d.nimg;
      const tr =
        cs.transform === 'none'
          ? 'none'
          : cs.transform.replace(/-?\d+\.?\d*(e-?\d+)?/g, (n) => String(Math.round(parseFloat(n) * 10) / 10));
      res[key] = {
        d: JSON.stringify(
          Object.keys(d)
            .sort()
            .map((k) => k + '=' + d[k]),
        ),
        o: String(Math.round(parseFloat(cs.opacity) * 10) / 10),
        v: cs.visibility + '/' + cs.display,
        t: tr,
        r: [
          Math.round(r.left / 6) * 6,
          Math.round(r.top / 6) * 6,
          Math.round(r.width / 6) * 6,
          Math.round(r.height / 6) * 6,
        ].join(','),
      };
    }
    return res;
  };
  const run = async (base) => {
    await page.setViewportSize({ width: P.w, height: P.h });
    await page.goto(base + P.path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(3000);
    const snaps = [];
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await page.mouse.move(Math.round(P.w / 2), Math.round(P.h / 2));
    snaps.push({ y: 0, s: await page.evaluate(collect) });
    let guard = 0;
    for (;;) {
      for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, P.step / 3);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(1300);
      const y = await page.evaluate(() => Math.round(scrollY));
      snaps.push({ y, s: await page.evaluate(collect) });
      if (y >= total - 2 || ++guard > 60) break;
    }
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1300);
    snaps.push({ y: 'up:' + (await page.evaluate(() => Math.round(scrollY))), s: await page.evaluate(collect) });
    return snaps;
  };
  const c = await run(sites.clone);
  const r = await run(sites.ref);
  const agg = {};
  const n = Math.min(c.length, r.length);
  for (let i = 0; i < n; i++) {
    const cs = c[i].s,
      rs = r[i].s;
    const keys = new Set([...Object.keys(cs), ...Object.keys(rs)]);
    for (const k of keys) {
      const a = cs[k],
        b = rs[k];
      const base = k.replace(/\[\d+\]$/, '');
      const add = (what, ex) => {
        const id = base + ' :: ' + what;
        (agg[id] = agg[id] || { n: 0, ex: [] }).n++;
        if (agg[id].ex.length < 2) agg[id].ex.push('@' + c[i].y + '/' + r[i].y + ' ' + ex);
      };
      if (!a) {
        add('MISSING in clone', '');
        continue;
      }
      if (!b) {
        add('EXTRA in clone', '');
        continue;
      }
      if (a.d !== b.d) add('data', `clone ${a.d} | ref ${b.d}`);
      if (a.o !== b.o) add('opacity', `${a.o} | ${b.o}`);
      if (a.v !== b.v) add('display', `${a.v} | ${b.v}`);
      if (a.t !== b.t) add('transform', `${a.t.slice(0, 50)} | ${b.t.slice(0, 50)}`);
      if (a.r !== b.r) add('rect', `${a.r} | ${b.r}`);
    }
  }
  const lines = Object.entries(agg)
    .sort((x, y) => y[1].n - x[1].n)
    .map(([k, v]) => `${v.n}x ${k}\n     ${v.ex.join('\n     ')}`);
  return (
    `${P.path} @${P.w}: snaps ${c.length}/${r.length}\n ys clone ${c.map((s) => s.y).join(',')}\n ys ref   ${r.map((s) => s.y).join(',')}\n` +
    lines.slice(0, 25).join('\n')
  );
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  console.log(await compare(page));
  await browser.close();
})();
