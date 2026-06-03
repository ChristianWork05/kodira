'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';

export type AnimatedNumberProps = {
  value: number;
  suffix?: string;
  className?: string;
  durationMs?: number;
};

export function AnimatedNumber({ value, suffix, className, durationMs = 1100 }: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduce) {
      el.textContent = `${value}${suffix ?? ''}`;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (startedRef.current) return;
        startedRef.current = true;

        const start = performance.now();
        const endValue = value;
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        let raf = 0;

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = easeOut(t);
          const next = Math.round(eased * endValue);
          el.textContent = `${next}${suffix ?? ''}`;
          if (t < 1) raf = window.requestAnimationFrame(tick);
        };

        raf = window.requestAnimationFrame(tick);

        observer.disconnect();
        return () => window.cancelAnimationFrame(raf);
      },
      { threshold: 0.65 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [durationMs, reduce, suffix, value]);

  return (
    <span ref={ref} className={className}>
      0{suffix ?? ''}
    </span>
  );
}

