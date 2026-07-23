# Redesign brief for StyleHomes — kitchen & bath remodeling site

## Context
StyleHomes is a kitchen/bathroom remodeling company serving Portland OR & Vancouver WA,
founded by Taras Chaika. The site is a marketing/lead-gen site: hero video → services →
consultation form → about → services grid → project gallery → Google reviews →
"ready to start in 2 weeks" founder quote → FAQ accordion → footer.

Tech: static HTML/TS (Vite), no framework — so deliver plain HTML/CSS (+ minimal vanilla JS
for interactions like accordion/carousel/lightbox), not React components.

## Brand constraint: evolve, don't replace
Keep deep crimson `#8B0000` as the identity anchor color (it's the brand's visual signature —
used in CTAs, logo, accents). Do NOT propose a different hue family.

What should change:
- **Neutrals**: current grays (#333/#555/#777 text, #f5f5f5/#faf8f5 backgrounds) feel generic.
  Propose a warmer, more editorial neutral palette (think warm off-whites, soft charcoal,
  not pure gray) that makes the crimson feel premium rather than corporate-alert-red.
- **Whitespace & rhythm**: current sections are dense. Increase breathing room, establish
  a clear vertical rhythm/spacing scale.
- **Typography**: currently Poppins for headings + system sans for body. Propose a more
  distinctive pairing — a refined serif or high-contrast display face for H1/H2 (renovation
  = craftsmanship, warmth, trust) paired with a clean grotesk for body/UI. Define a type scale.
- **Contrast & depth**: soften harsh shadows/borders, use subtle layering (soft shadows,
  thin hairlines) instead of hard #ddd borders everywhere.
- **Gold accent** (`#fbbf24`) is used sparingly today (award/rating stars) — keep it as a
  secondary accent, don't expand its role.

## What to deliver
1. **Design tokens**: color scale (crimson + evolved neutrals + gold accent, with
   tints/shades), type scale (font families, sizes, weights, line-heights), spacing scale,
   radius/shadow scale.
2. **Component set**, styled with the new system:
   - Header (transparent-over-hero → solid-on-scroll behavior)
   - Hero (video background + overlay + badge + title card)
   - Service card (2-up, image + overlay title, links to subpages)
   - Consultation form (multi-field, photo upload, honeypot field, validation states)
   - About/mission section (text + supporting visual)
   - Services grid (icon + title + description cards)
   - Project gallery (grid → carousel → lightbox)
   - Testimonials/reviews section (currently embeds Elfsight Google Reviews widget —
     design the surrounding section shell, not the widget internals)
   - "Ready to start" founder-quote section
   - FAQ accordion
   - Footer (brand/contact, quick links, service areas, services list)
3. **Two full page comps**: the home page (all sections above in order) and one
   service subpage (e.g. kitchen-renovation — hero + content + same consultation form + footer).
4. **Responsive behavior**: mobile, tablet, desktop breakpoints for every component above —
   this audience browses heavily on mobile (home-services searches).

## Content to use verbatim (don't invent new copy)
- Hero: "KITCHEN & BATH REMODELING" / "Smart Investment • Quality Craftsmanship" /
  "Portland OR & Vancouver WA"
- Service cards: "Kitchen Renovation", "Bathroom Renovation"
- Consultation: "Get Your Free Consultation Today"
- About: "Our Mission" — homeowner-first positioning, decorative wall panels & wood slat
  walls specialty, "refresh a room in just 1–2 days", resale-focused clients, "cozy, modern
  homes" mission
- "Ready to Start in Just 2 Weeks" + founder quote: "We want you to trust us... we treat
  every home as if it were our own." — Taras Chaika, Founder of StyleHomes
- FAQ questions (8): renovation duration, material/design help, staying during renovation,
  warranty, payment schedule, turnkey option, cost estimate, customization

## Explicitly out of scope
- Don't touch backend/API behavior, form field names, or the Elfsight embed script itself.
- Don't redesign the logo/wordmark — treat it as a fixed asset in the header/footer.
- Don't introduce a CMS or framework migration — output must drop into a static Vite site.
