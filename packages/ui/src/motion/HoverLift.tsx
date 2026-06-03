'use client';

import * as React from 'react';
import { motion, type MotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { easeBrand } from './easings';

export type HoverLiftProps = Omit<MotionProps, 'initial' | 'animate'> & {
  className?: string;
  children: React.ReactNode;
  liftPx?: number;
};

export function HoverLift({ className, children, liftPx = 8, transition, ...props }: HoverLiftProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn('will-change-transform', className)}
      initial={false}
      whileHover={reduce ? undefined : { y: -liftPx, scale: 1.01 }}
      whileTap={reduce ? undefined : { y: 1, scale: 0.99 }}
      transition={{
        ...(reduce ? { duration: 0 } : { type: 'spring', duration: 0.42, bounce: 0.18, ease: easeBrand }),
        ...transition,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
