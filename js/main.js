/* =========================================================================
   MERICA EXPRESS — interaction & motion
   Lenis smooth scroll · GSAP ScrollTrigger · custom cursor · counters
   Progressive: without JS/libs the page is fully readable (no opacity traps
   in CSS — from-states are only applied here when GSAP is present).
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";
  var hasST = hasGSAP && typeof ScrollTrigger !== "undefined";
  var hasLenis = typeof Lenis !== "undefined";
  var isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    var yEl = document.getElementById("year");
    if (yEl) yEl.textContent = new Date().getFullYear();

    setupForm();

    if (hasST) gsap.registerPlugin(ScrollTrigger);

    // If motion is off or libs missing: reveal everything, run preloader-lite.
    if (reduce || !hasGSAP) {
      finishPreloader(true);
      revealAllStatic();
      setupNavScrollFallback();
      return;
    }

    var lenis = setupLenis();
    setupCursor();
    setupNav(lenis);
    setupMarquee();
    setupReveals();
    setupParallax();
    setupCounters();
    setupMagnetic();
    runPreloaderThenHero();
  }

  /* ------------------------------------------------------------- Lenis */
  function setupLenis() {
    if (!hasLenis || reduce) return null;
    var lenis = new Lenis({ duration: 1.1, smoothWheel: true, lerp: 0.09 });
    if (hasST) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    // anchor links -> lenis smooth
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -10, duration: 1.2 });
      });
    });
    return lenis;
  }

  /* ---------------------------------------------------------- Preloader */
  function runPreloaderThenHero() {
    var pre = document.getElementById("preloader");
    var bar = document.getElementById("preBar");
    var pct = document.getElementById("prePct");
    var curtain = document.getElementById("curtain");
    var obj = { v: 0 };

    // set hero from-states now (so nothing flashes)
    var lines = document.querySelectorAll("[data-hero-line]");
    gsap.set(lines, { yPercent: 115 });
    gsap.set("[data-reveal]", { opacity: 0, y: 26 });

    var tl = gsap.timeline();
    tl.to(obj, {
      v: 100, duration: 1.5, ease: "power2.inOut",
      onUpdate: function () {
        var n = Math.round(obj.v);
        if (bar) bar.style.width = n + "%";
        if (pct) pct.textContent = n + "%";
      }
    });
    tl.to(pre, { opacity: 0, duration: 0.4, onComplete: function () { if (pre) pre.style.display = "none"; } }, "+=0.1");
    if (curtain) {
      tl.fromTo(curtain, { yPercent: 0 }, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "<");
    }
    // hero build
    tl.to(lines, { yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.09 }, "-=0.4");
    tl.to("#hero [data-reveal]", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.7");
  }

  function finishPreloader(instant) {
    var pre = document.getElementById("preloader");
    var curtain = document.getElementById("curtain");
    if (pre) { pre.style.display = "none"; }
    if (curtain) { curtain.style.display = "none"; }
  }

  /* ------------------------------------------------------------ Reveals */
  function setupReveals() {
    // Everything except the hero (hero handled by preloader timeline)
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"))
      .filter(function (el) { return !el.closest("#hero"); });
    els.forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 26 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" });
        }
      });
    });
  }

  function revealAllStatic() {
    document.querySelectorAll("[data-reveal],[data-hero-line]").forEach(function (el) {
      el.style.opacity = 1; el.style.transform = "none";
    });
  }

  /* ----------------------------------------------------------- Parallax */
  function setupParallax() {
    if (!hasST) return;
    var hero = document.getElementById("heroMedia");
    if (hero) {
      gsap.to(hero, {
        yPercent: 16, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    document.querySelectorAll(".about__media img, #fleetImg").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: "none",
        scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ----------------------------------------------------------- Counters */
  function setupCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var numSpan = el.querySelector("span");
      if (!numSpan) return;
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          gsap.to(o, {
            v: target, duration: 1.8, ease: "power2.out",
            onUpdate: function () { numSpan.textContent = Math.round(o.v); }
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------ Marquee */
  function setupMarquee() {
    var track = document.getElementById("marquee");
    if (!track || reduce) return;
    gsap.to(track, { xPercent: -50, repeat: -1, duration: 24, ease: "none" });
  }

  /* --------------------------------------------------------------- Nav */
  function setupNav(lenis) {
    var nav = document.getElementById("nav");
    if (!nav) return;
    function update(y) { nav.classList.toggle("scrolled", y > 60); }
    if (lenis) lenis.on("scroll", function (e) { update(e.scroll); });
    window.addEventListener("scroll", function () { update(window.scrollY); }, { passive: true });
    update(window.scrollY);
  }
  function setupNavScrollFallback() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    window.addEventListener("scroll", function () { nav.classList.toggle("scrolled", window.scrollY > 60); }, { passive: true });
  }

  /* ------------------------------------------------------------ Cursor */
  function setupCursor() {
    if (isTouch || reduce) return;
    var dot = document.querySelector(".cursor");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    var ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
    var ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });
    var dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    var dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });

    window.addEventListener("mousemove", function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll("[data-cursor], a, button, input, textarea, select").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("grow"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("grow"); });
    });
  }

  /* ---------------------------------------------------------- Magnetic */
  function setupMagnetic() {
    if (isTouch || reduce) return;
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
      var type = f.type.value || "";
      var lane = (f.lane.value || "").trim();
      var msg = (f.message.value || "").trim();
      var note = document.getElementById("formNote");

      if (!name || !email) {
        if (note) { note.textContent = "Please add your name and email first."; note.style.color = "var(--red-hot)"; }
        return;
      }
      var subject = encodeURIComponent("[" + type + "] Request from " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\nEmail: " + email + "\nType: " + type +
        "\nLane: " + lane + "\n\n" + msg
      );
      window.location.href = "mailto:driversnonstop@gmail.com?subject=" + subject + "&body=" + body;
      if (note) { note.textContent = "Opening your email app…"; note.style.color = "var(--ink-dim)"; }
    });
  }
})();
