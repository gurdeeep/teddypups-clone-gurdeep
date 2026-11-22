# Testing

What was tested, how, and what the results were. Everything below was run on **22 November 2026**. Sections 1 to 5 were run against the production build (`npm run build` served by `npm run preview` at `http://localhost:4173`), compared with the live reference at https://puppy.instabizweb.com/. Section 6 repeats the main checks against the deployed site at https://teddypups-clone.netlify.app/.

Anything not actually run is listed under [Not yet tested](#not-yet-tested) rather than marked as passed.

## Summary

| Area                                            | Result                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Build and type-check                            | Pass, 0 errors, 0 warnings                                                        |
| Console errors and failed requests              | None on any page, in any tested browser                                           |
| Layout and scroll state vs the reference        | No differences in 15 page and viewport combinations                               |
| Walking puppy vs the reference                  | 46 of 47 scroll steps identical; 1 step differed by 1px mid-movement              |
| Pixel comparison of 14 interactive states       | All within 0.7%; 6 show 0.00%                                                     |
| Functional checks, 3 engines + 2 phone profiles | 60 of 60 pass; 96 of 96 page loads clean                                          |
| Lighthouse, 5 pages (local build)               | Accessibility, best practices, SEO: 100. Performance: 89–98 desktop, 49–75 mobile |
| Live site: functional checks                    | 60 of 60 pass; 96 of 96 page loads clean                                          |
| Live site: Lighthouse, 5 pages                  | Accessibility, best practices, SEO: 100. Performance: 85–96 desktop, 65–81 mobile |
| Live site: known differences                    | A "Powered by Netlify" badge added by the host; slower downloads on some networks |

## 1. Build

```bash
npm run build
```

Runs `tsc -b` (strict mode) and then `vite build`. Both complete with no errors or warnings.

## 2. Automated comparison with the reference

These checks drive a headless Chromium (Playwright) through both sites with identical input. The scripts are in [`tests/`](tests/):

```bash
npx playwright install chromium firefox webkit   # once
npm run preview                                  # serve the build, then in another terminal:
npm run test:smoke                               # functional checks, three engines + two phone profiles
npm run test:compare -- /puppies 375 812 900     # scroll-state diff against the reference
npm run test:pixels                              # pixel diff of interactive states
```

### 2.1 Layout and scroll state

For each page and viewport, the script loads the clone and the reference, scrolls each from top to bottom with the same mouse-wheel events, and after every step records each styled element's data attributes, opacity, visibility, transform and position. The two recordings are then diffed.

| Page                                | 375px | 768px | 1024px | 1440px |
| ----------------------------------- | :---: | :---: | :----: | :----: |
| `/`                                 | match |       | match  | match  |
| `/puppies`                          | match |       |        | match  |
| `/happy-families`                   |       |       |        | match  |
| `/how-it-works`                     | match |       |        | match  |
| `/faq`                              |       | match |        | match  |
| `/contact`                          |       | match |        | match  |
| `/gone-home`                        |       |       |        | match  |
| `/puppies/maltipoo-max-male`        |       |       |        | match  |
| `/puppies/korean-teacup-pomeranian` | match |       |        |        |

Blank cells were not run for that combination.

"Match" means the scroll position after every step was identical on both sites, and no element differed in state. The only entries the diff reported were:

- CSS animations sampled at different moments (twinkling stars, a bobbing question mark, a door mid-swing)
- Sub-pixel image height differences on the family photo wall (0.1 to 0.3px), because the reference serves server-resized images

Separately, document height and horizontal overflow were measured on 8 pages at all four widths (32 combinations): heights are equal to the reference on every one, and no page scrolls sideways.

### 2.2 The walking puppy

On the home page the mascot walks between sections as you scroll. At each of 47 scroll steps (23 at 1440px, 24 at 375px, including scrolling back up) the script compared the puppy's position, size, layer, "holding" state and speech bubble.

- 375px: 24 of 24 identical
- 1440px: 22 of 23 identical; the other was 1px apart while the puppy was still moving

### 2.3 Pixel comparison of interactive states

Each state was set up on both sites, screenshotted, and compared pixel by pixel (a pixel counts as different if its RGB channels differ by more than 90 in total).

| State                                   | Viewport | Pixels that differ |
| --------------------------------------- | -------- | -----------------: |
| FAQ, first note open                    | 1440     |              0.14% |
| FAQ, searching "deliver"                | 1440     |              0.03% |
| Family photo viewer open                | 1440     |              0.68% |
| Contact form, validation errors showing | 1440     |              0.00% |
| Puppies, filtered by Maltipoo           | 1440     |              0.03% |
| Puppy profile, top of page              | 1440     |              0.01% |
| Profile enquiry form, validation errors | 1440     |              0.00% |
| Profile gallery, full screen            | 1440     |              0.00% |
| Mobile menu open                        | 375      |              0.00% |
| How it works, "Imported" tab            | 1440     |              0.00% |
| 404 page                                | 1440     |              0.00% |
| Contact, scrolled                       | 375      |              0.06% |
| Puppies, scrolled                       | 768      |              0.41% |
| Gone home                               | 1024     |              0.02% |

The non-zero rows are the animated mascot caught at a different point in its blink or head tilt, scroll-reveal animations in flight, and photo resampling: the reference serves a server-resized copy of each photo while the local build scales the original in the browser, which is why the photo viewer is the largest at 0.68%. Values move by a few hundredths between runs.

## 3. Functional checks

Run with Playwright against the production build in three browser engines. Each check is a scripted user action followed by an assertion on the result.

### 3.1 Every page at every breakpoint

8 pages (Home, Puppies, Happy families, How it works, FAQ, Contact, Gone home, one puppy profile) were loaded at each width. A page passes if it has no horizontal scroll, shows its heading, has no broken images, the transition blanket has lifted, and the browser logged no console errors or failed requests.

| Browser  | 375px | 768px | 1024px | 1440px |
| -------- | :---: | :---: | :----: | :----: |
| Chromium | 8 / 8 | 8 / 8 | 8 / 8  | 8 / 8  |
| Firefox  | 8 / 8 | 8 / 8 | 8 / 8  | 8 / 8  |
| WebKit   | 8 / 8 | 8 / 8 | 8 / 8  | 8 / 8  |

Two things turned up on the first run and were dealt with:

- **Firefox logged "Image corrupt or truncated" for three photos.** That led to finding 11 JPEG files that had been cut off when the site was first captured (one held 20 KB of a 225 KB file). They were replaced with the complete originals, and the re-run is clean.
- **WebKit showed the blanket still down on Happy families** when checked 1.5 seconds after load. It lifts at about 1.1 seconds after the app mounts, and that page mounts later because it has 64 photos. Re-checked at 2.6 seconds on every page: lifted everywhere. This was the test's timing, not a defect.

### 3.2 Interactions

| Check                                                      | Chromium 1440 | Firefox 1440 | WebKit 1440 | WebKit, iPhone 13 profile | Chromium, Pixel 7 profile |
| ---------------------------------------------------------- | :-----------: | :----------: | :---------: | :-----------------------: | :-----------------------: |
| Nav link navigates with the page transition                |     pass      |     pass     |    pass     |             –             |             –             |
| Header hides on scroll down, returns on scroll up          |     pass      |     pass     |    pass     |             –             |             –             |
| Mobile menu opens, closes, navigates                       |       –       |      –       |      –      |           pass            |           pass            |
| WhatsApp / Call bar visible                                |       –       |      –       |      –      |           pass            |           pass            |
| FAQ note unfolds; search filters the notes                 |     pass      |     pass     |    pass     |           pass            |           pass            |
| Puppy filters update the list and the URL (15 → 6)         |     pass      |     pass     |    pass     |           pass            |           pass            |
| Profile gallery pages and opens full screen                |     pass      |     pass     |    pass     |           pass            |           pass            |
| Profile form: 2 errors when empty, confirmation when valid |     pass      |     pass     |    pass     |           pass            |           pass            |
| Contact letter: 2 errors when empty, post scene when valid |     pass      |     pass     |    pass     |           pass            |           pass            |
| Family photo viewer opens and pages (2 / 64 → 3 / 64)      |     pass      |     pass     |    pass     |           pass            |           pass            |
| Journey tabs switch panels                                 |     pass      |     pass     |    pass     |           pass            |           pass            |
| Direct URL and refresh on `/puppies/copper-male`           |     pass      |     pass     |    pass     |           pass            |           pass            |
| Unknown URL shows the 404 page                             |     pass      |     pass     |    pass     |           pass            |           pass            |
| Homepage walking puppy is running                          |     pass      |     pass     |    pass     |           pass            |           pass            |

60 of 60 checks pass. A dash means the check does not apply at that size (the menu button only exists below 1024px; the desktop nav only above it).

The two right-hand columns are emulation: the engine is given the phone's viewport, pixel density, touch input and user agent. They are not real phones.

Also checked in Chromium at 1440px:

- All 57 distinct internal links found across 8 pages resolve to a real page; the only external destinations are the reference's four placeholders (WhatsApp, phone, email, instabizweb.com)
- Page transition moves through covering → covered → lifting → idle, and the back button returns to the previous page
- Filters: combining Maltipoo + Boys gives 2; a combination with no results shows the empty state with the mascot; "Show all puppies" restores 15; opening `/puppies?breed=poodle&gender=male` directly applies both filters
- FAQ: opening a second note closes the first; the search term is highlighted
- Hero line-up: seats cycle through duck → pop, each with a name tag
- A cross-page anchor link (`/how-it-works#delivery`) lands with the section just below the header

## 4. Accessibility and reduced motion

With `prefers-reduced-motion: reduce` emulated, 6 pages were loaded and checked:

- No transition blanket, no smooth scrolling, no walking puppy, door section not pinned
- Every scroll-reveal element is visible immediately; all chat messages are shown
- Navigation still works without a reload
- No console errors

Lighthouse accessibility results are in the next section.

## 5. Lighthouse

Lighthouse 12, run from the command line against the **local** production build, one run per row:

```bash
npx lighthouse http://localhost:4173/ --preset=desktop   # desktop
npx lighthouse http://localhost:4173/                    # mobile (simulated slow 4G, 4x CPU slowdown)
```

### Desktop

| Page                         | Performance | Accessibility | Best practices | SEO | LCP   | TBT   | CLS   |
| ---------------------------- | :---------: | :-----------: | :------------: | :-: | ----- | ----- | ----- |
| `/`                          |     89      |      100      |      100       | 100 | 2.1 s | 80 ms | 0.018 |
| `/puppies`                   |     91      |      100      |      100       | 100 | 1.9 s | 30 ms | 0.012 |
| `/puppies/maltipoo-max-male` |     96      |      100      |      100       | 100 | 1.3 s | 0 ms  | 0     |
| `/faq`                       |     98      |      100      |      100       | 100 | 1.1 s | 0 ms  | 0     |
| `/contact`                   |     98      |      100      |      100       | 100 | 1.1 s | 0 ms  | 0     |

### Mobile

| Page                         | Performance | Accessibility | Best practices | SEO | LCP    | TBT    | CLS   |
| ---------------------------- | :---------: | :-----------: | :------------: | :-: | ------ | ------ | ----- |
| `/`                          |     49      |      100      |      100       | 100 | 15.4 s | 660 ms | 0     |
| `/puppies`                   |     66      |      100      |      100       | 100 | 8.9 s  | 190 ms | 0     |
| `/puppies/maltipoo-max-male` |     68      |      100      |      100       | 100 | 7.3 s  | 220 ms | 0     |
| `/faq`                       |     75      |      100      |      100       | 100 | 5.6 s  | 50 ms  | 0     |
| `/contact`                   |     73      |      100      |      100       | 100 | 6.2 s  | 60 ms  | 0.056 |

For comparison, the reference's home page measured the same way on the same machine: desktop 90 / 100 / 100 / 92, mobile 72 / 100 / 100 / 92.

### Reading these numbers

- **Accessibility, Best practices and SEO are 100 on every page**, desktop and mobile.
- **Desktop performance is on par with the reference** (89 against 90 on the home page).
- **Mobile performance is the weak spot, and these local numbers are the worst case.** The local server sends every photo at full size, about 3.5 MB on the home page, and Lighthouse's slow-4G simulation charges all of it against the Largest Contentful Paint. The reference avoids this by resizing images on its server. The deployed site does the equivalent through Netlify Image CDN, which the local preview cannot run. The numbers measured on the live URL are in [section 6](#6-the-live-site).
- The home page mobile score moved between 49 and 60 across three runs on this machine, so treat single mobile runs as approximate.
- Both sites deliberately keep a transition blanket over the page for about a second on first load, which costs LCP on each.

### Fixes made because of Lighthouse

- `robots.txt` was missing, so the SPA fallback served HTML in its place (SEO 92 → 100). It is now generated at build time, along with `sitemap.xml` on Netlify.
- JavaScript was one 2.3 MB file. It is now a library chunk, an app chunk and one chunk per page.
- Images are requested at display size through the image CDN on Netlify (not measurable locally, see above).
- The transition blanket is written into the HTML so the first paint is not a blank page.

## 6. The live site

Deployed to Netlify on 22 November 2026 with `npx netlify-cli deploy --prod --build` and tested at https://teddypups-clone.netlify.app/.

### 6.1 Hosting checks

| Check                                                                   | Result                                                                  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/`, `/faq`, `/puppies`, `/contact`, `/how-it-works`, `/happy-families` | 200 on a direct request, so deep links and refreshes work               |
| Unknown URL                                                             | Shows the 404 poster. The HTTP status is 200 (single-page app fallback) |
| `robots.txt` and `sitemap.xml`                                          | Generated with the live address; the sitemap lists all routes           |
| Fingerprinted assets                                                    | `Cache-Control: public,max-age=31536000,immutable`                      |
| Image CDN (`/.netlify/images`)                                          | 200; returns resized WebP to browsers that accept it, AVIF sources too  |
| Photos on 7 pages, 2 widths, in Chromium, Firefox and WebKit            | 0 broken images, 0 failed image requests                                |

### 6.2 Functional checks

The same suite as section 3, pointed at the live URL (`node tests/smoke.cjs https://teddypups-clone.netlify.app`): **60 of 60 interaction checks pass**, and all 96 page loads (8 pages, 4 widths, 3 engines) have a heading, no sideways scroll, no broken images and a lifted blanket.

Three things turned up on the live site and were dealt with:

- **Navigation was slower than on the reference.** A click had to download the next page before the blanket could lift: 1.5 to 3.4 seconds to settle, against 0.7 to 1.0 on the reference. The app now prefetches the pages linked from what is on screen (`src/lib/usePrefetch.ts`), as the reference does. Measured afterwards, a click a few seconds after load settles in 1.0 to 1.1 seconds on both sites. A click in the first second or two of a cold visit can still take 2 to 4 seconds on a slow connection, because the next page is competing with the first page's photos.
- **My first prefetch version made things worse.** It fetched every visible link at once, which starved the clicked page on a slow connection, and Firefox and WebKit logged an unhandled error whenever a prefetch was cancelled by leaving the page. Prefetches now go two at a time, failures are caught, and a page chunk that cannot be fetched falls back to an ordinary page load.
- **Firefox logged "Image corrupt or truncated" for up to six resized photos per run.** This time the files are fine: each source photo and each CDN response was downloaded and verified complete. The message appears when the test leaves a page while photos are still downloading. Re-run with each page allowed to finish loading: 0 messages, 0 broken images.

### 6.3 Comparison with the reference

- **Scroll state, home page at 1440px:** only animations caught mid-frame, as in section 2.1.
- **Pixel comparison of the 14 interactive states:** two at 0.00%, eleven between 0.09% and 0.87%, and one mobile state at 2.07%. Almost all of the increase over section 2.3 is one thing: the "Powered by Netlify" badge described below, which covers about 170 by 40 pixels in the bottom-right corner.

### 6.4 Lighthouse on the live site

Lighthouse 12, same method as section 5.

| Page                         | Mode    | Performance | Accessibility | Best practices | SEO | LCP   | TBT    | CLS   |
| ---------------------------- | ------- | :---------: | :-----------: | :------------: | :-: | ----- | ------ | ----- |
| `/`                          | Desktop |     89      |      100      |      100       | 100 | 1.3 s | 30 ms  | 0.018 |
| `/puppies`                   | Desktop |     85      |      100      |      100       | 100 | 1.5 s | 0 ms   | 0.012 |
| `/puppies/maltipoo-max-male` | Desktop |     92      |      100      |      100       | 100 | 1.2 s | 0 ms   | 0     |
| `/faq`                       | Desktop |     96      |      100      |      100       | 100 | 0.9 s | 0 ms   | 0     |
| `/contact`                   | Desktop |     95      |      100      |      100       | 100 | 1.0 s | 0 ms   | 0.003 |
| `/`                          | Mobile  |     67      |      100      |      100       | 100 | 5.4 s | 160 ms | 0     |
| `/puppies`                   | Mobile  |     65      |      100      |      100       | 100 | 5.5 s | 140 ms | 0     |
| `/puppies/maltipoo-max-male` | Mobile  |     75      |      100      |      100       | 100 | 4.9 s | 180 ms | 0     |
| `/faq`                       | Mobile  |     81      |      100      |      100       | 100 | 4.0 s | 40 ms  | 0     |
| `/contact`                   | Mobile  |     76      |      100      |      100       | 100 | 4.2 s | 30 ms  | 0.056 |

With resized photos the home page's mobile score rose from 49 (local) to 67, and its Largest Contentful Paint fell from 15.4 to 5.4 seconds. The reference's home page scored 72 on mobile and 90 on desktop. Single runs move by several points.

### 6.5 Two differences that come from the host

- **"Powered by Netlify" badge.** Netlify injects a script (`/.netlify/scripts/hud`) into every page of sites on its free plan, which draws a small badge in the bottom-right corner. It is not in this repository or in the build output, and the free plan has no option to hide it. The reference has no badge.
- **Download speed depends on the network.** From the machine used for testing, files from Netlify arrived at 110 to 190 KB/s, while the reference's host and a general speed test both delivered about 3 MB/s on the same connection. An older Netlify site was equally slow, so this is the route between that connection and Netlify rather than anything in the code. It makes first loads on the live site feel slower than the reference on that network. It has not been measured from other networks.

## 7. Manual checklist

Use this for a final pass by hand. The "Automated" column says whether the item is already covered by the runs above.

| Check                                                                | Automated | By hand |
| -------------------------------------------------------------------- | :-------: | :-----: |
| Every nav and footer link goes to the right page                     |    yes    |   [ ]   |
| Header hides on scroll down and returns on scroll up                 |    yes    |   [ ]   |
| Page transition plays between pages; back button works               |    yes    |   [ ]   |
| Mobile menu opens, closes, and closes after choosing a link          |    yes    |   [ ]   |
| WhatsApp / Call bar shows on mobile only                             |    yes    |   [ ]   |
| Hero puppies swap with a name tag                                    |    yes    |   [ ]   |
| Door section pins and scrolls sideways on desktop                    |    yes    |   [ ]   |
| Chat shows "typing…" then messages as you scroll                     |    yes    |   [ ]   |
| Puppy filters work together and survive a refresh                    |    yes    |   [ ]   |
| Gallery next / previous, thumbnails, full screen, arrow keys, Escape |    yes    |   [ ]   |
| Both forms: empty submit shows errors; valid submit confirms         |    yes    |   [ ]   |
| FAQ: one note open at a time; search highlights and filters          |    yes    |   [ ]   |
| Refreshing any page does not 404 (live site)                         |    yes    |   [ ]   |
| Photos and fonts load (live site)                                    |    yes    |   [ ]   |
| The chat video on the home page plays (live site)                    |    no     |   [ ]   |
| Hover effects and the paw-print cursor trail                         |    no     |   [ ]   |
| Real iPhone (Safari) and real Android phone (Chrome)                 |    no     |   [ ]   |

## Not yet tested

- **Real devices.** Mobile results come from emulation (WebKit with an iPhone profile, Chromium with a Pixel profile), not physical phones.
- **Safari on macOS and iOS.** WebKit is the same engine but not the same browser build.
- **The live site from other networks and regions.** Section 6 was run from one machine on one connection, where downloads from Netlify were slow. Load times elsewhere are not known.
- **The full comparison suite on the live site.** The scroll-state comparison was repeated for the home page only, not all 15 combinations of section 2.1.
- **Hover-only details** such as card hover effects and the cursor paw trail. They come from the reference's stylesheet and a direct port of its canvas code, but no test here exercises them.
- **The enquiry endpoint.** The optional `VITE_ENQUIRY_ENDPOINT` path was not exercised against a real server.
