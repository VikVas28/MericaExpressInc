/* =========================================================================
   MERICA EXPRESS — 3D scroll-through world (Three.js r128)
   A procedural night interstate you fly down as you scroll. No photos.
   Camera glides forward, rises for an aerial "coverage" beat, then settles
   behind the truck's taillights. Chapters fade in synced to camera position.
   Fully progressive: no WebGL / reduced motion => stacked fallback (main.js).
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof THREE === "undefined" || reduce) return;

  var canvas = document.getElementById("world");
  if (!canvas) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return; }        // no WebGL -> leave fallback mode

  // We have WebGL: switch the page into immersive 3D mode.
  document.body.classList.add("mode-3d");
  var scrollSpace = document.getElementById("scrollSpace");
  if (scrollSpace) scrollSpace.style.height = "880vh";

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x05070d, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b14, 0.0060);

  var camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1200);
  camera.position.set(0, 2.6, 24);

  var TRAVEL = 440;       // how far the camera flies
  var START_Z = 24;
  var TRUCK_AHEAD = 34;

  var dummy = new THREE.Object3D();
  var clock = new THREE.Clock();

  /* ------------------------------------------------------------- SKY */
  (function sky() {
    var uniforms = {
      top:    { value: new THREE.Color(0x04060c) },
      mid:    { value: new THREE.Color(0x0a1226) },
      bottom: { value: new THREE.Color(0x2a1330) },
      offset: { value: 12 }, exponent: { value: 0.7 }
    };
    var mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: uniforms,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform float offset; uniform float exponent; varying vec3 vP;" +
        "void main(){ float h = normalize(vP + vec3(0.0, offset, 0.0)).y;" +
        " vec3 col = h > 0.0 ? mix(mid, top, pow(clamp(h,0.0,1.0), exponent)) : mix(mid, bottom, pow(clamp(-h,0.0,1.0), 0.5));" +
        " gl_FragColor = vec4(col, 1.0); }"
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), mat));
  })();

  /* ------------------------------------------------------------ STARS */
  (function stars() {
    var n = 700, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var r = 400 + Math.random() * 150;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.random() * Math.PI * 0.42;               // upper hemisphere
      pos[i*3]   = Math.cos(th) * Math.sin(ph) * r;
      pos[i*3+1] = Math.cos(ph) * r + 30;
      pos[i*3+2] = Math.sin(th) * Math.sin(ph) * r - 200;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb4d8, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.85, map: glowTex("#cdd8f0"), depthWrite: false, fog: false })));
  })();

  /* ------------------------------------------------------------ LIGHTS */
  scene.add(new THREE.AmbientLight(0x2a3352, 0.7));
  var hemi = new THREE.HemisphereLight(0x33406b, 0x02030a, 0.6); scene.add(hemi);
  var moon = new THREE.DirectionalLight(0x7d8fc0, 0.5); moon.position.set(-40, 60, 20); scene.add(moon);

  /* -------------------------------------------------------------- ROAD */
  var ROAD_LEN = 620, roadCenter = -(ROAD_LEN / 2 - START_Z);
  var road = new THREE.Mesh(
    new THREE.PlaneGeometry(28, ROAD_LEN),
    new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.82, metalness: 0.15 })
  );
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, roadCenter);
  scene.add(road);

  // ground haze plane beyond the road (very dark), widens the world
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(400, ROAD_LEN), new THREE.MeshStandardMaterial({ color: 0x06080f, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, roadCenter); scene.add(ground);

  // edge lines (continuous emissive strips)
  [-8.6, 8.6].forEach(function (x) {
    var edge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, ROAD_LEN), emissiveMat(0x6f8dd6, 1.4));
    edge.position.set(x, 0.02, roadCenter); scene.add(edge);
  });

  // dashed lane lines (instanced) at x = -2.9, 2.9  + center double
  (function dashes() {
    var xs = [-2.9, 2.9, -0.15, 0.15];
    var step = 7.5, count = Math.floor(ROAD_LEN / step) * xs.length;
    var mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 2.7), emissiveMat(0xffcf87, 1.6), count);
    var i = 0;
    for (var k = 0; k < xs.length; k++) {
      for (var z = START_Z; z > START_Z - ROAD_LEN; z -= step) {
        dummy.position.set(xs[k], 0.02, z); dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1); dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.count = i; scene.add(mesh);
  })();

  /* ------------------------------------------------------ LIGHT POLES */
  var lampPos = [];
  (function poles() {
    var step = 26, xs = [-11.5, 11.5];
    var positions = [];
    for (var k = 0; k < xs.length; k++)
      for (var z = START_Z; z > START_Z - ROAD_LEN; z -= step)
        positions.push([xs[k], z]);
    var post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 7.2, 0.28), new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.7, metalness: 0.5 }), positions.length);
    var arm = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.18, 0.18), new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.7, metalness: 0.5 }), positions.length);
    positions.forEach(function (p, i) {
      var inward = p[0] < 0 ? 1 : -1;
      dummy.position.set(p[0], 3.6, p[1]); dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1); dummy.updateMatrix(); post.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p[0] + inward * 1.1, 7.0, p[1]); dummy.updateMatrix(); arm.setMatrixAt(i, dummy.matrix);
      lampPos.push(p[0] + inward * 2.0, 6.9, p[1]);
    });
    scene.add(post); scene.add(arm);
    // lamp glows
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lampPos), 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffc06a, size: 3.4, map: glowTex("#ffcf8a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95, fog: false })));
  })();

  /* --------------------------------------------------------- SKYLINE */
  (function skyline() {
    var boxes = [], windows = [], groups = 2;
    var far = [ -60, 60 ];
    var count = 90;
    var geo = new THREE.BoxGeometry(1, 1, 1);
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x0a0d16, roughness: 0.9, metalness: 0.2 }), count * 2);
    var idx = 0, winPts = [];
    for (var s = 0; s < 2; s++) {
      var side = far[s];
      for (var i = 0; i < count; i++) {
        var w = 6 + Math.random() * 10;
        var h = 8 + Math.random() * 46;
        var d = 6 + Math.random() * 10;
        var x = side + (Math.random() - 0.5) * 70;
        var z = START_Z - Math.random() * ROAD_LEN;
        dummy.position.set(x, h / 2, z); dummy.rotation.set(0,0,0); dummy.scale.set(w, h, d); dummy.updateMatrix();
        mesh.setMatrixAt(idx++, dummy.matrix);
        // a few window specks
        for (var wI = 0; wI < 6; wI++) {
          winPts.push(x + (Math.random()-0.5)*w*0.8, Math.random()*h, z + (Math.random()-0.5)*d);
        }
      }
    }
    mesh.count = idx; scene.add(mesh);
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(winPts), 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb0d8, size: 1.1, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, map: glowTex("#c7d2ee"), blending: THREE.AdditiveBlending, fog: false })));
  })();

  /* ------------------------------------------------- DISTANT MOUNTAINS */
  (function mountains() {
    var mat = new THREE.MeshStandardMaterial({ color: 0x090c15, roughness: 1, flatShading: true });
    for (var i = 0; i < 6; i++) {
      var m = new THREE.Mesh(new THREE.ConeGeometry(40 + Math.random()*30, 40 + Math.random()*35, 5), mat);
      m.position.set((Math.random()-0.5)*260, 0, roadCenter - ROAD_LEN*0.2 + (Math.random()-0.5)*300);
      m.rotation.y = Math.random()*Math.PI; scene.add(m);
    }
  })();

  /* ------------------------------------------------- VEHICLE STREAKS */
  var streaks = [];
  function buildStreaks(color, count, lanes, dir, speedBase, opacity) {
    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    var mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.16, 3.4), mat, count);
    var data = [];
    for (var i = 0; i < count; i++) {
      data.push({ x: lanes[i % lanes.length] + (Math.random()-0.5)*0.6, z: START_Z - Math.random()*ROAD_LEN, s: speedBase + Math.random()*18 });
    }
    scene.add(mesh);
    streaks.push({ mesh: mesh, data: data, dir: dir });
    // glow points at same spots
    return mesh;
  }
  buildStreaks(0xff3b30, 22, [3.0, 6.4], -1, 24, 0.9);   // taillights, same direction (away)
  buildStreaks(0xbfe0ff, 22, [-3.0, -6.4], 1, 42, 0.9);  // headlights, oncoming (toward)

  /* -------------------------------------------------------- THE TRUCK */
  var truck = new THREE.Group();
  (function buildTruck() {
    var red = new THREE.MeshStandardMaterial({ color: 0xd8241d, metalness: 0.55, roughness: 0.32 });
    var silver = new THREE.MeshStandardMaterial({ color: 0xc7ccd6, metalness: 0.65, roughness: 0.38 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x0c0e14, metalness: 0.4, roughness: 0.5 });
    var glass = new THREE.MeshStandardMaterial({ color: 0x0a1524, metalness: 0.9, roughness: 0.1 });
    var tire = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.85 });

    // trailer
    var trailer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 9), silver);
    trailer.position.set(0, 2.65, 3.2); truck.add(trailer);
    // trailer underride
    var skirt = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 8.4), dark); skirt.position.set(0, 1.0, 3.2); truck.add(skirt);
    // cab
    var cab = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.5, 2.6), red); cab.position.set(0, 2.35, -2.6); truck.add(cab);
    // hood
    var hood = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 1.7), red); hood.position.set(0, 1.65, -4.1); truck.add(hood);
    // windshield
    var wind = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.1, 0.2), glass); wind.position.set(0, 2.85, -3.35); truck.add(wind);
    // grille
    var grille = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 0.15), dark); grille.position.set(0, 1.5, -4.98); truck.add(grille);
    // chassis
    var chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 11), dark); chassis.position.set(0, 0.85, 1.2); truck.add(chassis);
    // wheels
    var wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
    var wheels = [];
    var zs = [-4.0, -2.4, 1.4, 2.9, 4.4, 5.9];
    zs.forEach(function (z) {
      [-1.35, 1.35].forEach(function (x) {
        var w = new THREE.Mesh(wheelGeo, tire); w.rotation.z = Math.PI/2; w.position.set(x, 0.7, z); truck.add(w); wheels.push(w);
      });
    });
    truck.userData.wheels = wheels;

    // headlights (emissive + point lights + glow)
    [-0.85, 0.85].forEach(function (x) {
      var hl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), emissiveMat(0xfff2cf, 2.2)); hl.position.set(x, 1.4, -5.02); truck.add(hl);
      var pl = new THREE.PointLight(0xffe6b0, 1.1, 40, 2); pl.position.set(x, 1.4, -6); truck.add(pl);
      truck.add(glowSprite("#fff0c8", 1.6, x, 1.4, -5.2));
    });
    // taillights
    [-1.0, 1.0].forEach(function (x) {
      var tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.1), emissiveMat(0xff2a20, 2.4)); tl.position.set(x, 2.0, 7.75); truck.add(tl);
      truck.add(glowSprite("#ff3b30", 1.3, x, 2.0, 7.9));
    });
    // marker lights on trailer top
    [-1.0, 0, 1.0].forEach(function (x) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), emissiveMat(0xffcf87, 2)); m.position.set(x, 4.2, -1.3); truck.add(m);
    });
  })();
  scene.add(truck);

  /* ----------------------------------------------- CAMERA KEYFRAMES */
  var KEY = [
    { p:0.00, cx:0.0,  cy:2.6, cz:0,  lx:0.0, ly:2.0, lz:-24 },
    { p:0.15, cx:-1.0, cy:3.0, cz:0,  lx:0.0, ly:2.2, lz:-30 },
    { p:0.35, cx:-7.4, cy:3.2, cz:2,  lx:0.0, ly:2.2, lz:-34 },
    { p:0.50, cx:-2.0, cy:16.0,cz:6,  lx:0.0, ly:1.0, lz:-55 },
    { p:0.57, cx:0.0,  cy:42.0,cz:12, lx:0.0, ly:0.0, lz:-85 },
    { p:0.66, cx:6.6,  cy:7.0, cz:5,  lx:0.0, ly:2.2, lz:-34 },
    { p:0.74, cx:8.6,  cy:3.2, cz:2,  lx:0.0, ly:2.2, lz:-34 },
    { p:0.87, cx:3.0,  cy:2.9, cz:0,  lx:0.0, ly:2.0, lz:-32 },
    { p:1.00, cx:0.0,  cy:2.6, cz:0,  lx:0.0, ly:1.6, lz:-46 }
  ];
  function sampleKey(p) {
    if (p <= KEY[0].p) return KEY[0];
    if (p >= KEY[KEY.length-1].p) return KEY[KEY.length-1];
    for (var i = 0; i < KEY.length - 1; i++) {
      var a = KEY[i], b = KEY[i+1];
      if (p >= a.p && p <= b.p) {
        var t = (p - a.p) / (b.p - a.p);
        t = t*t*(3 - 2*t); // smoothstep
        return {
          cx: a.cx+(b.cx-a.cx)*t, cy: a.cy+(b.cy-a.cy)*t, cz: a.cz+(b.cz-a.cz)*t,
          lx: a.lx+(b.lx-a.lx)*t, ly: a.ly+(b.ly-a.ly)*t, lz: a.lz+(b.lz-a.lz)*t
        };
      }
    }
    return KEY[0];
  }

  /* ------------------------------------------------------ CHAPTERS */
  var chapters = Array.prototype.map.call(document.querySelectorAll(".chapter"), function (el) {
    return { el: el, start: parseFloat(el.dataset.start), end: parseFloat(el.dataset.end) };
  });
  var progressBar = document.getElementById("progressBar");
  var scrollHint = document.getElementById("scrollHint");

  function updateChapters(p) {
    var FADE = 0.035;
    chapters.forEach(function (c) {
      var op = 0;
      if (p >= c.start - FADE && p <= c.end + FADE) {
        var up = (p - (c.start - FADE)) / FADE;
        var down = ((c.end + FADE) - p) / FADE;
        op = Math.max(0, Math.min(1, Math.min(up, down)));
      }
      c.el.style.opacity = op.toFixed(3);
      c.el.style.transform = "translateY(" + ((1 - op) * 24).toFixed(1) + "px)";
      var active = op > 0.5;
      if (active !== c._active) { c.el.classList.toggle("is-active", active); c._active = active; }
    });
    if (progressBar) progressBar.style.width = (p * 100).toFixed(2) + "%";
    if (scrollHint) scrollHint.style.opacity = p > 0.03 ? "0" : "0.8";
  }

  /* --------------------------------------------------- SCROLL + LOOP */
  function maxScroll() { return Math.max(1, (document.documentElement.scrollHeight - window.innerHeight)); }
  var pCam = 0, pTarget = 0, lookAt = new THREE.Vector3();

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();

  function frame() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    pTarget = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    pCam += (pTarget - pCam) * 0.10;

    var travel = pCam * TRAVEL;
    var baseZ = START_Z - travel;

    // truck follows ahead, with gentle bob + steering weave
    var truckZ = baseZ - TRUCK_AHEAD;
    truck.position.set(Math.sin(t * 0.4) * 0.25, 0.02 + Math.sin(t * 2.2) * 0.02, truckZ);
    truck.rotation.y = Math.sin(t * 0.4) * 0.01;
    if (truck.userData.wheels) truck.userData.wheels.forEach(function (w) { w.rotation.x -= dt * 9; });

    // camera
    var k = sampleKey(pCam);
    var sway = Math.sin(t * 0.5) * 0.12;
    camera.position.set(k.cx + sway, k.cy, baseZ + k.cz);
    lookAt.set(k.lx, k.ly, baseZ + k.lz);
    camera.lookAt(lookAt);

    // streaks (other vehicles' light trails)
    updateStreaks(dt);

    updateChapters(pCam);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function updateStreaks(dt) {
    for (var s = 0; s < streaks.length; s++) {
      var st = streaks[s], d = st.data, mesh = st.mesh;
      for (var i = 0; i < d.length; i++) {
        var o = d[i];
        // taillights (dir -1) drift forward (-z, away); headlights (dir +1) come toward (+z)
        o.z += (st.dir === 1 ? 1 : -1) * o.s * dt;
        if (o.z > START_Z + 10) o.z = START_Z - ROAD_LEN;
        if (o.z < START_Z - ROAD_LEN - 10) o.z = START_Z + 10;
        dummy.position.set(o.x, 1.0, o.z); dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // expose maxScroll for nav "goto" in main.js
  window.MEXWorld = {
    maxScroll: maxScroll,
    goTo: function (p) {
      var y = p * maxScroll();
      if (window.MEXLenis) window.MEXLenis.scrollTo(y, { duration: 1.6 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  requestAnimationFrame(frame);

  /* -------------------------------------------------------- helpers */
  function emissiveMat(color, intensity) {
    return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.5, metalness: 0 });
  }
  var _tex = {};
  function glowTex(hex) {
    if (_tex[hex]) return _tex[hex];
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var x = c.getContext("2d"); var g = x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, hex); g.addColorStop(0.3, hex); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0,0,64,64);
    var tx = new THREE.CanvasTexture(c); _tex[hex] = tx; return tx;
  }
  function glowSprite(hex, scale, x, y, z) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(hex), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95, fog: false }));
    sp.scale.setScalar(scale); sp.position.set(x, y, z); return sp;
  }
})();
