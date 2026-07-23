# Art direction — StyleHomes redesign (read alongside BRIEF.md & BUILD.md)

Chosen mood: **light, warm, editorial premium** — "boutique remodeling studio", not "loud
contractor". Modern (2025), airy, trustworthy. Crimson is the ACCENT, never the wallpaper.

## Overall feel
- **Light & warm.** Base is warm off-white / bone (not pure #fff, not gray). Generous whitespace
  is the primary luxury signal — let sections breathe, use large vertical spacing.
- **Editorial layout.** Asymmetric where it adds interest, strong type hierarchy, clear grid.
  Think architecture/interiors magazine, not a template.
- **Crimson `#8B0000` = accent only:** CTAs, links, small rules/underlines, active states,
  numerals, icon strokes. Do NOT flood sections with it. On a light page a little crimson reads
  expensive; a lot reads like a warning banner.
- **Gold `#fbbf24`:** keep tiny — rating stars / a hairline detail. Not a second brand color.

## Backgrounds & imagery (the key question)
- **Hero:** keep the video, but treat it editorially — softer/lighter overlay than today,
  confident type over it, plenty of margin. It should feel like a cover, not a banner.
- **Everything else = contained imagery.** Photos live in cards, framed panels, and grids with
  soft rounded corners and gentle shadows — NOT full-bleed dark-overlay backgrounds on every
  section. This is the single biggest shift from the current site.
- Section backgrounds: prefer solid warm-neutral fields with a contained photo, over a
  full-width photo-with-overlay. Use a photo background only where it earns it (hero, maybe one
  "statement" band), and keep those overlays light.
- Real project photos (kitchens/baths/panels) should feel like the product — show them crisp and
  well-lit in a gallery/grid, generous size, not buried behind text.

## Hero video — IMPORTANT: the hero video is VERTICAL (9:16 portrait)
The hero footage is portrait (720×1280), shot for phones. Do NOT design a full-width
landscape video background on desktop — a vertical clip stretched to 16:9 crops/blurs badly.
Instead use a **split hero**:
- **Desktop / landscape:** two-column hero — text column (H1 "KITCHEN & BATH REMODELING",
  subtitle, location, primary CTA) on one side; the **portrait video in a contained frame**
  (rounded corners, soft shadow, ~full hero height) on the other. Video is shown whole, never
  cropped or stretched. Warm off-white hero background around it — light and editorial.
- **Mobile / portrait:** the vertical video goes **full-bleed** behind the text, with a light
  bottom-to-top gradient so the headline/CTA stay legible (AA contrast).
- Video is muted, autoplays, loops; a poster image shows before it loads. Keep it feeling like a
  magazine cover, not a banner.

## Type
- Display/headings: a refined **serif** or high-contrast display face (craftsmanship, warmth,
  trust). Big, confident H1/H2.
- Body/UI: a clean neutral **grotesk** (Inter/Söhne-like). High legibility.
- Strong scale contrast between display and body. Comfortable line length (~60–70ch) for copy.

## Detail & motion
- Soft shadows + thin hairlines instead of hard #ddd borders. Rounded-but-restrained corners.
- Micro-motion only: gentle fade/rise on scroll (AOS is already available), smooth hover on
  cards/buttons. No heavy parallax, no bounce. Subtle = premium.
- Buttons: solid crimson primary + quiet outline/ghost secondary. Clear focus states (a11y).

## Guardrails
- Don't go dark/cinematic — that was explicitly not chosen.
- Don't add a second accent hue beyond crimson + the tiny gold.
- Modern ≠ trendy-fragile: keep it clean and timeless, must still read as a trustworthy local
  remodeling business, and must survive the SEO/semantic rules in BUILD.md.
- Accessibility: text on any photo/overlay must keep AA contrast.
