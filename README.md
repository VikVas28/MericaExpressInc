# Merica Express Inc — Cinematic freight & logistics site

A full-screen, animated one-page website for **Merica Express Inc**, an American
trucking & logistics company. Built as a premium, cinematic, scroll-driven
experience with a real 3D coverage globe.

**"America's Freight, Delivered." — Coast to coast, on time, every time.**

---

## ✨ What's inside

- **Cinematic hero** with a golden/blue-hour truck film still, parallax scrub and
  a live WebGL particle atmosphere layer.
- **Smooth scroll** (Lenis) bridged to **GSAP ScrollTrigger** for scrubbed
  parallax, staggered text builds and section reveals.
- **3D coverage globe** — a procedural Three.js dotted Earth with animated
  freight arcs travelling between US hubs (the "next-level" 3D centrepiece).
- **Custom cursor**, magnetic buttons, animated counters, infinite marquee and a
  cinematic grain/vignette layer.
- **Sections:** Hero · Stats · About · Services (FTL / OTR / Reefer / Expedited) ·
  Fleet · Coverage globe · Drivers (careers/recruitment) · Process · Contact.
- Fully **responsive** and **`prefers-reduced-motion`** aware — with no-JS/no-lib
  fallbacks so content is always readable.

## 🎨 Visuals

The cinematic imagery was generated with **Higgsfield** (Cinema Studio Image 2.5)
and is served from Higgsfield's public CDN — the URLs are referenced directly in
`index.html`, so the repo stays lightweight and nothing needs a build step.
The 3D globe is generated procedurally in the browser (no asset files).

## 🚀 Run / Deploy

It's a static site — no build required.

**Locally:**
```bash
# any static server, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

**GitHub Pages:** push this branch, then in the repo go to
**Settings → Pages → Build and deployment → Deploy from a branch**, pick this
branch and `/ (root)`. Your site goes live at
`https://<user>.github.io/<repo>/`.

(Works the same on Netlify, Vercel, Cloudflare Pages — just point them at the repo root.)

## ✏️ Edit before going live

Everything is plain HTML/CSS/JS. The placeholders to replace live in
`index.html` → **Contact** and **Footer** sections:

| Placeholder | Where |
|---|---|
| `(000) 000-0000` | Dispatch phone number |
| `MC #000000 · DOT #0000000` | Your FMCSA authority numbers |
| `Your City, State` | HQ / terminal address |
| Stats (`12M+`, `99%`, `48`) | `data-count` attributes in the Stats section |

The contact email `driversnonstop@gmail.com` is already wired into the "Get a
Quote" form (it opens the visitor's email app, pre-filled) and the footer.

## 📁 Structure

```
index.html            # markup + section content + CDN library tags
css/styles.css        # design system + all section styling
js/three-scene.js     # WebGL: hero particles + coverage globe (Three.js)
js/main.js            # Lenis + GSAP, cursor, counters, reveals, form
```

Libraries (GSAP, ScrollTrigger, Lenis, Three.js) load from CDN at runtime — the
visitor's browser fetches them, so there are no local dependencies to install.
