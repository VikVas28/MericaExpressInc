/* =========================================================================
   MERICA EXPRESS — shell interactions
   Lenis smooth scroll · custom cursor · magnetic buttons · nav · preloader
   The 3D world (three-world.js) owns the camera + chapter fades.
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";
  var hasLenis = typeof Lenis !== "undefined";
  var isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;

  run();

  function run() {
    var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
    setupForm();
    setupNav();
    setupGoto();
    if (!isTouch && !reduce) { setupCursor(); setupMagnetic(); }
    if (!reduce) setupLenis();
    runPreloader();
  }

  /* ---------------------------------------------------------- Lenis */
  function setupLenis() {
    if (!hasLenis) return;
    var lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.09 });
    window.MEXLenis = lenis;
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* -------------------------------------------------------- Preloader */
  function runPreloader() {
    var pre = document.getElementById("preloader");
    var bar = document.getElementById("preBar");
    var pct = document.getElementById("prePct");
    if (!pre) return;
    var v = 0, start = null, DUR = 1500;
    function step(ts) {
      if (start === null) start = ts;
      var e = ts - start;
      v = Math.min(100, (e / DUR) * 100);
      if (bar) bar.style.width = v + "%";
      if (pct) pct.textContent = Math.round(v) + "%";
      if (v < 100) { requestAnimationFrame(step); }
      else {
        pre.style.transition = "opacity .5s ease";
        pre.style.opacity = "0";
        setTimeout(function () { pre.style.display = "none"; }, 520);
      }
    }
    requestAnimationFrame(step);
  }

  /* -------------------------------------------------------------- Nav */
  function setupNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    function upd() { nav.classList.toggle("scrolled", window.scrollY > 50); }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  /* ------------------------------------------- Nav "go to" (3D or flow) */
  function setupGoto() {
    document.querySelectorAll("[data-goto]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (document.body.classList.contains("mode-3d") && window.MEXWorld) {
          e.preventDefault();
          window.MEXWorld.goTo(parseFloat(a.dataset.goto));
        } else {
          // fallback stacked mode: smooth-scroll to the referenced section
          var href = a.getAttribute("href");
          if (href && href.charAt(0) === "#") {
            var t = document.querySelector(href);
            if (t) {
              e.preventDefault();
              if (window.MEXLenis) window.MEXLenis.scrollTo(t, { offset: -60 });
              else t.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
      });
    });
  }

  /* ------------------------------------------------------------ Cursor */
  function setupCursor() {
    var dot = document.querySelector(".cursor");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    var rx = 0, ry = 0, dx = 0, dy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      dx += (tx - dx) * 0.9; dy += (ty - dy) * 0.9;
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-cursor], a, button, input, textarea, select").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("grow"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("grow"); });
    });
  }

  /* ---------------------------------------------------------- Magnetic */
  function setupMagnetic() {
    if (!hasGSAP) return; // graceful: buttons simply don't magnetize
    document.querySelectorAll(".btn").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      btn.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* -------------------------------------------------------------- Form */
  function setupForm() {
    var form = document.getElementById("quoteForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var name = (f.name.value || "").trim();
      var email = (f.email.value || "").trim();
      var note = document.getElementById("formNote");
      if (!name || !email) {
        if (note) { note.textContent = "Please add your name and email first."; note.style.color = "var(--red-hot)"; }
        return;
      }
      var subject = encodeURIComponent("[" + (f.type.value || "") + "] Request from " + name);
      var body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\nType: " + (f.type.value||"") + "\nLane: " + (f.lane.value||"") + "\n\n" + (f.message.value||""));
      window.location.href = "mailto:driversnonstop@gmail.com?subject=" + subject + "&body=" + body;
      if (note) { note.textContent = "Opening your email app…"; note.style.color = "var(--ink-dim)"; }
    });
  }
})();
