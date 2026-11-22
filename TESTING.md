# Testing

What was tested, how, and what the results were. Everything below was run on **22 November 2026** against the production build (`npm run build` served by `npm run preview` at `http://localhost:4173`), compared with the live reference at https://puppy.instabizweb.com/.

Anything not actually run is listed under [Not yet tested](#not-yet-tested) rather than marked as passed.

## Summary

| Area                                            | Result                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Build and type-check                            | Pass, 0 errors, 0 warnings                                                        |
| Console errors and failed requests              | None on any page, in any tested browser                                           |
| Layout and scroll state vs the reference        | No differences in 15 page and viewport combinations                               |
| Walking puppy vs the reference                  | 46 of 47 scroll steps identical; 1 step differed by 1px mid-movement              |
| Pixel comparison of 14 interactive states       | All within 0.25%; 5 are pixel-identical                                           |
| Functional checks, 3 engines + 2 phone profiles | 60 of 60 pass; 96 of 96 page loads clean                                          |
| Lighthouse, 5 pages (local build)               | Accessibility, best practices, SEO: 100. Performance: 89–98 desktop, 49–75 mobile |

## 1. Build

```bash
npm run build
```

Runs `tsc -b` (strict mode) and then `vite build`. Both complete with no errors or warnings.

## 2. Automated comparison with the reference

These checks drive a headless Chromium (Playwright) through both sites with identical input.

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
| FAQ, first note open                    | 1440     |              0.10% |
| FAQ, searching "deliver"                | 1440     |              0.02% |
| Family photo viewer open                | 1440     |              0.02% |
| Contact form, validation errors showing | 1440     |              0.00% |
| Puppies, filtered by Maltipoo           | 1440     |              0.08% |
| Puppy profile, top of page              | 1440     |              0.00% |
| Profile enquiry form, validation errors | 1440     |              0.00% |
| Profile gallery, full screen            | 1440     |              0.00% |
| Mobile menu open                        | 375      |              0.00% |
| How it works, "Imported" tab            | 1440     |              0.00% |
| 404 page                                | 1440     |              0.03% |
| Contact, scrolled                       | 375      |              0.09% |
| Puppies, scrolled                       | 768      |              0.23% |
| Gone home                               | 1024     |              0.04% |

The non-zero rows are the animated mascot caught at a different point in its blink or head tilt, and photo compression (the reference serves resized copies).

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
- **Mobile performance is the weak spot, and these local numbers are the worst case.** The local server sends every photo at full size, about 3.5 MB on the home page, and Lighthouse's slow-4G simulation charges all of it against the Largest Contentful Paint. The reference avoids this by resizing images on its server. The deployed site does the equivalent through Netlify Image CDN, which the local preview cannot run. **The mobile numbers must be re-measured on the live URL before quoting them.**
- The home page mobile score moved between 49 and 60 across three runs on this machine, so treat single mobile runs as approximate.
- Both sites deliberately keep a transition blanket over the page for about a second on first load, which costs LCP on each.

### Fixes made because of Lighthouse

- `robots.txt` was missing, so the SPA fallback served HTML in its place (SEO 92 → 100). It is now generated at build time, along with `sitemap.xml` on Netlify.
- JavaScript was one 2.3 MB file. It is now a library chunk, an app chunk and one chunk per page.
- Images are requested at display size through the image CDN on Netlify (not measurable locally, see above).
- The transition blanket is written into the HTML so the first paint is not a blank page.

### Live site

Fill this in after deploying (Chrome DevTools → Lighthouse, private window).

| Page | Mode    | Performance | Accessibility | Best practices | SEO |
| ---- | ------- | :---------: | :-----------: | :------------: | :-: |
| `/`  | Mobile  |             |               |                |     |
| `/`  | Desktop |             |               |                |     |

## 6. Manual checklist

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
| Refreshing any page does not 404 (live site)                         |    no     |   [ ]   |
| Photos, fonts and the chat video load (live site)                    |    no     |   [ ]   |
| Hover effects and the paw-print cursor trail                         |    no     |   [ ]   |
| Real iPhone (Safari) and real Android phone (Chrome)                 |    no     |   [ ]   |

## Not yet tested

- **Real devices.** Mobile results come from emulation (WebKit with an iPhone profile, Chromium with a Pixel profile), not physical phones.
- **Safari on macOS and iOS.** WebKit is the same engine but not the same browser build.
- **The live deployment.** All results here are from the local production build. After deploying, repeat the "live site" rows of the manual checklist and re-run Lighthouse on the live URL. In particular, the image CDN (`VITE_IMAGE_CDN`) only runs on Netlify, so resized images have not been exercised yet.
- **Hover-only details** such as card hover effects and the cursor paw trail. They come from the reference's stylesheet and a direct port of its canvas code, but no test here exercises them.
- **The enquiry endpoint.** The optional `VITE_ENQUIRY_ENDPOINT` path was not exercised against a real server.
