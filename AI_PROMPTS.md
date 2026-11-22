# AI tools and prompts

Every AI tool used on this project, what it was used for, and the exact prompt, in chronological order.

Prompts are copied verbatim, including typos. Nothing here is paraphrased.

> **Before submitting:** sections 1 and 2 are placeholders. Replace everything marked `TODO` with the real tool name and the exact prompts you typed, and delete this note. If a section does not apply, delete the section.

---

## 1. Capturing the reference and building the first version

- **Tool:** `TODO: tool and model, for example "ChatGPT (GPT-…)" or "Cursor"`
- **Used for:** `TODO: one line, for example "saving the reference site's pages and assets, and generating the first React + TypeScript + Vite version"`
- **Date:** `TODO`

### Prompt 1.1

```text
TODO: paste the exact prompt here
```

### Prompt 1.2

```text
TODO: paste the exact prompt here (copy this block for each further prompt)
```

---

## 2. Follow-up changes to the first version

The first version was extended in several passes: the homepage walking puppy, the cursor paw trail, the Korea to Dubai flight path, the mascots' eye and tail movement, and the profile page ribbon.

- **Tool:** `TODO`
- **Used for:** `TODO`
- **Date:** `TODO`

### Prompt 2.1

```text
TODO: paste the exact prompt here
```

### Prompt 2.2

```text
TODO: paste the exact prompt here (copy this block for each further prompt)
```

---

## 3. Audit, comparison against the reference, rewrite and submission prep

- **Tool:** Claude Code (model: Claude Fable 5.2), in the VS Code extension
- **Date:** 22 November 2026
- **Used for:**
  - Auditing the codebase and comparing it with the live reference at 375, 768, 1024 and 1440px
  - Writing the comparison scripts that scroll both sites and diff their state and pixels
  - Rewriting the interactive layer to follow the reference's behaviour (smooth scroll, header, page transition, hero line-up, door showcase, chat, galleries, FAQ, filters, forms, mascot)
  - Syncing contact details and page metadata with the reference
  - Performance work (per-route code splitting, vendor chunk, image CDN), Netlify config
  - Cross-browser and Lighthouse testing
  - Writing `README.md`, `TESTING.md` and this file

### Prompt 3.1

Sent with the project folder attached. The text was pasted from a note and arrived cut off partway through step 8, exactly as shown.

```text
You are helping me finalize and submit a technical assignment for Insta Biz Web. I have already built a clone of https://puppy.instabizweb.com/ in this repository. Your job is to get it submission-ready and produce every deliverable. Work step by step, show me what you change, and ask before any destructive action (force-push, deleting files, overwriting config).

## Context
Assignment requirements:
- Clone the reference site, matching its design, layout, responsiveness and functionality as closely as possible.
- Deliver: (1) a live deployed URL, (2) a public GitHub repo with the complete source code, (3) a Loom video explaining my development process, project structure, tech and tools used, AI tools used with the exact prompts, implementation decisions, challenges, and testing/deployment.
- The reviewers will check that I understand my implementation, so everything you write must accurately describe THIS codebase. Do not invent anything.

## Step 1: Audit the project
- Read the whole repo and summarize the stack (framework, styling, libraries, build tool), the folder structure, and every page, section and component.
- Compare against the reference site section by section (navbar, hero, every content section, footer, any modals, forms, sliders, animations, hover states). List anything missing, broken or visibly different.
- Check responsiveness at 375px, 768px, 1024px and 1440px. List layout bugs.
- Check functionality: every link, nav item, mobile menu toggle, button, form (validation and submit behavior), carousel and scroll effect.
- Give me a prioritized fix list and wait for my go-ahead before fixing.

## Step 2: Fix and clean up
- Fix the approved issues.
- Remove dead code, console.logs, unused assets and unused dependencies.
- Make sure images are optimized and have alt text, the page has a proper <title>, meta description and favicon, and there are no console errors or warnings.
- Make sure `npm run build` (or the equivalent) passes with zero errors.
- Make sure no secrets or .env files are committed. Add or verify .gitignore.

## Step 3: Testing
- Run a production build and preview it locally.
- Run Lighthouse (or explain how I run it) for Performance, Accessibility, Best Practices and SEO, and fix any easy wins.
- Do a manual test checklist across the breakpoints above plus Chrome, Firefox and mobile Safari (or a mobile emulator), and record the results in TESTING.md.

## Step 4: README.md
Write a professional README with:
- Project title, a one-line description, and placeholders for the live URL and a screenshot
- Tech stack, with one line on why each piece was chosen
- Folder structure tree with a short explanation of each folder
- Local setup: clone, install, run dev, build
- Key implementation decisions and challenges, and how I solved each
- Testing approach (link to TESTING.md)
- Deployment details
- An "AI Tools Used" section listing the tools, with a link to AI_PROMPTS.md

## Step 5: AI_PROMPTS.md
Create AI_PROMPTS.md with a clear structure: tool name, what I used it for, and the exact prompt in a code block, in chronological order. Leave clearly marked placeholders where I will paste my real prompts. Do NOT fabricate prompts. Add the prompts from this session as well.

## Step 6: GitHub
- Make sure git is initialized, with clean, meaningful commits (no "fix", "update" spam). If the history is messy, suggest how to tidy it but don't rewrite it without asking.
- Give me the exact commands to create a public repo (gh CLI or manual) and push to the main branch.
- Add the repo description and topics.

## Step 7: Deployment
- Recommend the best host for this stack (Vercel or Netlify for most frontend stacks; GitHub Pages for plain static HTML/CSS/JS) and add any config it needs (vercel.json, netlify.toml, base path, SPA redirects).
- Give me exact step-by-step deploy instructions, connected to the GitHub repo so pushes auto-deploy.
- After deploying, give me a post-deploy checklist: all assets load, no 404s on refresh or direct routes, fonts and images load, responsive on a real phone.
- Update the README with the live URL.

## Step 8: Loom video script (target 6–8 minutes)
Write a speaking script with timestamps and on-screen actions:
1. Intro (20s): name, what I built, the live URL
2. Live demo (1.5 min): walk the site side by side with the original, show responsiveness via DevTools device mode, show

@TeddyPups-Clone-master/ this the complete code
```

**What came back:** a read-only audit (stack, structure, section-by-section comparison, responsiveness and functionality results) and a prioritized fix list. No files were changed.

### Prompt 3.2

Sent after reading the audit.

```text
also can you compare side wise both the orginal website and mine code is both the same website or not and the UI also smoothness in the clone website and make it look like exact similar one can't see and difference every minor detail should look same every responsiveness every movements of the dog means every minor detail should look same contact details also and i want to delpoy it to the netify and proceed with it and also proceed with all the deliverables
```

**What came back:** the comparison tooling, the rewrite of the interactive layer, the contact-detail and metadata sync, the performance and deployment work, the test runs, and the documentation.

---

## How the AI output was checked

- `npm run build` (TypeScript type-check plus production build) after every change
- The scroll-state and pixel comparison scripts described in [TESTING.md](TESTING.md), run against the live reference
- Functional and cross-browser runs recorded in [TESTING.md](TESTING.md)
