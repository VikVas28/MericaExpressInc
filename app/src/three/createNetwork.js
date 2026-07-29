/* =========================================================================
   MERICA EXPRESS — coverage network graph (Three.js)
   A slowly rotating web of US hub nodes with glowing arcs and travelling
   pulses — the "one network, every lane" visual. Transparent, square canvas.
   ========================================================================= */
import * as THREE from "three";

export function createNetwork(canvas) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 14;

  const group = new THREE.Group(); scene.add(group);
  const R = 5, GREEN = 0xb7f24a, AMBER = 0xffb45a;
  const _t = {};
  function dot(hex) { if (_t[hex]) return _t[hex]; const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"); const g = x.createRadialGradient(16,16,0,16,16,16); g.addColorStop(0,hex); g.addColorStop(0.3,hex); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,32,32); const tx=new THREE.CanvasTexture(c); _t[hex]=tx; return tx; }

  const DEG = Math.PI / 180;
  const toVec = (lat, lng, r) => {
    const phi = (90 - lat) * DEG, th = (lng + 180) * DEG;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };
  const cities = {
    LA:[34,-118], SF:[37.8,-122.4], SEA:[47.6,-122.3], DEN:[39.7,-105], PHX:[33.4,-112],
    DAL:[32.8,-96.8], HOU:[29.8,-95.4], KC:[39.1,-94.6], CHI:[41.9,-87.6], MSP:[45,-93.3],
    ATL:[33.7,-84.4], MIA:[25.8,-80.2], NY:[40.7,-74], BOS:[42.4,-71], DC:[38.9,-77]
  };
  const lanes = [["LA","NY"],["SEA","MIA"],["SF","CHI"],["DAL","CHI"],["ATL","DEN"],["HOU","MSP"],["PHX","NY"],["KC","MIA"],["SEA","DEN"],["DAL","ATL"],["CHI","BOS"],["DEN","DC"]];

  // dotted globe
  const N = 1200, dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963; dp[i*3]=Math.cos(th)*rad*R; dp[i*3+1]=y*R; dp[i*3+2]=Math.sin(th)*rad*R; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  group.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x6a6450, size: 0.08, transparent: true, opacity: 0.5, depthWrite: false })));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 40, 40), new THREE.MeshBasicMaterial({ color: 0x0c0a06, transparent: true, opacity: 0.6 })));

  // city nodes
  const nodeMat = new THREE.MeshBasicMaterial({ color: GREEN });
  Object.values(cities).forEach((c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), nodeMat); m.position.copy(toVec(c[0], c[1], R * 1.01)); group.add(m); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot("#d3ff8a"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(0.7); s.position.copy(m.position); group.add(s); });

  // arcs + pulses
  const pulses = [];
  lanes.forEach((pair, i) => {
    const a = toVec(cities[pair[0]][0], cities[pair[0]][1], R * 1.01);
    const b = toVec(cities[pair[1]][0], cities[pair[1]][1], R * 1.01);
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1 + a.distanceTo(b) * 0.13));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const col = i % 3 === 0 ? AMBER : GREEN;
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })));
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(col === AMBER ? "#ffcf8a" : "#d3ff8a"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.setScalar(0.5); group.add(sp);
    pulses.push({ curve, sp, t: Math.random(), s: 0.0018 + Math.random() * 0.0022 });
  });

  group.rotation.y = -1.95; group.rotation.x = 0.32;
  let curY = group.rotation.y, tgtY = curY, raf = 0, disposed = false;

  function resize() { const r = canvas.parentElement.getBoundingClientRect(); const s = Math.max(1, r.width); renderer.setSize(s, s, false); }
  window.addEventListener("resize", resize); resize();

  function tick() {
    if (disposed) return;
    tgtY += 0.0016; curY += (tgtY - curY) * 0.06; group.rotation.y = curY;
    for (const p of pulses) { p.t = (p.t + p.s) % 1; p.sp.position.copy(p.curve.getPoint(p.t)); }
    renderer.render(scene, camera); raf = requestAnimationFrame(tick);
  }
  if (reduce) renderer.render(scene, camera); else raf = requestAnimationFrame(tick);

  return { dispose() { disposed = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); renderer.dispose(); } };
}
