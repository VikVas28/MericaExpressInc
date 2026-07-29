/* =========================================================================
   MERICA EXPRESS — scroll-driven journey (Three.js)
   A truck drives down a warm-lit night depot street and INTO a warehouse as
   you scroll; the roll-up door opens as it arrives. Solid volumes + glowing
   edges (not thin sketch), amber + signal-green accents, chase camera.
   ========================================================================= */
import * as THREE from "three";

export function createJourney(canvas) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return null; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x070604, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0806, 44, 175);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);

  const WIRE = 0x9a8f7a, WIRE_HI = 0xe8dcc2, AMBER = 0xffb45a, GREEN = 0xb7f24a;
  const FILL = 0x140e09;
  const lineMat = (c, o) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });
  const glowLine = (c, o) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending });

  const world = new THREE.Group();
  scene.add(world);

  /* --------------------------------------------------------- helpers */
  const _tex = {};
  function glow(hex) {
    if (_tex[hex]) return _tex[hex];
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, hex); gr.addColorStop(0.3, hex); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); _tex[hex] = t; return t;
  }
  // solid volume + glowing edges
  function block(w, h, d, edgeColor, edgeOp, fillOp = 0.55, additive = false) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: FILL, transparent: true, opacity: fillOp }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), additive ? glowLine(edgeColor, edgeOp) : lineMat(edgeColor, edgeOp));
    g.add(mesh, edges); return g;
  }
  function edgeLine(x1, y1, x2, y2, mat) {
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]), mat);
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  const STREET_START = 55, DOOR_Z = -88, TRUCK_END = -108;

  /* ----------------------------------------------------------- ground */
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 260), new THREE.MeshBasicMaterial({ color: 0x0b0a08 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -50); world.add(road);
  const grid = new THREE.GridHelper(340, 84, 0x2c261c, 0x171310);
  grid.material.transparent = true; grid.material.opacity = 0.5; world.add(grid);
  [-7.6, 7.6].forEach((x) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 260), new THREE.MeshBasicMaterial({ color: WIRE_HI, transparent: true, opacity: 0.5 })); e.position.set(x, 0.02, -50); world.add(e); });
  for (let z = STREET_START; z > DOOR_Z; z -= 6) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 2.4), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })); d.position.set(0, 0.03, z); world.add(d); }

  /* --------------------------------------- container yard (both sides) */
  const CW = 2.6, CH = 2.6, CD = 6;
  function yardRow(xBase, zStart, count, dir) {
    for (let i = 0; i < count; i++) {
      const stacks = 1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0);
      const z = zStart - i * (CD + 1.1) * 1;
      for (let s = 0; s < stacks; s++) {
        const roll = Math.random();
        const col = roll > 0.9 ? GREEN : roll > 0.62 ? AMBER : WIRE;
        const op = col === WIRE ? 0.4 : 0.85;
        const b = block(CW, CH, CD, col, op, 0.6, col !== WIRE);
        b.position.set(xBase, CH / 2 + s * (CH + 0.05), z);
        world.add(b);
      }
    }
  }
  // yards flanking the street near the start (so the hero reads as a depot)
  yardRow(-13, STREET_START - 2, 7, 1);
  yardRow(-16.4, STREET_START - 6, 6, 1);
  yardRow(13, STREET_START - 4, 7, 1);
  yardRow(16.4, STREET_START - 9, 6, 1);

  /* --------------------------------------------- street buildings + lamps */
  const lampGlow = [];
  for (let z = STREET_START - 4; z > DOOR_Z + 6; z -= 13) {
    [-10.5, 10.5].forEach((x) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 7, 0.25), new THREE.MeshBasicMaterial({ color: 0x1a1712 })); post.position.set(x, 3.5, z); world.add(post);
      lampGlow.push(x + (x < 0 ? 1.6 : -1.6), 6.8, z);
    });
  }
  for (let i = 0; i < 10; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const w = 10 + Math.random() * 12, h = 14 + Math.random() * 34, d = 10 + Math.random() * 14;
    const b = block(w, h, d, WIRE, 0.26, 0.7);
    b.position.set(side * (30 + Math.random() * 26), h / 2, STREET_START - 6 - i * 13);
    world.add(b);
  }
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lampGlow), 3));
    world.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffbf6a, size: 3.2, map: glow("#ffcf8a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95, fog: false })));
  }

  /* ------------------------------------------------------- WAREHOUSE */
  const WH_W = 36, WH_H = 18, WH_D = 48, whZ = DOOR_Z - WH_D / 2;
  const warehouse = new THREE.Group(); world.add(warehouse);
  const shell = block(WH_W, WH_H, WH_D, WIRE_HI, 0.4, 0.5); shell.position.set(0, WH_H / 2, whZ); warehouse.add(shell);
  const band = new THREE.Mesh(new THREE.BoxGeometry(20, 2.6, 0.1), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })); band.position.set(0, WH_H - 2.8, DOOR_Z + 0.05); warehouse.add(band);
  // doorway
  const DOOR_W = 10, DOOR_H = 8.5;
  const doorFrame = new THREE.Group(); doorFrame.position.set(0, 0, DOOR_Z + 0.06); warehouse.add(doorFrame);
  const gm = glowLine(GREEN, 0.75);
  doorFrame.add(edgeLine(-DOOR_W / 2, 0, -DOOR_W / 2, DOOR_H, gm), edgeLine(DOOR_W / 2, 0, DOOR_W / 2, DOOR_H, gm), edgeLine(-DOOR_W / 2, DOOR_H, DOOR_W / 2, DOOR_H, gm));
  const door = new THREE.Group(); doorFrame.add(door);
  for (let i = 0; i < 8; i++) { const slat = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W - 0.2, DOOR_H / 8 - 0.05, 0.06), new THREE.MeshBasicMaterial({ color: WIRE_HI, transparent: true, opacity: 0.35 })); slat.position.set(0, (i + 0.5) * (DOOR_H / 8), 0); door.add(slat); }
  // interior racks
  for (let s = -1; s <= 1; s += 2) for (let r = 0; r < 4; r++) {
    const x = s * 11.5, z = DOOR_Z - 9 - r * 9.5;
    const u1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9, 0.2), new THREE.MeshBasicMaterial({ color: 0x2a2418 })); u1.position.set(x - 2.4, 4.5, z); warehouse.add(u1);
    const u2 = u1.clone(); u2.position.set(x + 2.4, 4.5, z); warehouse.add(u2);
    for (let lvl = 1; lvl <= 3; lvl++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: r === 1 ? GREEN : AMBER, transparent: true, opacity: r === 1 ? 0.7 : 0.4, blending: THREE.AdditiveBlending })); beam.position.set(x, lvl * 2.6, z); warehouse.add(beam); }
  }
  const inGrid = new THREE.GridHelper(32, 16, 0x3a3320, 0x1a1610); inGrid.material.transparent = true; inGrid.material.opacity = 0.4; inGrid.position.set(0, 0.02, whZ); warehouse.add(inGrid);

  /* --------------------------------------------------------- the TRUCK */
  const truck = new THREE.Group();
  const trailer = block(2.7, 3.1, 9, WIRE_HI, 0.7, 0.62); trailer.position.set(0, 2.6, 3.4); truck.add(trailer);
  const cab = block(2.6, 2.6, 2.8, GREEN, 0.95, 0.6, true); cab.position.set(0, 2.35, -2.6); truck.add(cab);
  const hood = block(2.55, 1.5, 1.8, GREEN, 0.85, 0.6, true); hood.position.set(0, 1.65, -4.1); truck.add(hood);
  const wheels = [];
  [-4, -2.4, 1.6, 3.2, 4.8].forEach((z) => [-1.32, 1.32].forEach((x) => { const w = block(0.5, 1.4, 1.4, WIRE, 0.5, 0.8); w.position.set(x, 0.75, z); truck.add(w); wheels.push(w); }));
  const headL = new THREE.PointLight(0xffe6b0, 0, 48, 2); headL.position.set(0, 1.5, -6); truck.add(headL);
  [-0.9, 0.9].forEach((x) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow("#fff0c8"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(1.7); s.position.set(x, 1.5, -5.2); truck.add(s); });
  truck.rotation.y = Math.PI;
  world.add(truck);

  scene.add(new THREE.AmbientLight(0x3a3020, 0.8));

  /* --------------------------------------------------- scroll + loop */
  const clock = new THREE.Clock();
  let pj = 0, raf = 0, disposed = false;
  const camPos = new THREE.Vector3(6, 5, STREET_START + 16);
  const camLook = new THREE.Vector3(0, 2.5, STREET_START);

  function journeyEndPx() {
    const deck = document.querySelector(".deck");
    return Math.max(1, deck ? deck.offsetTop - window.innerHeight * 0.55 : document.documentElement.scrollHeight * 0.6);
  }
  function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  window.addEventListener("resize", resize); resize();

  function frame() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const target = clamp01(window.scrollY / journeyEndPx());
    pj += (target - pj) * 0.10;
    const e = smooth(pj);

    const tz = STREET_START + (TRUCK_END - STREET_START) * e;
    truck.position.set(0, 0, tz);
    wheels.forEach((w) => (w.rotation.x -= dt * 10 * (0.4 + target)));

    const distToDoor = tz - DOOR_Z;
    door.position.y = clamp01((26 - distToDoor) / 26) * (DOOR_H - 0.2);
    headL.intensity = clamp01((30 - distToDoor) / 30) * 1.5;

    const wantPos = new THREE.Vector3(5.5, 4.6 + e * 0.6, tz + 15);
    const wantLook = new THREE.Vector3(0, 2.6, tz - 6);
    if (e > 0.82) { const k = smooth(clamp01((e - 0.82) / 0.18)); wantPos.x += (0 - 5.5) * k; wantPos.y += 1.2 * k; }
    camPos.lerp(wantPos, 0.06); camLook.lerp(wantLook, 0.08);
    camera.position.copy(camPos); camera.lookAt(camLook);

    world.rotation.y = Math.sin(t * 0.04) * 0.006;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduce) { truck.position.set(0, 0, -20); camera.position.set(6, 5, 6); camera.lookAt(0, 2.5, -20); renderer.render(scene, camera); }
  else raf = requestAnimationFrame(frame);

  return { dispose() { disposed = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); renderer.dispose(); } };
}
