import { useEffect, useRef } from "react";
import { createNetwork } from "../three/createNetwork.js";

export default function CoverageNet() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const n = createNetwork(ref.current);
    return () => { if (n && n.dispose) n.dispose(); };
  }, []);
  return (
    <div className="net-wrap" data-reveal>
      <canvas ref={ref} />
      <span className="net-label mono">48 STATES · COAST TO COAST · ONE NETWORK</span>
    </div>
  );
}
