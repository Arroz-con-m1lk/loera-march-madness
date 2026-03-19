"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedPot({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;

    if (start === end) return;

    const duration = 700;
    const startTime = performance.now();

    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const next = Math.round(start + (end - start) * progress);
      setDisplayValue(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    previousValue.current = value;

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue}</>;
}