import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Big kinetic headline that assembles as you scroll — YOS-style reveal.
   `words` render large; each character eases in on scrub. */
export default function KineticLine({ eyebrow, words = [], sub }) {
  const ref = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = ref.current ? ref.current.querySelectorAll(".kc") : [];
    if (reduce || !chars.length) { gsap.set(chars, { opacity: 1, y: 0 }); return; }
    const ctx = gsap.context(() => {
      gsap.fromTo(chars,
        { opacity: 0, yPercent: 60, filter: "blur(6px)" },
        {
          opacity: 1, yPercent: 0, filter: "blur(0px)", ease: "none", stagger: 0.03,
          scrollTrigger: { trigger: ref.current, start: "top 78%", end: "top 22%", scrub: 0.6 },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section wrap kinetic" ref={ref}>
      {eyebrow && <div className="mono eyebrow" style={{ justifyContent: "center", marginBottom: "1.6rem" }}>{eyebrow}</div>}
      <h2 className="kinetic__line">
        {words.map((w, wi) => (
          <span className="kw" key={wi}>
            {w.split("").map((c, ci) => (<span className="kc" key={ci}>{c}</span>))}
            {wi < words.length - 1 ? <span className="kc">&nbsp;</span> : null}
          </span>
        ))}
      </h2>
      {sub && <p className="lead kinetic__sub">{sub}</p>}
    </section>
  );
}
