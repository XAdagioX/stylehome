# Build brief for StyleHomes — apply the design system to the real project

You have a completed **StyleHomes design system** (tokens + components + page comps).
Your job now is to **implement the real, production site** using that design system —
rebuilding the existing pages so they drop into the current codebase unchanged in behavior,
only changed in look. This is an implementation task, not a fresh mockup.

## Tech constraints (must match the existing repo — do NOT migrate frameworks)
- Static **Vite multi-page** site. Plain **HTML + CSS + vanilla TypeScript**. NO React/Vue/framework.
- 5 page entries (keep these exact filenames — they are wired in `vite.config.ts`):
  - `index.html` (home)
  - `kitchen-renovation.html`
  - `bathroom-renovation.html`
  - `wood-and-panel-wall-decor.html`
  - `whole-home-transformation.html`
- TS lives in `src/` (`src/modules/*`, `src/components/*`), styles in `src/style.css`.
- Third-party libs stay local in `js/libs/` (AOS css+js, anime.min.js). Keep the page loader
  (FOUC prevention) and the header transparent→solid-on-scroll behavior.
- **Clean URLs**: internal links use `/kitchen`, `/#section` form (a Vite plugin strips `.html`).
  Keep that convention — do NOT hardcode `.html` in nav/footer links.

## Wire up the REAL integrations (do not stub these)
- **Consultation form** — keep these exact field `name`s (backend + validation depend on them):
  `firstName, lastName, email, phone, location, projectType, budget, timeline, description`
  plus `photos` (multi-file upload) and the honeypot fields `author` + `companyName`
  (hidden from humans; if filled → treat as bot, silently drop).
  - Submits `POST` to `${backendUrl}/api/consultations`, where `backendUrl` comes from
    `window.BACKEND_URL` (empty in production → same-origin via Nginx proxy).
  - On success: show success message, reset form, AND fire the Google Ads conversion:
    `gtag('event','conversion',{send_to:'AW-17691818553/ads_conversion_1'})`.
- **Google Reviews** — keep the Elfsight widget exactly: script
  `https://static.elfsight.com/platform/platform.js` + the
  `elfsight-app-213e0852-bbc6-478e-b3b3-cfb65294e23f` div. Only restyle the section shell around it.
- **Analytics** — keep the gtag.js snippet (`AW-17691818553`) in every page `<head>`.
- **Assets** — use the real files already in the repo, not placeholders:
  hero `video/hero.mp4` (+ `img/hero-poster.jpg`), section backgrounds
  (`img/about_background.jpg`, `img/form_background.jpg`), service images
  (`img/kitchen.jpg`, `img/bathroom.jpg`, `img/panel.jpg`, `img/home.jpg`),
  project gallery in `img/projects/`, and `img/logo-red.svg` / `img/logo.png`.

## ⚠️ SEO — must be PRESERVED or IMPROVED, never regressed
This is a live lead-gen site that ranks locally. Treat SEO as a hard requirement:
- **Per-page `<head>`**: keep unique `<title>`, `<meta name="description">`, keywords,
  `<link rel="canonical">`, `lang` attr, `viewport`, robots, favicons.
- **Open Graph + Twitter Card** tags on every page (og:title/description/image/url/type,
  twitter:card/image) — carry them over, don't drop any.
- **JSON-LD structured data**: keep the schema.org `GeneralContractor`/`LocalBusiness` block
  (name, NAP, `areaServed` = Portland OR & Vancouver WA, services). Update it only if content changes.
- **Semantic HTML**: exactly one `<h1>` per page; logical `<h2>/<h3>` order; landmark elements
  (`<header><nav><main><section><footer>`); descriptive link text (no "click here").
- **Preserve keyword-bearing copy verbatim** — headings, service names, location strings.
  Restyle them; do not paraphrase them away.
- **Every image needs a meaningful `alt`** (carry existing alts over; add for new imagery).
- **Performance is a ranking factor (Core Web Vitals)**: lazy-load below-the-fold images,
  preload the hero, prefer WebP/AVIF with JPG fallback, avoid layout shift (set width/height),
  keep CSS/JS lean. The redesign must not make LCP/CLS worse.

## Deliverable
Production-ready files that replace the current look while keeping structure, copy, routes,
form behavior, integrations, and SEO intact. Each of the 5 pages fully styled with the design
system, responsive (mobile / tablet / desktop). Provide the updated `src/style.css` (or a
token layer + component styles) and the 5 rebuilt HTML pages.

## Out of scope
- Backend/API changes, form field renames, or the Elfsight embed internals.
- Logo redesign (treat logo as a fixed asset).
- Framework/CMS migration or changing the Vite multi-page setup.
