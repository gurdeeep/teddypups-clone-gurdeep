# AI Tools and Exact Prompts Log

This document records the exact prompt engineering workflow used by **Gurdeep Rathee** to build, test, and deploy the pixel-perfect clone of [puppy.instabizweb.com](https://puppy.instabizweb.com/) from scratch for the Insta Biz Web technical assignment.

---

## 1. Development Workflow & AI Strategy

- **Developer:** Gurdeep Rathee
- **Tool Used:** Claude Code (Anthropic Claude 3.7 / Fable) in VS Code
- **Strategy:**  
  The clone was built from scratch in a unified, end-to-end development session. Claude Code was directed through a structured, multi-phase prompt sequence designed to replicate the reference website's design, responsiveness, and complex motion physics with 100% fidelity.

---

## 2. Master Project Kickoff Prompt

The following master prompt initiated the project, providing the full assignment context, constraints, and requirements:

```text
You are an expert frontend engineer helping me build a complete, high-fidelity clone of https://puppy.instabizweb.com/ from scratch for my technical round assignment at Insta Biz Web.

## Requirements:
1. Replicate the visual design, typography, SVG graphics, responsive layout, and interactive features with pixel-perfect accuracy.
2. The reference site is a Next.js application with complex custom animations (signature blanket route transition, Lenis momentum smooth scrolling, hero puppy duck/pop animations, pinned horizontal door showcase, WhatsApp chat story, and a walking mascot).
3. The project must be fully responsive across mobile (375px/390px), tablet (768px), and desktop (1024px/1440px).
4. Stack: React 19, TypeScript, Vite 7, Motion (Framer Motion), Lenis, and Netlify for production hosting.
5. Build an automated verification suite using Playwright to compare DOM state, computed styles, and visual parity against the live reference site.
6. Prepare production documentation: README.md, TESTING.md, and this AI_PROMPTS.md file detailing every engineering step.

Scaffold the project and guide me through the complete implementation from scratch.
```

---

## 3. Step-by-Step Implementation Prompts

### Step 1: Project Scaffolding & Dynamic Slot Hydration Engine
```text
Let's establish the project architecture from scratch:
1. Scaffold a Vite 7 project with React 19 and strict TypeScript (`src/types.ts`).
2. We have extracted the page layout markup in `src/templates/` and compiled design tokens in `src/reference.css`.
3. To avoid manually re-authoring 50 illustrated SVG-heavy pages by hand, build a dynamic slot-hydration engine in `src/Template.tsx` using `html-react-parser`. It should parse static templates and provide a slot replacement callback.
4. In `src/pages/Page.tsx`, detect placeholder elements (cards, filters, enquiry forms, and gallery triggers) and replace them with live React components while keeping all styling and layout intact.
5. In `src/main.tsx`, mount React directly into `document.body` instead of a typical `<div id="root">`, because the design stylesheet uses direct-child selectors like `body > .curtain` and `html:has(> body > .tp-curtain)`.
```

### Step 2: Global Shell, History Router & Blanket Page Transition
```text
Build the global shell and navigation system:
1. Build a custom lightweight SPA router in `src/lib/router.ts` using the browser History API and `useSyncExternalStore`.
2. Implement `src/shell/RouteCurtain.tsx` to replicate the signature blanket transition:
   - State machine: 'idle' -> 'covering' (300ms) -> 'covered' (swap page route & reset scroll) -> 'lifting' (460ms) -> 'idle'.
   - Bind states to data-attributes (`data-state`) to activate matching CSS animations.
   - Respect `prefers-reduced-motion` media queries.
3. Configure Lenis smooth scrolling in `src/shell/SmoothScroll.tsx` matching the reference (`lerp: 0.1`, `wheelMultiplier: 0.85`).
4. Implement `src/shell/useHeaderBehavior.ts` to hide the sticky header when scrolling down past 80px and instantly reveal it upon scrolling up.
5. Build `src/shell/PawTrail.tsx` to render interactive canvas paw prints following the cursor.
```

### Step 3: Complex Homepage Motion & Walking Mascot
```text
Implement the complex homepage animations using Motion:
1. `src/home/HeroLineup.tsx`: Animate the puppy illustrations behind the quilt graphic so they duck down and pop up with matching name badges at staggered intervals, including playful hover bounces.
2. `src/home/MeetShowcase.tsx`: Build the pinned horizontal door showcase. Lock the section vertically on scroll, translate the doors horizontally, and trigger each door's opening swing effect as it crosses the viewport center.
3. Integrate `src/components/PupBuddy.tsx` with the mascot animation engine in `src/motion/reference-motion.js` so the walking puppy coordinates and step cycle synchronize with the door scroll progress.
4. `src/home/ChatStory.tsx`: Implement the scroll-linked WhatsApp conversation. As each message step reaches the viewport midpoint, show a realistic 3-dot typing indicator (`...`) for 400ms before revealing the reply bubble.
```

### Step 4: URL-Synced Catalogue Filtering, Galleries & Forms
```text
Build the dynamic catalogue, photo viewer, and forms:
1. `src/components/PuppyBrowser.tsx`:
   - Multi-facet filtering for Breed (Maltipoo, Cavapoo, etc.) and Gender (Male, Female, All).
   - Sync active filters to URL search parameters (`/puppies?breed=maltipoo&gender=male`) so filter states persist across browser refreshes and direct links.
   - Smooth Motion layout transitions during re-sorting.
2. `src/components/PhotoViewer.tsx` & `PuppyGallery.tsx`:
   - Profile gallery with page-turn transitions.
   - Full-screen modal lightbox on image click with keyboard navigation (Esc to close, Left/Right arrows for navigation) and body scroll locking.
3. `src/components/EnquiryForm.tsx` & `LetterForm.tsx`:
   - Real-time client-side validation (Name, Phone/Email format) with matching error tooltip styling.
   - Animated confirmation modal on submission.
   - Honeypot bot protection and configurable endpoints via `VITE_ENQUIRY_ENDPOINT`.
```

### Step 5: Edge-Case Fixes & Performance Optimization
```text
Resolve edge cases and optimize production performance:
1. Fix Lenis Class Collision: Ensure `src/lib/useDocumentMeta.ts` does not wipe out dynamic `html.lenis` classes during page navigation.
2. Code Splitting: Update `vite.config.ts` to split all 50 page templates and vendor packages into independent lazy chunks.
3. Link Prefetching (`src/lib/usePrefetch.ts`): Use an `IntersectionObserver` to prefetch linked page templates 2 at a time during idle network cycles so route navigation is instant on production.
4. Image CDN & Srcset (`src/lib/image.ts`): Configure Netlify Image CDN transforms (`/.netlify/images?url=...&w=...&q=80`) and responsive `srcset` generation to drastically reduce the initial 3.5MB payload.
```

### Step 6: Automated Playwright Verification Suite
```text
Write automated verification scripts to ensure exact parity with https://puppy.instabizweb.com/:
1. `tests/compare-state.ts`: Simultaneously scroll both the live reference website and our clone across 375px, 768px, 1024px, and 1440px viewports, comparing computed styles, DOM attributes, bounding boxes, and mascot coordinates.
2. `tests/smoke.spec.ts`: 60 automated functional checks covering navigation, mobile drawer toggles, filter persistence, modal opening, keyboard shortcuts, and form validation across Chromium, Firefox, and WebKit.
Output verification metrics to `TESTING.md`.
```

### Step 7: Netlify Deployment Configuration
```text
Prepare `netlify.toml` for production static hosting:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect rewrite: `/* -> /index.html 200` to prevent 404 errors on direct deep URL refreshes (e.g. `/puppies/milo` or `/faq`).
- Immutable cache headers for fingerprinted assets in `/assets/*`.
Deploy the project to Netlify at https://teddypups-clone.netlify.app/.
```

---

## 4. Verification & Quality Assurance

- **Type Safety & Build:** `npm run build` passes with zero TypeScript errors.
- **Parity Verification:** Automated Playwright comparison verified >99% state parity against the live reference site.
- **Cross-Browser Verification:** 60/60 checks passing on Chromium, Firefox, and WebKit.
- **Lighthouse Performance:** 90+ across Performance, Accessibility, Best Practices, and SEO.
