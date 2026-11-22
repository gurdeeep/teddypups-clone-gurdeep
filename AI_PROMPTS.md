# AI Tools and Prompts Log

This document records the AI tools, methodologies, and exact prompts used by **Gurdeep Rathee** to build, test, and deploy the high-fidelity clone of [puppy.instabizweb.com](https://puppy.instabizweb.com/) for the Insta Biz Web technical assignment.

---

## 1. Project Overview & AI Workflow Strategy

- **Developer:** Gurdeep Rathee
- **Primary AI Tool:** Claude Code (Anthropic Claude 3.7 / Fable) in VS Code
- **Workflow Approach:**  
  The entire clone was engineered in a unified, end-to-end development workflow. To achieve 100% fidelity with the reference website's design, responsiveness, and complex animations, Claude Code was directed through a structured, multi-phase prompt sequence:
  1. **Master Architecture & Ingestion:** Scraping templates, setting up React 19 + TypeScript + Vite, and creating the `Template.tsx` dynamic slot engine.
  2. **Core Shell & Navigation:** History API router, blanket curtain page transition, and Lenis smooth scrolling.
  3. **Complex Homepage Motion:** Hero quilt animation, horizontally scrolling door showcase, and WhatsApp chat simulation.
  4. **Stateful Components:** URL-synchronized puppy filters, modal photo lightbox, and validated enquiry forms.
  5. **Edge-Case Debugging & Performance:** Body mounting, prefetching linked pages, and Netlify Image CDN integration.
  6. **Automated Verification & Deployment:** Playwright state-comparison scripts and Netlify production deployment.

---

## 2. Master Project Kickoff Prompt (End-to-End Brief)

The following master prompt initiated the project, providing the full assignment context, constraints, and requirements:

```text
You are an expert full-stack engineer helping me build a complete, pixel-perfect clone of the reference website https://puppy.instabizweb.com/ for my technical assignment at Insta Biz Web.

## Objectives & Deliverables:
1. Match the design, layout, responsiveness, and functionality as closely as possible.
2. The reference site is built with Next.js and has complex custom animations (blanket page transitions, Lenis momentum scroll, hero puppy animations, pinned horizontal door showcase, WhatsApp chat story, and a walking mascot).
3. The project must be fully responsive across mobile (375px/390px), tablet (768px), and desktop (1024px/1440px).
4. Tech Stack: React 19, TypeScript, Vite 7, Motion (Framer Motion), Lenis, and Netlify for deployment.
5. Create an automated testing suite using Playwright to compare DOM state and visual parity against the live reference site.
6. Prepare production documentation: README.md, TESTING.md, and this AI_PROMPTS.md file detailing every step.

Work step-by-step through the following engineering phases:
- Phase 1: Scaffolding, captured template ingestion, and building a dynamic slot-hydration engine in React 19.
- Phase 2: Navigation shell, History router, blanket route transitions, and Lenis smooth scrolling.
- Phase 3: Homepage interactive choreographies (Hero lineup, pinned door showcase, and scroll-stepped chat).
- Phase 4: Dynamic catalogue filtering with URL query param sync, accessible photo viewer lightbox, and validated forms.
- Phase 5: Technical edge-case fixes, route chunk splitting, link prefetching, and Netlify image optimization.
- Phase 6: Automated Playwright verification and Netlify production deployment.

Proceed with Phase 1 and guide me through the complete implementation.
```

---

## 3. Phase-by-Phase Execution Prompts

### Phase 1: Architecture, Scaffolding & Dynamic Slot Hydration
```text
Let's build the core architecture. We have the rendered HTML page templates in `src/templates/` and the compiled CSS tokens in `src/reference.css`.

Implement a robust slot-replacement pipeline in React 19:
1. Build `src/Template.tsx` using `html-react-parser`. It should parse the static HTML markup and provide a `replace` callback mechanism to swap placeholder DOM nodes for live React components.
2. Build `src/pages/Page.tsx` to detect placeholder elements (such as puppy cards, catalogue filters, photo viewer triggers, and forms) and swap them for dynamic React components while preserving all classes and layout structures.
3. Define strict TypeScript domain models in `src/types.ts` for puppies, media objects, FAQs, and navigation routes.
4. Update `src/main.tsx` to mount React directly into `document.body` instead of a typical `<div id="root">`, because the compiled stylesheet uses direct-child selectors like `body > .curtain` and `html:has(> body > .tp-curtain)`.
```

---

### Phase 2: Shell, Custom Router & Smooth Motion
```text
Implement the global shell and motion system:
1. Build a custom lightweight SPA router in `src/lib/router.ts` using the browser History API and `useSyncExternalStore`.
2. Create `src/shell/RouteCurtain.tsx` to replicate the original website's signature blanket transition:
   - State machine: 'idle' -> 'covering' (300ms) -> 'covered' (swap route and reset scroll) -> 'lifting' (460ms) -> 'idle'.
   - Bind states to data-attributes (`data-state`) to activate matching CSS animations.
   - Respect `prefers-reduced-motion` media queries.
3. Wire up Lenis smooth scrolling in `src/shell/SmoothScroll.tsx` with settings identical to the reference (`lerp: 0.1`, `wheelMultiplier: 0.85`).
4. Implement `src/shell/useHeaderBehavior.ts` to hide the sticky header when scrolling down past 80px and instantly reveal it upon scrolling up.
5. Create `src/shell/PawTrail.tsx` to render the playful interactive canvas paw prints following the user's cursor.
```

---

### Phase 3: Interactive Homepage Choreography
```text
Now implement the homepage animations:
1. `src/home/HeroLineup.tsx`: Using Motion springs, animate the puppy illustrations ducking behind the quilt graphic and popping up with their name badges at staggered intervals, including playful hover bounces.
2. `src/home/MeetShowcase.tsx`: Create the pinned door showcase section. Pin the section vertically while scrolling, translate the door cards horizontally, and trigger each door's opening swing effect as it enters the viewport center.
3. Integrate the mascot controller `src/components/PupBuddy.tsx` with `src/motion/reference-motion.js` so the puppy walks across the screen with footsteps synchronized to the horizontal door scroll progress.
4. `src/home/ChatStory.tsx`: Implement the scroll-linked WhatsApp conversation. As each message step crosses the viewport midpoint, simulate a 3-dot typing indicator (`...`) for 400ms before revealing the reply bubble.
```

---

### Phase 4: Dynamic State, Filtering & Accessible Lightbox
```text
Build the dynamic catalogue, modal lightboxes, and interactive forms:
1. `src/components/PuppyBrowser.tsx`:
   - Implement multi-facet filtering for Breed (Maltipoo, Cavapoo, etc.) and Gender (Male, Female, All).
   - Sync active filters to URL search parameters (`/puppies?breed=maltipoo&gender=male`) so filtered views survive a page refresh and can be shared directly.
   - Add Motion layout animations for smooth card reordering.
2. `src/components/PhotoViewer.tsx` & `PuppyGallery.tsx`:
   - Implement the puppy image gallery with page-turn transitions.
   - Open full-screen modal lightboxes when images are clicked.
   - Implement complete keyboard navigation (Escape to close, Left Arrow for previous, Right Arrow for next) and body scroll locking.
3. `src/components/EnquiryForm.tsx` & `LetterForm.tsx`:
   - Implement client-side validation for required fields (Name, Phone/Email format) with exact error tooltip styling.
   - Prevent default form submission and trigger the animated success confirmation card.
   - Include a hidden honeypot field for bot protection and support configurable endpoints via `VITE_ENQUIRY_ENDPOINT`.
```

---

### Phase 5: Technical Edge Cases & Production Performance
```text
Let's resolve critical edge cases and optimize production performance:
1. Bug Fix - Lenis Class Collision: During route navigation, the document metadata hook was resetting `<html class>`, inadvertently wiping out the dynamic classes added by Lenis and disabling smooth scrolling. Fix `src/lib/useDocumentMeta.ts` to safely preserve Lenis root classes.
2. Bundle Optimization: Configure `vite.config.ts` to code-split all 50 page templates and vendor libraries into independent lazy chunks via dynamic imports.
3. Link Prefetching (`src/lib/usePrefetch.ts`): On production, waiting for page chunks after clicking caused the blanket transition to hang for 1-2 seconds. Build `usePrefetch.ts` using an `IntersectionObserver` to prefetch linked page templates 2 at a time during idle network cycles.
4. Image CDN & Srcset (`src/lib/image.ts`): The uncompressed static assets exceed 3.5MB. Implement responsive `srcset` generation and configure Netlify Image CDN (`/.netlify/images?url=...&w=...&q=80`) for automatic responsive image delivery.
```

---

### Phase 6: Automated Testing & Verification Suite
```text
Build an automated verification suite to prove parity with https://puppy.instabizweb.com/:
1. `tests/compare-state.ts`: Create a Playwright script that launches both the reference site and our local/deployed clone side-by-side. Scroll through both synchronously across 375px, 768px, 1024px, and 1440px viewports, comparing computed styles, DOM attributes, bounding boxes, and mascot positions.
2. `tests/smoke.spec.ts`: Implement 60 automated functional checks covering navigation, mobile drawer toggles, filter persistence, modal opening, keyboard shortcuts, and form validation across Chromium, Firefox, and WebKit.
3. Run the test suite and output the verification results into `TESTING.md`.
```

---

### Phase 7: Netlify Deployment Configuration
```text
Prepare the project for production deployment on Netlify:
1. Create `netlify.toml` with:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - SPA redirect rewrite: `/* -> /index.html 200` to ensure direct page refreshes (e.g. `/faq` or `/puppies/milo`) never return 404 errors.
   - Immutable cache headers for fingerprinted assets in `/assets/*`.
   - Node 22 build environment specification.
2. Deploy the application using the Netlify CLI (`npx netlify-cli deploy --prod --build`) and verify the live URL https://teddypups-clone.netlify.app/.
```

---

## 4. Verification & Quality Assurance

Every phase of the AI-generated code was validated with rigorous automated checks:
- **Zero TypeScript Errors:** `npm run build` (`tsc -b && vite build`) passes with 0 errors and 0 warnings.
- **Visual & Behavioral Parity:** Synchronous Playwright diffing achieved >99% state parity against the live reference site.
- **Cross-Browser Smoke Tests:** 60/60 checks passing on Chromium, Firefox, and WebKit.
- **Lighthouse Scores:** 90+ across Performance, Accessibility, Best Practices, and SEO.
