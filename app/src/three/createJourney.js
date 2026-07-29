/* =========================================================================
   MERICA EXPRESS — scroll-driven journey (Three.js)
   A wireframe truck drives down a night street and INTO a warehouse as you
   scroll; the roll-up door opens as it arrives. The chase camera follows it.
   Dark near-black, thin glowing lines, one signal-green accent.
   ========================================================================= */
import * as THREE from "three";

export function createJourney(canvas) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return null; }

  const BG = 0x060707;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 40, 165);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);

  const WIRE = 0x8f9488, WIRE_HI = 0xd8d2bf, AMBER = 0xffbe63, GREEN = 0xb7f24a;
  const mWire = (o = 0.30) => new THREE.LineBasicMaterial({ color: WIRE, transparent: true, opacity: o });
  const mHi   = (o = 0.55) => new THREE.LineBasicMaterial({ color: WIRE_HI, transparent: true, opacity: o });
  const mAmber = () => new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  const mGreen = (o = 0.95) => new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: o, blending: THREE.AdditiveBlending });
  const wireBox = (w, h, d, mat) => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), mat);

  /* --------------------------------------------------------- helpers */
  const _tex = {};
  function glow(hex) {
    if (_tex[hex]) return _tex[hex];
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, hex); gr.addColorStop(0.3, hex); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); _tex[hex] = t; return t;
  }
  function edgeLine(x1, y1, x2, y2, mat) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]);
    return new THREE.Line(g, mat);
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  const world = new THREE.Group();
  scene.add(world);

  /* --------------------------------------------------- street geometry */
  const STREET_START = 55;      // truck spawn z
  const DOOR_Z = -88;           // warehouse front / door plane
  const TRUCK_END = -108;       // truck resting z (inside)

  // road
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 240), new THREE.MeshBasicMaterial({ color: 0x0a0c0b }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -40); world.add(road);
  // ground grid
  const grid = new THREE.GridHelper(320, 80, 0x22251f, 0x141712);
  grid.material.transparent = true; grid.material.opacity = 0.45; world.add(grid);
  // road edges
  [-7.6, 7.6].forEach((x) => { const e = wireBox(0.12, 0.02, 240, mHi(0.5)); e.position.set(x, 0.02, -40); world.add(e); });
  // center dashes
  for (let z = STREET_START; z > DOOR_Z; z -= 6) { const d = wireBox(0.14, 0.02, 2.4, mAmber()); d.position.set(0, 0.02, z); world.add(d); }

  // street props: buildings + lamps + parked units along both sides
  const lampGlow = [];
  for (let z = STREET_START - 4; z > DOOR_Z + 6; z -= 13) {
    [-10.5, 10.5].forEach((x) => {
      const post = wireBox(0.25, 7, 0.25, mWire(0.4)); post.position.set(x, 3.5, z); world.add(post);
      const arm = wireBox(1.8, 0.14, 0.14, mWire(0.4)); arm.position.set(x + (x < 0 ? 0.9 : -0.9), 6.9, z); world.add(arm);
      lampGlow.push(x + (x < 0 ? 1.7 : -1.7), 6.8, z);
    });
  }
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const w = 8 + Math.random() * 10, h = 9 + Math.random() * 30, d = 8 + Math.random() * 12;
    const b = wireBox(w, h, d, mWire(0.22));
    b.position.set(side * (18 + Math.random() * 22), h / 2, STREET_START - 8 - i * 11);
    world.add(b);
  }
  // parked wireframe container/truck hints
  for (let i = 0; i < 4; i++) {
    const c = wireBox(2.4, 2.6, 6, Math.random() > 0.7 ? mAmber() : mWire(0.3));
    c.position.set((i % 2 ? 1 : -1) * 11.5, 1.4, STREET_START - 12 - i * 20); world.add(c);
  }
  // lamp glow points
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lampGlow), 3));
    world.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffc06a, size: 2.8, map: glow("#ffcf8a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9, fog: false })));
  }

  /* ------------------------------------------------------- WAREHOUSE */
  const WH_W = 34, WH_H = 17, WH_D = 46;
  const whCenterZ = DOOR_Z - WH_D / 2;   // building extends behind the door
  const warehouse = new THREE.Group(); world.add(warehouse);
  // shell (skip front face fullness — we add a doorway)
  const shell = wireBox(WH_W, WH_H, WH_D, mWire(0.34)); shell.position.set(0, WH_H / 2, whCenterZ); warehouse.add(shell);
  // roof ridge lines for depth
  for (let i = 1; i < 6; i++) { const r = wireBox(WH_W, 0.05, 0.05, mWire(0.18)); r.position.set(0, WH_H, whCenterZ - WH_D / 2 + i * (WH_D / 6)); warehouse.add(r); }
  // MERICA sign band on the facade (green)
  const band = wireBox(18, 2.4, 0.1, mGreen(0.8)); band.position.set(0, WH_H - 2.6, DOOR_Z + 0.05); warehouse.add(band);
  // doorway frame
  const DOOR_W = 9, DOOR_H = 8;
  const doorFrame = new THREE.Group(); doorFrame.position.set(0, 0, DOOR_Z + 0.06); warehouse.add(doorFrame);
  doorFrame.add(edgeLine(-DOOR_W / 2, 0, -DOOR_W / 2, DOOR_H, mGreen(0.7)));
  doorFrame.add(edgeLine(DOOR_W / 2, 0, DOOR_W / 2, DOOR_H, mGreen(0.7)));
  doorFrame.add(edgeLine(-DOOR_W / 2, DOOR_H, DOOR_W / 2, DOOR_H, mGreen(0.7)));
  // roll-up door (slats) that lifts open
  const door = new THREE.Group(); doorFrame.add(door);
  for (let i = 0; i < 7; i++) { const slat = wireBox(DOOR_W - 0.2, DOOR_H / 7 - 0.06, 0.06, mHi(0.5)); slat.position.set(0, (i + 0.5) * (DOOR_H / 7), 0); door.add(slat); }

  // interior racks
  for (let s = -1; s <= 1; s += 2) {
    for (let r = 0; r < 4; r++) {
      const rack = new THREE.Group();
      const z = DOOR_Z - 8 - r * 9;
      const x = s * 11;
      const upright1 = wireBox(0.2, 9, 0.2, mWire(0.35)); upright1.position.set(x - 2, 4.5, z);
      const upright2 = wireBox(0.2, 9, 0.2, mWire(0.35)); upright2.position.set(x + 2, 4.5, z);
      rack.add(upright1, upright2);
      for (let lvl = 1; lvl <= 3; lvl++) { const beam = wireBox(4.4, 0.15, 0.15, r === 1 ? mGreen(0.5) : mWire(0.3)); beam.position.set(x, lvl * 2.6, z); rack.add(beam); }
      warehouse.add(rack);
    }
  }
  // interior floor grid
  const inGrid = new THREE.GridHelper(30, 15, 0x2a3320, 0x161c12);
  inGrid.material.transparent = true; inGrid.material.opacity = 0.4; inGrid.position.set(0, 0.02, whCenterZ); warehouse.add(inGrid);

  /* --------------------------------------------------------- the TRUCK */
  const truck = new THREE.Group();
  const trailer = wireBox(2.6, 3.0, 9, mHi(0.6)); trailer.position.set(0, 2.55, 3.4); truck.add(trailer);
  const cab = wireBox(2.55, 2.5, 2.7, mGreen(0.95)); cab.position.set(0, 2.3, -2.6); truck.add(cab);
  const hood = wireBox(2.5, 1.4, 1.7, mGreen(0.8)); hood.position.set(0, 1.6, -4.1); truck.add(hood);
  const wheels = [];
  [-4, -2.4, 1.6, 3.2, 4.8].forEach((z) => [-1.3, 1.3].forEach((x) => { const w = wireBox(0.5, 1.4, 1.4, mWire(0.5)); w.position.set(x, 0.75, z); truck.add(w); wheels.push(w); }));
  // headlights
  const headL = new THREE.PointLight(0xffe6b0, 0, 46, 2); headL.position.set(0, 1.5, -6); truck.add(headL);
  [-0.85, 0.85].forEach((x) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow("#fff0c8"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(1.6); s.position.set(x, 1.5, -5.1); truck.add(s); });
  truck.rotation.y = Math.PI;   // faces -Z (drives into the scene)
  world.add(truck);

  /* --------------------------------------------------------- lights */
  scene.add(new THREE.AmbientLight(0x30384a, 0.7));
  scene.add(new THREE.HemisphereLight(0x3a4668, 0x05060a, 0.5));

  /* ----------------------------------------------------- scroll + loop */
  const clock = new THREE.Clock();
  let pj = 0, raf = 0, disposed = false;
  const camPos = new THREE.Vector3(6, 5, STREET_START + 16);
  const camLook = new THREE.Vector3(0, 2.5, STREET_START);

  function journeyEndPx() {
    const deck = document.querySelector(".deck");
    const end = deck ? deck.offsetTop - window.innerHeight * 0.55 : document.documentElement.scrollHeight * 0.6;
    return Math.max(1, end);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();

  function frame() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const target = clamp01(window.scrollY / journeyEndPx());
    pj += (target - pj) * 0.10;
    const e = smooth(pj);

    // truck drives street -> into warehouse
    const tz = STREET_START + (TRUCK_END - STREET_START) * e;
    truck.position.set(0, 0, tz);
    wheels.forEach((w) => (w.rotation.x -= dt * 10 * (0.4 + target)));

    // door opens as the truck nears it
    const distToDoor = tz - DOOR_Z;                 // +ve while approaching
    const openAmt = clamp01((26 - distToDoor) / 26); // starts opening ~26 units out
    door.position.y = openAmt * (DOOR_H - 0.2);
    // headlights on once close / inside (illuminate racks)
    headL.intensity = clamp01((30 - distToDoor) / 30) * 1.4;

    // chase camera: behind + to the side + elevated, looking just ahead of truck
    const wantPos = new THREE.Vector3(5.5, 4.6 + e * 0.6, tz + 15);
    const wantLook = new THREE.Vector3(0, 2.6, tz - 6);
    // as it enters, tuck the camera toward the doorway so we follow it in
    if (e > 0.82) {
      const k = smooth(clamp01((e - 0.82) / 0.18));
      wantPos.x += (0 - 5.5) * k;
      wantPos.z += (tz + 22 - (tz + 15)) * 0; // keep distance
      wantPos.y += (1.2) * k;
    }
    camPos.lerp(wantPos, 0.06);
    camLook.lerp(wantLook, 0.08);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    world.rotation.y = Math.sin(t * 0.04) * 0.006;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduce) {
    truck.position.set(0, 0, -20); camera.position.set(6, 5, 6); camera.lookAt(0, 2.5, -20);
    renderer.render(scene, camera);
  } else { raf = requestAnimationFrame(frame); }

  return {
    dispose() {
      disposed = true; cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize); renderer.dispose();
    },
  };
}
