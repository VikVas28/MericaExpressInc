# Merica Express Inc — 3D scroll-through website

An immersive, fully 3D website for **Merica Express Inc**, an American trucking &
logistics company. Instead of photos, the whole page is a **WebGL night
interstate you fly down as you scroll** — the camera follows a semi truck,
rises into an aerial "coverage" view, and settles behind its taillights.

**"America's Freight, Delivered." — Coast to coast, on time, every time.**

---

## ✨ The experience

- **Procedural 3D world** (Three.js): night highway, moving truck, glowing lane
  lines, street lamps, passing headlight/taillight streaks, city skyline,
  distant mountains, stars and volumetric fog — all generated in the browser,
  **no image assets**.
- **Scroll drives the camera** along a cinematic keyframed path through the
  world; content **chapters fade in** synced to the camera position:
  Hero → Services → Coverage (aerial) → Fleet → Drivers → Contact.
- **Lenis** smooth scroll, custom cursor, magnetic buttons, a scroll progress
  bar and a preloader.
- **Progressive & robust:** if WebGL is unavailable or the visitor prefers
  reduced motion, it gracefully falls back to a clean stacked layout — content
  stays fully readable.

## 🚀 Run / Deploy

Static site, no build step.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → this branch → `/ (root)`.
Live URL: `https://<user>.github.io/<repo>/`. It auto-updates on every push.

## ✏️ Edit before going live

Placeholders to replace are in `index.html` (Contact chapter):

| Placeholder | Meaning |
|---|---|
| `(000) 000-0000` | Dispatch phone |
| `MC #000000 · DOT #0000000` | FMCSA authority numbers |
| `Your City, State` | HQ / terminal address |
| Stats (`12M+`, `99%`) | in the Services chapter |

The email `driversnonstop@gmail.com` is wired into the quote form and contact info.

## 🎚️ Tuning the 3D ride (in `js/three-world.js`)

| Want to change | Where |
|---|---|
| Ride length / pace | `scrollSpace.style.height = "880vh"` (bigger = slower) and `TRAVEL` |
| Camera path / beats | the `KEY[]` keyframe array (position + look-at per progress) |
| Truck colours | materials in `buildTruck()` (`red`, `silver`) |
| Fog / night mood | `scene.fog` density and the sky shader colours |
| Traffic amount | `buildStreaks(...)` counts |

## 📁 Structure

```
index.html            # nav + chapter overlays + contact form + CDN tags
css/styles.css        # design system, 3D-overlay layout + stacked fallback
js/three-world.js     # the WebGL night-highway world + scroll→camera + chapters
js/main.js            # Lenis, cursor, magnetic buttons, nav, form, preloader
```

Libraries (Three.js, GSAP, Lenis) load from CDN in the visitor's browser — no
local dependencies to install.
