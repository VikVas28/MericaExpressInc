import { useEffect, useRef } from "react";
import { createYard } from "../three/createYard.js";

export default function YardCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const yard = createYard(ref.current);
    return () => { if (yard && yard.dispose) yard.dispose(); };
  }, []);

  return (
    <div className="yard" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
