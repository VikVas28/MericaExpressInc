import { useEffect, useRef } from "react";
import { createJourney } from "../three/createJourney.js";

export default function YardCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const j = createJourney(ref.current);
    return () => { if (j && j.dispose) j.dispose(); };
  }, []);

  return (
    <div className="yard" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
