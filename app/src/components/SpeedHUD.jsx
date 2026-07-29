import { useEffect, useRef } from "react";

/* Truck dashboard speedometer. Scroll = throttle: the needle sweeps and the
   MPH climbs. At full speed the cluster zooms out and the site "opens".
   Driven by window.__mexSpeed (set each frame by createJourney). */

const CX = 200, CY = 200, R = 150, A0 = -135, A1 = 135, MAX = 85;
function polar(r, deg) { const a = (deg * Math.PI) / 180; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; }
function arcPath(r, a0, a1) {
  const [sx, sy] = polar(r, a0), [ex, ey] = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 - a0 > 0 ? 1 : 0;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

export default function SpeedHUD() {
  const root = useRef(null), needle = useRef(null), val = useRef(null), fill = useRef(null), cap = useRef(null), rpm = useRef(null);

  useEffect(() => {
    let raf, done = false;
    const loop = () => {
      const s = window.__mexSpeed || { introP: 0, speed: 0, active: true };
      const p = Math.min(1, Math.max(0, s.introP));
      const ang = A0 + p * (A1 - A0);
      if (needle.current) needle.current.setAttribute("transform", `rotate(${ang.toFixed(2)} ${CX} ${CY})`);
      if (fill.current) fill.current.setAttribute("d", arcPath(R - 14, A0, A0 + Math.max(0.001, p) * (A1 - A0)));
      if (val.current) val.current.textContent = String(s.speed);
      if (rpm.current) rpm.current.style.width = (20 + p * 80) + "%";
      if (cap.current) cap.current.textContent = p > 0.985 ? "IGNITION — WELCOME ABOARD" : "SCROLL TO ACCELERATE";
      if (root.current) {
        const finished = !s.active;
        if (finished !== done) { done = finished; root.current.classList.toggle("done", finished); }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const ticks = [];
  for (let i = 0; i <= 9; i++) {
    const a = A0 + (i / 9) * (A1 - A0);
    const [ix, iy] = polar(R - 20, a), [ox, oy] = polar(R, a), [lx, ly] = polar(R - 38, a);
    ticks.push(
      <g key={i}>
        <line x1={ix} y1={iy} x2={ox} y2={oy} stroke={i >= 7 ? "#ff5a3c" : "#7d8574"} strokeWidth={i % 1 === 0 ? 2.4 : 1} />
        <text x={lx} y={ly + 4} textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="13" fill="#8b9280">{i * 10}</text>
      </g>
    );
  }

  return (
    <div className="speed-hud" ref={root} aria-hidden="true">
      <div className="speed-hud__cluster">
        <svg viewBox="0 0 400 400" width="100%">
          <circle cx={CX} cy={CY} r={R + 14} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <path d={arcPath(R - 14, A0, A1)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" strokeLinecap="round" />
          <path ref={fill} d={arcPath(R - 14, A0, A0)} fill="none" stroke="#b7f24a" strokeWidth="8" strokeLinecap="round" />
          {ticks}
          {/* needle */}
          <g ref={needle} transform={`rotate(${A0} ${CX} ${CY})`}>
            <line x1={CX} y1={CY} x2={CX} y2={CY - (R - 26)} stroke="#ff5a3c" strokeWidth="4" strokeLinecap="round" />
          </g>
          <circle cx={CX} cy={CY} r="10" fill="#0b0d0c" stroke="#ff5a3c" strokeWidth="2" />
          <text x={CX} y={CY + 92} textAnchor="middle" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="70" fill="#f4f6fb"><tspan ref={val}>0</tspan></text>
          <text x={CX} y={CY + 116} textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="14" letterSpacing="4" fill="#8b9280">MPH</text>
          <text x={CX} y={CY - 70} textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="12" letterSpacing="4" fill="#b7f24a">MERICA EXPRESS</text>
        </svg>
        <div className="speed-hud__rpm"><span ref={rpm} /></div>
        <div className="speed-hud__cap mono" ref={cap}>SCROLL TO ACCELERATE</div>
      </div>
    </div>
  );
}
