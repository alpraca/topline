# Topline — Arredo Casa e Ufficio

New website for [Topline](https://www.instagram.com/topline.al) — Albanian-Italian
interior design & complete furnishing for homes and offices, Tiranë, since 2003.

A motion-led, single-page-plus-collections static site. No framework, no build step.

## Structure

```
site/                  ← the deployable website (upload this folder, or let Render serve it)
├── index.html         ← home: hero, marquee, spaces, services, stats, studio, CTA
├── office.html        ← collection pages (7): full product catalog,
├── kitchen.html         155/52/137/131/50/88/20 pieces per category
├── living.html
├── bedroom.html
├── kids.html
├── dining.html
├── outdoor.html
├── css/style.css      ← design system: Fraunces + Inter, warm neutrals + terracotta
├── js/main.js         ← Lenis smooth scroll, GSAP/ScrollTrigger reveals, tabs,
│                        counters, slider, lightbox, custom cursor, lazy loading
├── vendor/            ← GSAP, ScrollTrigger, Lenis (self-hosted)
└── assets/            ← self-hosted fonts + optimized images (480/960/1400w variants)

scraper.py             ← original image scraper used to pull content from the old site
requirements.txt       ← Python deps for the scraper (requests, beautifulsoup4)
render.yaml            ← Render.com static deploy config (publishes ./site, no build)
```

## Deploy

Any static host works. The repo includes `render.yaml` for Render
(service `topline`, publishes the `site/` folder, no build command).
Make sure gzip/brotli compression is enabled on the host (default on
Render/Netlify/Vercel/nginx).

## Local preview

```
cd site
python -m http.server 8321
# open http://localhost:8321
```

Or just open `site/index.html` directly — the site is fully self-contained.

## Notes

- Performance: mobile Lighthouse 88–89, ~470KB initial payload, CLS 0.
- All product photography was migrated from the previous topline.al site
  (644 images, served as compressed responsive variants).
- Full-resolution originals live in `catalog_src/` locally — kept out of
  git (see `.gitignore`); back that folder up separately.
- `prefers-reduced-motion` is respected; the site works without JavaScript.
