import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Nav from "./components/Nav.jsx";
import YardCanvas from "./components/YardCanvas.jsx";

gsap.registerPlugin(ScrollTrigger);

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function App() {
  const preRef = useRef(null);
  const barRef = useRef(null);
  const pctRef = useRef(null);
  const progRef = useRef(null);
  const hintRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;

    /* ---- Lenis smooth scroll bridged to GSAP ---- */
    let lenis;
    if (!reduce) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;
    }

    /* ---- nav scrolled + progress bar + hint ---- */
    const nav = document.getElementById("nav");
    const onScroll = () => {
      const y = window.scrollY;
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      if (nav) nav.classList.toggle("scrolled", y > 50);
      if (progRef.current) progRef.current.style.width = (limit > 0 ? (y / limit) * 100 : 0) + "%";
      if (hintRef.current) hintRef.current.style.opacity = y > 40 ? "0" : "0.8";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---- anchor smooth scroll ---- */
    const onClick = (e) => {
      const a = e.target.closest("[data-goto]");
      if (!a) return;
      const id = a.getAttribute("data-goto");
      const t = id === "#top" ? 0 : document.querySelector(id);
      if (t === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -60, duration: 1.3 });
      else (t === 0 ? window.scrollTo({ top: 0 }) : t.scrollIntoView({ behavior: "smooth" }));
    };
    document.addEventListener("click", onClick);

    /* ---- custom cursor ---- */
    let cursorRAF;
    if (!isTouch && !reduce) {
      const dot = document.querySelector(".cursor");
      const ring = document.querySelector(".cursor-ring");
      let dx = 0, dy = 0, rx = 0, ry = 0, tx = 0, ty = 0;
      const move = (e) => { tx = e.clientX; ty = e.clientY; };
      window.addEventListener("mousemove", move);
      const loop = () => {
        dx += (tx - dx) * 0.9; dy += (ty - dy) * 0.9;
        rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
        if (dot) dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
        if (ring) ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
        cursorRAF = requestAnimationFrame(loop);
      };
      loop();
      const over = () => ring && ring.classList.add("grow");
      const out = () => ring && ring.classList.remove("grow");
      document.querySelectorAll("[data-cursor], a, button, input, textarea, select").forEach((el) => {
        el.addEventListener("mouseenter", over); el.addEventListener("mouseleave", out);
      });
    }

    /* ---- GSAP reveals + hero build ---- */
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-reveal], .hero h1 .out > span", { opacity: 1, y: 0, yPercent: 0 });
        return;
      }
      // reveals
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.set(el, { opacity: 0, y: 28 });
        ScrollTrigger.create({
          trigger: el, start: "top 85%", once: true,
          onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }),
        });
      });
      // hero headline build (after preloader)
      gsap.set(".hero h1 .out > span", { yPercent: 115 });
      gsap.set(".hero__sub, .hero__cta, .hero__meta", { opacity: 0, y: 20 });
    }, rootRef);

    /* ---- preloader ---- */
    let start = null;
    const DUR = 1300;
    let preRAF;
    const step = (ts) => {
      if (start === null) start = ts;
      const e = ts - start;
      const v = Math.min(100, (e / DUR) * 100);
      if (barRef.current) barRef.current.style.width = v + "%";
      if (pctRef.current) pctRef.current.textContent = Math.round(v) + "%";
      if (v < 100) { preRAF = requestAnimationFrame(step); }
      else {
        if (preRef.current) preRef.current.classList.add("done");
        if (!reduce) {
          gsap.to(".hero h1 .out > span", { yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.08, delay: 0.05 });
          gsap.to(".hero__sub, .hero__cta, .hero__meta", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.25 });
        }
      }
    };
    preRAF = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(cursorRAF);
      cancelAnimationFrame(preRAF);
      ctx.revert();
      if (lenis) { gsap.ticker.remove((t) => lenis.raf(t * 1000)); lenis.destroy(); }
      ScrollTrigger.getAll().forEach((s) => s.kill());
    };
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const name = (f.name.value || "").trim();
    const email = (f.email.value || "").trim();
    const note = document.getElementById("formNote");
    if (!name || !email) { if (note) { note.textContent = "Please add your name and email first."; note.style.color = "var(--acc)"; } return; }
    const subject = encodeURIComponent(`[${f.type.value}] Request from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nType: ${f.type.value}\nLane: ${f.lane.value || ""}\n\n${f.message.value || ""}`);
    window.location.href = `mailto:driversnonstop@gmail.com?subject=${subject}&body=${body}`;
    if (note) { note.textContent = "Opening your email app…"; note.style.color = "var(--ink-dim)"; }
  };

  return (
    <div ref={rootRef} id="top">
      {/* cursor + fx */}
      <div className="cursor" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="progress" ref={progRef} aria-hidden="true" />

      {/* preloader */}
      <div className="preloader" ref={preRef} aria-hidden="true">
        <div>
          <div className="preloader__mark">MERICA <b>EXPRESS</b></div>
          <div className="preloader__bar"><span ref={barRef} /></div>
          <div className="preloader__pct"><em>MAPPING THE NETWORK</em><em ref={pctRef}>0%</em></div>
        </div>
      </div>

      {/* 3D wireframe yard */}
      <YardCanvas />
      <div className="yard__scrim" aria-hidden="true" />

      <Nav />

      {/* HERO */}
      <header className="hero wrap" id="hero">
        <div className="hero__inner">
          <span className="mono eyebrow hero__kicker">Nationwide Trucking &amp; Logistics · USA</span>
          <h1>
            <span className="out"><span>MOVING</span></span>
            <span className="out"><span>AMERICA'S</span></span>
            <span className="out"><span className="acc">FREIGHT.</span></span>
          </h1>
          <p className="lead hero__sub">One unified dispatch network moving full truckloads across all 48 states — tracked, compliant, and always on time.</p>
          <div className="hero__cta">
            <a href="#contact" className="btn btn--acc btn--big" data-cursor data-goto="#contact">Get a Quote <Arrow /></a>
            <a href="#drivers" className="btn btn--ghost btn--big" data-cursor data-goto="#drivers">Drive With Us</a>
          </div>
        </div>
        <div className="hero__meta">
          <div><b>12M+</b><span className="mono">Miles / year</span></div>
          <div><b>99%</b><span className="mono">On-time</span></div>
          <div><b>48</b><span className="mono">States</span></div>
        </div>
      </header>

      {/* STATEMENTS — text changes as the camera moves through the yard */}
      <section className="statement wrap">
        <div className="statement__inner">
          <div className="mono eyebrow idx" data-reveal>01 — Dispatch</div>
          <h2 data-reveal>One unified dispatch, running <span className="acc">every load.</span></h2>
          <p className="lead" data-reveal>AI-assisted planning, live ELD tracking and proactive updates — from pickup to proof of delivery, on one platform.</p>
        </div>
      </section>

      <section className="statement right wrap">
        <div className="statement__inner">
          <div className="mono idx" data-reveal>02 — Network</div>
          <h2 data-reveal>Configured to <span className="acc">every lane</span> in your network.</h2>
          <p className="lead" data-reveal style={{ marginLeft: "auto" }}>Dry van, reefer and expedited capacity — matched to the freight, coast to coast.</p>
        </div>
      </section>

      <section className="statement wrap">
        <div className="statement__inner">
          <div className="mono eyebrow idx" data-reveal>03 — Uptime</div>
          <h2 data-reveal>Compliant, tracked, and <span className="acc">always on time.</span></h2>
          <p className="lead" data-reveal>FMCSA authority, cargo &amp; liability insured, and a live dispatch desk that never sleeps.</p>
        </div>
      </section>

      {/* SOLID DECK */}
      <div className="deck">
        {/* SERVICES */}
        <section className="section wrap" id="services">
          <div className="section__head">
            <div>
              <div className="mono eyebrow" data-reveal>What we haul</div>
              <h2 data-reveal style={{ marginTop: "1rem" }}>Four lanes. One standard.</h2>
            </div>
            <div className="mono" data-reveal>Every load handled like our name is on it.</div>
          </div>

          {[
            ["01", "Full Truckload", "Dedicated capacity, straight through — your freight, your trailer, no stops."],
            ["02", "Cross-Country OTR", "Long-haul, over-the-road lanes coast to coast, team-driver options on the clock."],
            ["03", "Refrigerated", "Temperature-controlled dock to dock for food, pharma and sensitive freight."],
            ["04", "Expedited", "Time-critical, guaranteed-window runs with live tracking start to finish."],
          ].map(([no, title, desc]) => (
            <div className="svc" data-reveal data-cursor key={no}>
              <div className="no">{no}</div>
              <div><h3>{title}</h3><p>{desc}</p></div>
              <div className="go"><Arrow /></div>
            </div>
          ))}

          <div className="stats">
            <div className="stat" data-reveal><b>12<span className="s">M+</span></b><span>Miles / year</span></div>
            <div className="stat" data-reveal><b>99<span className="s">%</span></b><span>On-time delivery</span></div>
            <div className="stat" data-reveal><b>48</b><span>States covered</span></div>
            <div className="stat" data-reveal><b>24<span className="s">/7</span></b><span>Live dispatch</span></div>
          </div>
        </section>

        {/* COVERAGE */}
        <section className="section wrap" id="coverage">
          <div className="cover">
            <div>
              <div className="mono eyebrow" data-reveal>Where we run</div>
              <h2 data-reveal style={{ marginTop: "1rem", fontSize: "clamp(1.7rem,3.4vw,2.8rem)" }}>One network. Every lane.</h2>
              <p className="lead" data-reveal>From West Coast ports to Northeast docks — one dispatch that never sleeps.</p>
              <div className="routes" style={{ marginTop: "1.6rem" }}>
                <div className="route" data-reveal><span className="from">LOS ANGELES</span><span className="dots" /><span>NEW YORK</span><span className="eta">41h</span></div>
                <div className="route" data-reveal><span className="from">DALLAS</span><span className="dots" /><span>CHICAGO</span><span className="eta">15h</span></div>
                <div className="route" data-reveal><span className="from">SEATTLE</span><span className="dots" /><span>MIAMI</span><span className="eta">48h</span></div>
                <div className="route" data-reveal><span className="from">ATLANTA</span><span className="dots" /><span>DENVER</span><span className="eta">19h</span></div>
              </div>
            </div>
            <div className="bignum" data-reveal>48<small>STATES · COAST TO COAST · ONE NETWORK</small></div>
          </div>
        </section>

        {/* FLEET */}
        <section className="section wrap" id="fleet">
          <div className="section__head">
            <div>
              <div className="mono eyebrow" data-reveal>The equipment</div>
              <h2 data-reveal style={{ marginTop: "1rem" }}>Ready before the load is.</h2>
            </div>
            <div className="mono" data-reveal>Late-model · telematics · PM-managed.</div>
          </div>
          <div className="specs">
            <div className="spec" data-reveal><b>500+</b><span>HP · Class 8</span></div>
            <div className="spec" data-reveal><b>53'</b><span>Dry van &amp; reefer</span></div>
            <div className="spec" data-reveal><b>ELD</b><span>Full compliance</span></div>
            <div className="spec" data-reveal><b>GPS</b><span>Real-time tracking</span></div>
          </div>
        </section>

        {/* DRIVERS */}
        <section className="section wrap" id="drivers">
          <div className="drivers-cta">
            <div>
              <div className="mono eyebrow" data-reveal>Careers · Now hiring</div>
              <h2 data-reveal style={{ marginTop: "1rem" }}>DRIVERS <em>NONSTOP.</em></h2>
              <p className="lead" data-reveal style={{ marginTop: "1.2rem" }}>CDL-A drivers who take pride in the road: consistent miles, real home time, and a company that has your back at every stop.</p>
              <div className="hero__cta" data-reveal>
                <a href="#contact" className="btn btn--acc btn--big" data-cursor data-goto="#contact">Apply to Drive <Arrow /></a>
              </div>
            </div>
            <div className="perks">
              <div className="perk" data-reveal><b>Top-tier pay</b><span>Weekly settlements.</span></div>
              <div className="perk" data-reveal><b>Real home time</b><span>Routes around you.</span></div>
              <div className="perk" data-reveal><b>Newer trucks</b><span>Comfortable, maintained.</span></div>
              <div className="perk" data-reveal><b>24/7 support</b><span>Dispatch that answers.</span></div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="section wrap" id="contact">
          <div className="section__head">
            <div>
              <div className="mono eyebrow" data-reveal>Get in touch</div>
              <h2 data-reveal style={{ marginTop: "1rem" }}>Let's move your freight.</h2>
            </div>
          </div>
          <div className="contact">
            <div className="cinfo" data-reveal>
              <div className="line"><span>Email</span><b><a href="mailto:driversnonstop@gmail.com" data-cursor>driversnonstop@gmail.com</a></b></div>
              <div className="line"><span>Dispatch</span><b>(000) 000-0000 <small>Replace with your dispatch line</small></b></div>
              <div className="line"><span>Authority</span><b>MC #000000 · DOT #0000000 <small>Add your MC/DOT numbers</small></b></div>
              <div className="line"><span>HQ</span><b>Your City, State <small>Add your terminal address</small></b></div>
            </div>
            <form className="form" data-reveal onSubmit={onSubmit} noValidate>
              <div className="row">
                <div className="field"><label>Name</label><input type="text" name="name" placeholder="Full name" data-cursor required /></div>
                <div className="field"><label>Email</label><input type="email" name="email" placeholder="you@company.com" data-cursor required /></div>
              </div>
              <div className="row">
                <div className="field"><label>I am a</label>
                  <select name="type" data-cursor>
                    <option>Shipper — I need freight moved</option>
                    <option>Driver — I want to drive</option>
                    <option>Owner-operator</option>
                  </select>
                </div>
                <div className="field"><label>Lane</label><input type="text" name="lane" placeholder="Origin → Destination" data-cursor /></div>
              </div>
              <div className="field"><label>Message</label><textarea name="message" placeholder="Freight, timeline, or CDL experience…" data-cursor /></div>
              <button type="submit" className="btn btn--acc btn--big" data-cursor>Send Request <Arrow /></button>
              <p className="form__note" id="formNote">Opens your email app pre-filled — no data leaves your device.</p>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer__top">
            <div>
              <div className="footer__brand">MERICA <b>EXPRESS</b></div>
              <p className="lead" style={{ marginTop: "1rem", maxWidth: "34ch" }}>Moving America's freight. Coast to coast, on time, every time.</p>
            </div>
            <div className="footer__cols">
              <div className="footer__col"><h5>Company</h5><a href="#services" data-cursor data-goto="#services">Services</a><a href="#fleet" data-cursor data-goto="#fleet">Fleet</a><a href="#coverage" data-cursor data-goto="#coverage">Coverage</a></div>
              <div className="footer__col"><h5>Work</h5><a href="#drivers" data-cursor data-goto="#drivers">Drive With Us</a><a href="#contact" data-cursor data-goto="#contact">Get a Quote</a></div>
              <div className="footer__col"><h5>Contact</h5><a href="mailto:driversnonstop@gmail.com" data-cursor>Email us</a></div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© {new Date().getFullYear()} Merica Express Inc. · Moving America's Freight.</span>
            <span>Nationwide Trucking &amp; Logistics · USA</span>
          </div>
        </footer>
      </div>

      <div className="hint" ref={hintRef}><span>SCROLL</span><span className="rail" /></div>
    </div>
  );
}
