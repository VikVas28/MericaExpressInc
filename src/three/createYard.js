/* =========================================================================
   MERICA EXPRESS — wireframe freight yard (Three.js)
   A dark, technical line-art depot: stacked containers, parked + moving
   wireframe trucks, a ground grid. The camera dollies through the yard as
   you scroll. Glowing thin lines, near-black, one green accent.
   ========================================================================= */
import * as THREE from "three";

export function createYard(canvas) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return null; }

  const BG = 0x060707;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 34, 118);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
  camera.position.set(0, 18, 60);

  // palette
  const WIRE = 0x8f9488;      // warm-grey wire
  const WIRE_HI = 0xd8d2bf;   // brighter wire
  const AMBER = 0xffbe63;
  const GREEN = 0xb7f24a;

  const world = new THREE.Group();
  scene.add(world);

  const matWire = () => new THREE.LineBasicMaterial({ color: WIRE, transparent: true, opacity: 0.32 });
  const matHi   = () => new THREE.LineBasicMaterial({ color: WIRE_HI, transparent: true, opacity: 0.55 });
  const matAmber = () => new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
  const matGreen = () => new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

  // reusable box edges
  function wireBox(w, h, d, mat) {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    return new THREE.LineSegments(geo, mat);
  }

  /* ---------------------------------------------------------- ground grid */
  (function grid() {
    const g = new THREE.GridHelper(320, 80, 0x2a2d28, 0x161915);
    g.material.transparent = true; g.material.opacity = 0.5;
    g.position.y = 0; world.add(g);
  })();

  /* ---------------------------------------------------------- containers */
  // yard of stacked shipping containers arranged in rows with lanes
  (function containers() {
    const CW = 2.6, CH = 2.6, CD = 6.0;           // container size
    const rows = [-22, -15.5, -9, 15.5, 22];       // z-rows (a wide lane in the middle)
    const xStart = -30, xStep = 3.1, perRow = 20;
    for (let r = 0; r < rows.length; r++) {
      for (let i = 0; i < perRow; i++) {
        if (Math.random() < 0.12) continue;         // gaps
        const stack = 1 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.22 ? 1 : 0);
        const x = xStart + i * xStep;
        for (let s = 0; s < stack; s++) {
          const hot = Math.random();
          const mat = hot > 0.94 ? matGreen() : hot > 0.82 ? matAmber() : (Math.random() > 0.6 ? matHi() : matWire());
          const box = wireBox(CW, CH, CD, mat);
          box.position.set(x, CH / 2 + s * (CH + 0.06), rows[r]);
          world.add(box);
        }
      }
    }
  })();

  /* ------------------------------------------------------- gantry frames */
  (function gantries() {
    for (let i = 0; i < 4; i++) {
      const z = -26 + i * 16;
      const frame = new THREE.Group();
      const legL = wireBox(0.5, 16, 0.5, matWire()); legL.position.set(-16, 8, z);
      const legR = wireBox(0.5, 16, 0.5, matWire()); legR.position.set(16, 8, z);
      const beam = wireBox(33, 0.6, 0.6, matWire()); beam.position.set(0, 16, z);
      frame.add(legL, legR, beam); world.add(frame);
    }
  })();

  /* ------------------------------------------------------- wireframe truck */
  function makeTruck(mat, matHi2) {
    const t = new THREE.Group();
    const trailer = wireBox(2.6, 3.0, 9, mat); trailer.position.set(0, 2.55, 3.4); t.add(trailer);
    const cab = wireBox(2.55, 2.5, 2.7, matHi2); cab.position.set(0, 2.3, -2.6); t.add(cab);
    const hood = wireBox(2.5, 1.4, 1.7, matHi2); hood.position.set(0, 1.6, -4.1); t.add(hood);
    // wheels as thin octagon rings via wireBox flattened cylinders (use small boxes)
    const zs = [-4, -2.4, 1.6, 3.2, 4.8];
    zs.forEach((z) => [-1.3, 1.3].forEach((x) => {
      const w = wireBox(0.5, 1.4, 1.4, mat); w.position.set(x, 0.75, z); t.add(w);
    }));
    return t;
  }

  // parked trucks
  const parkedZ = [-2, 4];
  parkedZ.forEach((z, i) => {
    const tr = makeTruck(matWire(), matHi());
    tr.position.set(-8 + i * 16, 0, z);
    tr.rotation.y = Math.PI / 2;
    world.add(tr);
  });

  // hero moving truck (down the central lane) — accented
  const heroTruck = makeTruck(matHi(), matGreen());
  heroTruck.rotation.y = Math.PI;          // faces -Z (drives into the scene)
  world.add(heroTruck);

  /* --------------------------------------------------------- ground fade */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 320),
    new THREE.MeshBasicMaterial({ color: 0x070808, transparent: true, opacity: 0.85 })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; world.add(floor);

  /* ------------------------------------------------------- camera path */
  const KEY = [
    { p: 0.00, px: 0,   py: 18,  pz: 60,  lx: 0,  ly: 3, lz: 0 },
    { p: 0.34, px: -7,  py: 7,   pz: 27,  lx: -2, ly: 3, lz: -6 },
    { p: 0.64, px: 5,   py: 3.4, pz: 6,   lx: 5,  ly: 3, lz: -26 },
    { p: 1.00, px: 0,   py: 6,   pz: -20, lx: 0,  ly: 3, lz: -64 },
  ];
  function sample(p) {
    if (p <= KEY[0].p) return KEY[0];
    if (p >= KEY[KEY.length - 1].p) return KEY[KEY.length - 1];
    for (let i = 0; i < KEY.length - 1; i++) {
      const a = KEY[i], b = KEY[i + 1];
      if (p >= a.p && p <= b.p) {
        let t = (p - a.p) / (b.p - a.p); t = t * t * (3 - 2 * t);
        return {
          px: a.px + (b.px - a.px) * t, py: a.py + (b.py - a.py) * t, pz: a.pz + (b.pz - a.pz) * t,
          lx: a.lx + (b.lx - a.lx) * t, ly: a.ly + (b.ly - a.ly) * t, lz: a.lz + (b.lz - a.lz) * t,
        };
      }
    }
    return KEY[0];
  }

  /* --------------------------------------------------------- loop / state */
  const clock = new THREE.Clock();
  const look = new THREE.Vector3();
  let pCam = 0, pTarget = 0, mx = 0, my = 0, raf = 0, disposed = false;

  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

  function onMouse(e) { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }
  window.addEventListener("mousemove", onMouse);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  function frame() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    pTarget = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    pCam += (pTarget - pCam) * 0.08;

    // moving hero truck loops down the central lane (x ~ 0)
    let tz = 30 - ((t * 7) % 96);
    heroTruck.position.set(0.4, 0, tz);

    // camera
    const k = sample(pCam);
    camera.position.set(k.px + mx * 3.2, k.py + -my * 1.6, k.pz);
    look.set(k.lx, k.ly, k.lz);
    camera.lookAt(look);

    // gentle world breathing
    world.rotation.y = Math.sin(t * 0.05) * 0.015;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduce) { renderer.render(scene, camera); }
  else { raf = requestAnimationFrame(frame); }

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
