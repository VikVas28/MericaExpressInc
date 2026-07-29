# Merica Express Inc — React + GSAP + Three.js

A dark, technical, "web-design-2026" style site for **Merica Express Inc**, an
American trucking & logistics company. The hero is a **live wireframe freight
yard** (Three.js line-art depot) that the camera glides through as you scroll,
with statements revealing on the left — then a clean content deck.

**"Moving America's Freight." — Coast to coast, on time, every time.**

## Stack
- **React 18 + Vite** (component UI, fast build)
- **GSAP + ScrollTrigger** (reveals, hero build, scroll sync)
- **Lenis** (smooth scroll)
- **Three.js** (procedural wireframe freight-yard: stacked containers, gantries,
  parked + one moving wireframe truck, ground grid; camera dollies on scroll)
- Near-black palette, one signal-green accent, mono technical labels

## Run locally
```bash
npm install
npm run dev        # dev server
npm run build      # outputs the static site to /docs
```

## Deploy (GitHub Pages)
The production build is committed to **`/docs`**. In the repo:
**Settings → Pages → Deploy from a branch → this branch → folder `/docs`.**
Live at `https://<user>.github.io/<repo>/`. Re-run `npm run build` and push to update.

## Edit before going live
Placeholders live in `src/App.jsx` (Contact section): dispatch phone
`(000) 000-0000`, authority `MC #000000 · DOT #0000000`, HQ `Your City, State`.
The email `driversnonstop@gmail.com` is already wired into the quote form.

## Structure
```
index.html                 # Vite entry
src/main.jsx               # React bootstrap
src/App.jsx                # page: hero, statements, services, coverage, fleet, drivers, contact
src/components/Nav.jsx
src/components/YardCanvas.jsx
src/three/createYard.js    # the Three.js wireframe freight yard + scroll→camera
src/styles.css             # dark technical design system
docs/                      # built site served by GitHub Pages
vite.config.js             # base './', outDir 'docs'
.claude/skills/            # UI/UX Pro Max design skill (MIT, NextLevelBuilder)
```

## Tuning the yard (`src/three/createYard.js`)
- Camera path: the `KEY[]` keyframes · Fog/mood: `scene.fog` · Colors: `WIRE`,
  `AMBER`, `GREEN` · Truck & containers: `makeTruck()` / `containers()`.

---
Design assisted by the **UI/UX Pro Max** skill (`.claude/skills/ui-ux-pro-max`, MIT © NextLevelBuilder).
