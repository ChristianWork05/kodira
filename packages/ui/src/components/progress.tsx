'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { easeBrand } from '../motion/easings';

export function Progress({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: number }) {
  const reduce = useReducedMotion();
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-bg-2 border border-line/10', className)}
      {...props}
    >
      <motion.div
        className="h-full w-full origin-left rounded-full"
        style={{ backgroundImage: 'var(--gradient-brand)' }}
        animate={{
          transform: `scaleX(${safe / 100})`,
          opacity: safe === 0 ? 0 : 1,
        }}
        initial={false}
        transition={
          reduce
            ? { duration: 0 }
            : { type: 'spring', duration: 0.5, bounce: 0.2, ease: easeBrand }
        }
      />
    </div>
  );
}
