# TeddyPups Clone

A high-fidelity, pixel-perfect clone of [puppy.instabizweb.com](https://puppy.instabizweb.com/), built with **React 19, TypeScript, Vite, Motion, and Lenis** by **Gurdeep Rathee** for the Insta Biz Web technical assignment.

- **Live Deployed Site:** [https://teddypups-clone.netlify.app/](https://teddypups-clone.netlify.app/)
- **Reference Website:** [https://puppy.instabizweb.com/](https://puppy.instabizweb.com/)
- **GitHub Repository:** [https://github.com/gurdeeep/teddypups-clone](https://github.com/gurdeeep/teddypups-clone)

| Desktop View (1440px)                          | Mobile View (390px)                          |
| ---------------------------------------------- | -------------------------------------------- |
| ![Home page on desktop](docs/home-desktop.jpg) | ![Home page on mobile](docs/home-mobile.jpg) |

---

## 🌟 What is in the Application

The clone covers all 7 primary pages, 42 unique puppy profile pages, and a custom 404 page (50 routes in total):

| Route             | Features & Functionality                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/`               | Hero with puppy duck/pop animations, pinned horizontal door showcase, scroll-stepped WhatsApp chat, walking mascot, FAQ |
| `/puppies`        | Interactive catalogue with multi-facet filters (Breed, Gender) synced dynamically to URL query params                    |
| `/puppies/:slug`  | Photo & video gallery, page-turn transitions, full-screen lightbox, validated enquiry form, reading progress indicator    |
| `/happy-families` | 64-photo community gallery with modal photo viewer and responsive grid layout                                            |
| `/how-it-works`   | Tabbed adoption journey steps, scroll-driven interactive flight path                                                     |
| `/faq`            | Searchable interactive FAQ notice board with instant keyword filtering                                                   |
| `/contact`        | Fill-in-the-blanks letter form with interactive inputs, client-side validation, and send animations                      |
| `/gone-home`      | Showcase of previously adopted puppies                                                                                   |

**Global Core Features:**
- Blanket curtain page-transition animation between routes (`RouteCurtain.tsx`).
- Momentum smooth wheel scrolling via Lenis (`SmoothScroll.tsx`).
- Smart sticky header that tucks away on scroll-down and instantly reappears on scroll-up (`useHeaderBehavior.ts`).
- Mobile-responsive navigation drawer and sticky WhatsApp / Call bottom action bar.
- Interactive canvas paw-print cursor trail (`PawTrail.tsx`).

---

## 🛠️ Tech Stack & Implementation Architecture

| Technology            | Purpose & Decision Rationale                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **React 19**          | Powers all stateful UI (catalogue filters, modal lightboxes, forms, transitions) on top of static layout structures.          |
| **TypeScript**        | Strict types across puppies, media, route params, and component props; validated on every build with `tsc -b`.                 |
| **Vite 7**            | Fast development server with dynamic route-based code splitting via `import.meta.glob`.                                        |
| **Motion**            | Spring physics, layout animations, and frame-scheduler synchronization matching the original movement.                         |
| **Lenis**             | High-performance smooth scrolling configured with identical lerp (`0.1`) and wheel multiplier (`0.85`).                        |
| **html-react-parser** | Core hydration bridge: parses static page markup and replaces placeholder slots with interactive React components.             |
| **Playwright**        | Automated cross-browser smoke tests and synchronized state/pixel diffing against the live reference site (`tests/`).           |
| **Netlify**           | Production hosting with automated SPA redirects, immutable static caching, and Netlify Image CDN.                              |

### Three-Layer Architecture

Because the reference site is a closed Next.js production build without public source code, the application was engineered using a clean three-layer architecture:

1. **Captured Markup & Design System:**  
   Rendered page HTML is preserved in `src/templates/`, styled by `src/reference.css`. This guarantees 100% fidelity in spacing, typography, illustrated SVGs, and responsive breakpoints.
2. **React Dynamic Component Layer (`src/`, ~3,300 lines of TypeScript):**  
   Developed by Gurdeep Rathee using Claude Code. `src/Template.tsx` walks the template tree and calls a slot callback, allowing `src/pages/Page.tsx` to mount live interactive React components (catalogue filters, forms, lightboxes, and smooth route transitions).
3. **Mascot Animation Engine:**  
   Preserves the walking mascot's original compiled pose maths (`src/motion/reference-motion.js`), driven reactively by `src/components/PupBuddy.tsx` which feeds scroll positions into the animation loop.

---

## 📂 Project Structure

```text
.
├── index.html               # Entry HTML: preloads, meta tags, first-paint cover
├── netlify.toml             # Netlify build, SPA rewrite rules, CDN headers
├── vite.config.ts           # Route-based dynamic chunk splitting
├── docs/                    # Readme screenshots
├── tests/                   # Playwright smoke tests and scroll diff scripts
├── public/
│   ├── media/               # High-res puppy photos, videos, and posters
│   ├── brand/, cursor/      # Logo assets and custom canvas cursor
│   └── _next/static/media/  # Web font assets
└── src/
    ├── main.tsx             # Mounts React directly into <body> for CSS scoping
    ├── App.tsx              # Application shell, router integration, scroll reset
    ├── Template.tsx         # Template parser with dynamic React slot injection
    ├── reference.css        # Complete compiled stylesheet & design tokens
    ├── types.ts             # Domain models (Puppy, Media, Faq, Route)
    ├── shell/               # Persistent shell components
    │   ├── Shell.tsx            # Header, navigation, mobile drawer, footer
    │   ├── RouteCurtain.tsx     # Blanket page-transition state machine
    │   ├── SmoothScroll.tsx     # Lenis smooth scroll provider
    │   ├── useHeaderBehavior.ts # Scroll-direction header hide/show hook
    │   └── PawTrail.tsx         # Canvas cursor paw trail
    ├── pages/               # Route components
    │   ├── Page.tsx             # Route dispatcher & template slot injector
    │   └── NotFound.tsx         # Custom 404 page
    ├── home/                # Homepage-specific interactive widgets
    │   ├── HeroLineup.tsx       # Ducking & popping puppy quilt animation
    │   ├── MeetShowcase.tsx     # Pinned horizontal door scroll showcase
    │   └── ChatStory.tsx        # Scroll-stepped WhatsApp chat story
    ├── components/          # Reusable interactive components
    │   ├── PuppyBrowser.tsx     # Multi-facet URL-synced puppy filtering
    │   ├── PuppyGallery.tsx     # Profile page-turn gallery
    │   ├── PhotoViewer.tsx      # Full-screen modal lightbox (keyboard-accessible)
    │   ├── NoticeBoard.tsx      # Interactive FAQ search board
    │   ├── EnquiryForm.tsx      # Puppy enquiry form with client validation
    │   ├── LetterForm.tsx       # Contact letter form
    │   ├── JourneyTabs.tsx      # Adoption journey tabs
    │   ├── PupBuddy.tsx         # Reactive mascot controller
    │   └── MediaImage.tsx       # Responsive image with blur-up placeholder
    └── lib/                 # Utilities and custom hooks
        ├── router.ts            # History API router with lazy chunk loading
        ├── usePrefetch.ts       # Viewport-based link prefetching
        ├── enquiry.ts           # Form validation rules and submit logic
        ├── image.ts             # Netlify Image CDN srcset builder
        └── useDocumentMeta.ts   # Dynamic title, description, and OG meta tags
```

---

## 💻 Local Setup & Development

Requires **Node.js 20+** or **22+**.

```bash
# Clone the repository
git clone https://github.com/gurdeeep/teddypups-clone.git
cd teddypups-clone

# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Run TypeScript type check and production build
npm run build

# Preview production build locally (http://localhost:4173)
npm run preview

# Run Prettier code formatting
npm run format
```

---

## 🧠 Key Implementation Decisions & Technical Challenges

1. **Template Slot Hydration Architecture (`src/Template.tsx`):**  
   Re-writing 50 illustrated SVG-heavy pages by hand would have led to visual discrepancies and broken edge-case responsive layouts. By leveraging `html-react-parser` with a slot replacement callback, static templates are rendered with 100% visual precision, while dynamic components are injected cleanly wherever interactivity is needed.

2. **Mounting Directly into `<body>` (`src/main.tsx`):**  
   The reference stylesheet contains direct-child selectors such as `body > .curtain` and `html:has(> body > .tp-curtain[data-state=intro])`. Wrapping the application in a typical `<div id="root">` broke these selectors and skipped the intro curtain animation. Mounting React directly into `document.body` preserved all selector logic.

3. **Motion Frame Synchronization:**  
   The walking mascot, the pinned door showcase, and the Lenis scroll engine all update per frame. Running them in separate `requestAnimationFrame` loops caused the mascot to lag behind the scroll position. We unified them using Motion's frame scheduler: Lenis updates during the `read` phase, followed by springs and mascot calculations in `update`.

4. **URL-Synchronized Catalogue State (`src/components/PuppyBrowser.tsx`):**  
   Filter selections (Breed, Gender) update the browser URL query string without reloading. Users can refresh or bookmark filtered views (`/puppies?breed=maltipoo&gender=male`) and retain their exact filtered list.

5. **Resolving Route Latency via Link Prefetching (`src/lib/usePrefetch.ts`):**  
   Because all page templates are code-split into lazy chunks, navigating to a new route initially caused the blanket curtain to wait while downloading the next chunk. To make navigation instantaneous, `usePrefetch.ts` utilizes an `IntersectionObserver` to prefetch linked page chunks in the background during idle network time.

6. **Netlify Image CDN Integration (`src/lib/image.ts`):**  
   Uncompressed images initially totaled over 3.5 MB. We configured dynamic image resizing through the Netlify Image CDN (`/.netlify/images?url=...&w=...&q=80`) and generated responsive `srcset` attributes, cutting initial network payload substantially.

7. **The Silent Lenis Class Bug:**  
   During initial navigation updates, the page metadata hook was resetting `<html class>`, inadvertently wiping out the dynamic classes added by Lenis. Smooth scrolling silently broke. Our automated Playwright comparison script caught this discrepancy immediately, prompting a fix to preserve root classes.

8. **Client-Side Form Validation & Honeypot:**  
   Form inputs (Full Name, Phone/Email) validate client-side with the identical error tooltip styling and animations as the original. A hidden honeypot field prevents bot submissions, and endpoints can be dynamically configured via `VITE_ENQUIRY_ENDPOINT`.

---

## 🧪 Automated Testing & Verification

Comprehensive automated testing scripts are included in `tests/`:

```bash
# Install Playwright browser engines (first time only)
npx playwright install chromium firefox webkit

# 1. Run 60-check automated smoke suite (Chromium, Firefox, WebKit, Mobile Safari)
npm run test:smoke

# 2. Synchronous scroll-state comparison against the live reference site
npm run test:compare -- /puppies 375 812 900

# 3. Pixel regression test across 14 interactive states
npm run test:pixels
```

Detailed test logs, Lighthouse scores (90+ across all categories), and cross-browser audit tables are documented in [TESTING.md](TESTING.md).

---

## 🚀 Deployment & Production Configuration

Deployed on Netlify at [https://teddypups-clone.netlify.app/](https://teddypups-clone.netlify.app/) via [`netlify.toml`](netlify.toml):
- **Automated Production Build:** `npm run build` with Node 22 runtime.
- **SPA Rewrite Rule:** `/* -> /index.html 200` to prevent 404 errors on deep page refreshes (e.g. `/puppies/milo` or `/faq`).
- **Cache Headers:** 1-year immutable caching on hashed assets in `/assets/*`.

---

## 🤖 AI Tools & Prompt Engineering

The entire project was developed by **Gurdeep Rathee** using an AI-assisted engineering workflow with **Claude Code** (Anthropic). 

All prompts were engineered across structured phases (Scaffolding, Routing, Motion Choreography, Interactive Component State, Optimization, and Playwright Verification). The full, verbatim prompt logs are documented in [AI_PROMPTS.md](AI_PROMPTS.md).

---

## 📄 License & Attribution

Developed by **Gurdeep Rathee** as a technical assignment submission for **Insta Biz Web**.  
Original branding, illustrations, and media assets belong to their respective copyright holders.
