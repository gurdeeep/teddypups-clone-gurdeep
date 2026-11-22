// Cross-browser smoke test of the production build (Chromium, Firefox, WebKit, two phone profiles).
// usage: node tests/smoke.cjs [baseUrl]   (or set CLONE_URL)
const { chromium, firefox, webkit, devices } = require('playwright');
const base = (process.argv[2] || process.env.CLONE_URL || 'http://localhost:4173').replace(/\/$/, '');
const PAGES = [
  '/',
  '/puppies',
  '/happy-families',
  '/how-it-works',
  '/faq',
  '/contact',
  '/gone-home',
  '/puppies/maltipoo-max-male',
];
const SIZES = [
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 900],
];

async function layout(browserType, name) {
  const browser = await browserType.launch();
  const rows = [];
  for (const [w, h] of SIZES) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)));
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    page.on('response', (r) => r.status() >= 400 && errors.push(r.status() + ' ' + r.url().slice(-60)));
    let overflow = 0;
    let missing = 0;
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      // The blanket lifts about a second after the app mounts; over a real network that can be
      // later than a fixed delay, so wait for it (a blanket that never lifts still fails below).
      await page
        .waitForFunction(() => document.querySelector('.tp-curtain')?.dataset.state === 'idle', null, { timeout: 8000 })
        .catch(() => {});
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => ({
        over: document.documentElement.scrollWidth > innerWidth + 1,
        h1: !!document.querySelector('h1')?.textContent.trim(),
        curtain: document.querySelector('.tp-curtain')?.dataset.state,
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').length,
      }));
      if (m.over) overflow++;
      if (!m.h1 || m.broken || m.curtain !== 'idle') missing++;
    }
    rows.push(
      `${name} ${w}px: pages ${PAGES.length}, horizontal overflow ${overflow}, render problems ${missing}, console/network errors ${errors.length}${errors.length ? ' ' + JSON.stringify([...new Set(errors)].slice(0, 3)) : ''}`,
    );
    await context.close();
  }
  await browser.close();
  return rows;
}

async function interactions(browserType, name, contextOptions) {
  const browser = await browserType.launch();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  const results = {};
  const check = async (label, fn) => {
    try {
      results[label] = (await fn()) ? 'pass' : 'FAIL';
    } catch (e) {
      results[label] = 'FAIL ' + String(e).slice(0, 90);
    }
  };
  const mobile = (contextOptions.viewport?.width ?? 1440) < 1024;
  const go = async (p) => {
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(1600);
  };

  // After a link click: wait for the route to change (the next page's chunk may still be
  // downloading on a live site), then for the blanket to lift.
  const arrive = async (p) => {
    await page.waitForURL((url) => url.pathname === p, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  };

  if (mobile) {
    await check('mobile menu opens, closes, navigates', async () => {
      await go('/');
      await page.locator('button[aria-haspopup=dialog]').click();
      await page.waitForTimeout(600);
      const open = await page.evaluate(() => document.querySelector('dialog.tp-menu').open);
      await page.locator('dialog.tp-menu button', { hasText: 'Close' }).click();
      await page.waitForTimeout(900);
      const closed = await page.evaluate(() => !document.querySelector('dialog.tp-menu').open);
      await page.locator('button[aria-haspopup=dialog]').click();
      await page.waitForTimeout(600);
      await page.locator('dialog.tp-menu a[href="/faq"]').click();
      await arrive('/faq');
      return open && closed && page.url().endsWith('/faq');
    });
    await check('WhatsApp / Call bar visible', async () => page.locator('[data-whatsapp-bar]').isVisible());
  } else {
    await check('nav link navigates with transition', async () => {
      await go('/');
      await page.locator('header a.tp-nav-link[href="/faq"]').click();
      await arrive('/faq');
      return page.url().endsWith('/faq') && (await page.evaluate(() => scrollY)) === 0;
    });
    await check('header hides on scroll down, returns on scroll up', async () => {
      await go('/');
      await page.mouse.move(400, 400);
      for (let i = 0; i < 8; i++) {
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(1200);
      const hidden = await page.evaluate(() => document.getElementById('site-header').dataset.hidden);
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(1200);
      const shown = await page.evaluate(() => document.getElementById('site-header').dataset.hidden);
      return hidden === 'true' && shown === 'false';
    });
  }
  await check('FAQ note unfolds; search filters', async () => {
    await go('/faq');
    await page.locator('li.tp-note button').first().click();
    await page.waitForTimeout(400);
    const open = await page.locator('li.tp-note[data-unfolded]').count();
    await page.locator('.tp-notes__search input').fill('vaccin');
    await page.waitForTimeout(400);
    return open === 1 && (await page.locator('li.tp-note').count()) === 1;
  });
  await check('puppy filters update list and URL', async () => {
    await go('/puppies');
    const all = await page.locator('.tp-sketches > li').count();
    await page.locator('button.tp-sticker-chip', { hasText: 'Maltipoo' }).click();
    await page.waitForTimeout(1200);
    return (
      all === 15 && (await page.locator('.tp-sketches > li').count()) === 6 && page.url().includes('breed=maltipoo')
    );
  });
  await check('profile gallery pages and opens full screen', async () => {
    await go('/puppies/maltipoo-max-male');
    await page.locator('button[aria-label="Next photo"]').click();
    await page.waitForTimeout(1000);
    const second = (await page.locator('.tp-storypage span.self-center').textContent()).trim() === '2 / 2';
    await page.locator('button[aria-label="Previous photo"]').click();
    await page.waitForTimeout(1000);
    await page.locator('.tp-storypage button[aria-label*="full screen"]').click();
    await page.waitForTimeout(700);
    const open = (await page.locator('dialog[open]').count()) === 1;
    await page.locator('dialog[open] button', { hasText: 'Close' }).click();
    return second && open;
  });
  await check('profile form validates then confirms', async () => {
    const form = page.locator('main form');
    await form.locator('button[type=submit]').click();
    await page.waitForTimeout(500);
    const errs = await page.locator('main form p[id$="-err"]').count();
    await form.locator('[name=name]').fill('Test User');
    await form.locator('[name=phone]').fill('+971 50 123 4567');
    await form.locator('button[type=submit]').click();
    await page.waitForTimeout(1800);
    return errs === 2 && (await page.locator('.tp-sent').count()) === 1;
  });
  await check('contact letter validates then plays post scene', async () => {
    await go('/contact');
    const form = page.locator('form.tp-letterform');
    await form.locator('button[type=submit]').click();
    await page.waitForTimeout(500);
    const alert = await page.locator('.tp-letterform__alert li').count();
    await form.locator('[name=name]').fill('Test User');
    await form.locator('[name=phone]').fill('+971501234567');
    await form.locator('button[type=submit]').click();
    await page.waitForTimeout(3200);
    return alert === 2 && (await page.locator('.tp-post').getAttribute('data-phase')) === 'sent';
  });
  await check('family photo viewer opens and pages', async () => {
    await go('/happy-families');
    await page.locator('button[aria-label^="Open photo "]').nth(1).click();
    await page.waitForTimeout(700);
    const first = await page.locator('dialog[open] p.font-scrawl').textContent();
    await page.locator('dialog[open] button', { hasText: 'Next' }).click();
    await page.waitForTimeout(700);
    const second = await page.locator('dialog[open] p.font-scrawl').textContent();
    return first.startsWith('2 / 64') && second.startsWith('3 / 64');
  });
  await check('journey tabs switch', async () => {
    await go('/how-it-works');
    await page.locator('#tab-imported').click();
    await page.waitForTimeout(400);
    return page.evaluate(
      () => document.getElementById('panel-local').hidden && !document.getElementById('panel-imported').hidden,
    );
  });
  await check('direct URL and refresh on a deep route', async () => {
    await go('/puppies/copper-male');
    await page.reload();
    await page.waitForTimeout(1200);
    return (await page.locator('h1').first().textContent()).includes('Copper');
  });
  await check('unknown URL shows the 404 page', async () => {
    await go('/no-such-page');
    return (await page.locator('h1').textContent()).startsWith('Lost');
  });
  await check('homepage puppy is live', async () => {
    await go('/');
    return page.evaluate(
      () => !!document.documentElement.dataset.pup && document.querySelectorAll('.pup-actor').length === 1,
    );
  });
  await browser.close();
  return `${name}: ${Object.entries(results)
    .map(([k, v]) => `\n   ${v.padEnd(5)} ${k}`)
    .join('')}${errors.length ? '\n   page errors: ' + JSON.stringify([...new Set(errors)].slice(0, 3)) : ''}`;
}

(async () => {
  const engines = { Chromium: chromium, Firefox: firefox, WebKit: webkit };
  for (const [name, type] of Object.entries(engines)) {
    try {
      console.log((await layout(type, name)).join('\n'));
    } catch (e) {
      console.log(name, 'layout run failed:', String(e).slice(0, 200));
    }
  }
  const runs = [
    ['Chromium desktop 1440', chromium, { viewport: { width: 1440, height: 900 } }],
    ['Firefox desktop 1440', firefox, { viewport: { width: 1440, height: 900 } }],
    ['WebKit desktop 1440', webkit, { viewport: { width: 1440, height: 900 } }],
    ['WebKit iPhone 13 (mobile Safari emulation)', webkit, devices['iPhone 13']],
    ['Chromium Pixel 7 (Android emulation)', chromium, devices['Pixel 7']],
  ];
  for (const [name, type, options] of runs) {
    try {
      console.log(await interactions(type, name, options));
    } catch (e) {
      console.log(name, 'interaction run failed:', String(e).slice(0, 200));
    }
  }
})();
