/* =========================================================================
   MERICA EXPRESS — WebGL layer (Three.js r128, global build)
   1) Hero atmosphere: drifting light particles over the hero image
   2) Coverage globe: dotted Earth with animated freight arcs
   Fully progressive: if WebGL / THREE is unavailable, the page still works.
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof THREE === "undefined") return;

  var DEG = Math.PI / 180;

  /* ------------------------------------------------- lat/lng -> vector3 */
  function latLngToVec3(lat, lng, r) {
    var phi = (90 - lat) * DEG;
    var theta = (lng + 180) * DEG;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ============================================================ HERO FX */
  function initHero() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    var renderer, scene, camera, points, raf, mouseX = 0, mouseY = 0;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    camera.position.z = 400;

    var N = 320;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(N * 3);
    var spd = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 900;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 600;
      spd[i] = 0.2 + Math.random() * 0.8;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    var sprite = makeGlowSprite("#ffd9a0");
    var mat = new THREE.PointsMaterial({
      size: 6, map: sprite, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    points = new THREE.Points(geo, mat);
    scene.add(points);

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    });

    function tick() {
      var p = geo.attributes.position.array;
      for (var i = 0; i < N; i++) {
        p[i * 3 + 1] += spd[i];           // drift up
        if (p[i * 3 + 1] > 300) p[i * 3 + 1] = -300;
      }
      geo.attributes.position.needsUpdate = true;
      camera.position.x += (mouseX * 60 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 40 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    if (reduce) { renderer.render(scene, camera); }
    else { tick(); }
  }

  /* ========================================================= COVERAGE GLOBE */
  function initGlobe() {
    var canvas = document.getElementById("globe-canvas");
    if (!canvas) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 15.5;

    var group = new THREE.Group();
    scene.add(group);
    var R = 5;

    /* ---- dotted sphere ---- */
    var dotCount = 1600;
    var dgeo = new THREE.BufferGeometry();
    var dpos = new Float32Array(dotCount * 3);
    for (var i = 0; i < dotCount; i++) {
      // fibonacci sphere for even distribution
      var y = 1 - (i / (dotCount - 1)) * 2;
      var rad = Math.sqrt(1 - y * y);
      var th = i * 2.399963229728653;
      dpos[i * 3]     = Math.cos(th) * rad * R;
      dpos[i * 3 + 1] = y * R;
      dpos[i * 3 + 2] = Math.sin(th) * rad * R;
    }
    dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    var dsprite = makeGlowSprite("#5b8def");
    var dmat = new THREE.PointsMaterial({
      size: 0.11, map: dsprite, transparent: true, opacity: 0.45,
      depthWrite: false, blending: THREE.AdditiveBlending, color: 0x88a9f2
    });
    group.add(new THREE.Points(dgeo, dmat));

    /* faint inner sphere for volume */
    var glowMat = new THREE.MeshBasicMaterial({ color: 0x0d1830, transparent: true, opacity: 0.55 });
    group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 48, 48), glowMat));

    /* ---- cities ---- */
    var cities = {
      LA:  [34.05, -118.24], NY: [40.71, -74.0], DAL: [32.78, -96.8],
      CHI: [41.88, -87.63], ATL: [33.75, -84.39], MIA: [25.76, -80.19],
      SEA: [47.6, -122.33], DEN: [39.74, -104.99], HOU: [29.76, -95.37],
      PHX: [33.45, -112.07], KC: [39.1, -94.58], MSP: [44.98, -93.27]
    };
    var lanes = [
      ["LA","NY"], ["SEA","MIA"], ["DAL","CHI"], ["ATL","DEN"],
      ["HOU","MSP"], ["PHX","NY"], ["LA","CHI"], ["KC","MIA"], ["SEA","DEN"]
    ];

    // city markers
    var markGeo = new THREE.SphereGeometry(0.06, 12, 12);
    var markMat = new THREE.MeshBasicMaterial({ color: 0xff4b3e });
    Object.keys(cities).forEach(function (k) {
      var v = latLngToVec3(cities[k][0], cities[k][1], R * 1.01);
      var m = new THREE.Mesh(markGeo, markMat);
      m.position.copy(v);
      group.add(m);
    });

    /* ---- arcs + travelling pulses ---- */
    var pulses = [];
    lanes.forEach(function (pair, idx) {
      var a = latLngToVec3(cities[pair[0]][0], cities[pair[0]][1], R * 1.01);
      var b = latLngToVec3(cities[pair[1]][0], cities[pair[1]][1], R * 1.01);
      var dist = a.distanceTo(b);
      var mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1 + dist * 0.16));
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var pts = curve.getPoints(60);
      var lgeo = new THREE.BufferGeometry().setFromPoints(pts);
      var col = idx % 2 === 0 ? 0xff4b3e : 0x86a9f2;
      var lmat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending });
      group.add(new THREE.Line(lgeo, lmat));

      // pulse dot
      var psprite = makeGlowSprite(idx % 2 === 0 ? "#ff6a5e" : "#a9c2ff");
      var pmat = new THREE.SpriteMaterial({ map: psprite, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.95 });
      var sp = new THREE.Sprite(pmat);
      sp.scale.setScalar(0.55);
      group.add(sp);
      pulses.push({ curve: curve, sprite: sp, t: Math.random(), speed: 0.0016 + Math.random() * 0.0022 });
    });

    /* orient so North America faces the camera, slight tilt */
    group.rotation.y = -1.9;
    group.rotation.x = 0.32;

    /* interaction — subtle drag (desktop only, so mobile scroll is never trapped) */
    var targetY = group.rotation.y, curY = group.rotation.y, dragging = false, lastX = 0, autospin = 0.0016;
    var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
    if (canHover) {
      canvas.style.pointerEvents = "auto";
      canvas.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; });
      window.addEventListener("pointerup", function () { dragging = false; });
      window.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        targetY += (e.clientX - lastX) * 0.006; lastX = e.clientX;
      });
    } else {
      canvas.style.pointerEvents = "none";
    }

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      var s = Math.max(1, r.width);
      renderer.setSize(s, s, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    function render() {
      curY += (targetY - curY) * 0.06;
      group.rotation.y = curY;
      renderer.render(scene, camera);
    }

    function tick() {
      if (!dragging) targetY += autospin;
      for (var i = 0; i < pulses.length; i++) {
        var pl = pulses[i];
        pl.t += pl.speed;
        if (pl.t > 1) pl.t -= 1;
        pl.sprite.position.copy(pl.curve.getPoint(pl.t));
      }
      render();
      requestAnimationFrame(tick);
    }

    if (reduce) { render(); }
    else { tick(); }
  }

  /* --------------------------------------------------- glow sprite util */
  var _cache = {};
  function makeGlowSprite(color) {
    if (_cache[color]) return _cache[color];
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, color);
    g.addColorStop(0.25, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    _cache[color] = tex;
    return tex;
  }

  /* ------------------------------------------------------------- boot */
  function boot() {
    try { initHero(); } catch (e) {}
    try { initGlobe(); } catch (e) {}
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
