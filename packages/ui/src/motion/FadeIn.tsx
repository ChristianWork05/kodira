'use client';

import * as React from 'react';
import { motion, type MotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { easeBrand } from './easings';

export type FadeInProps = Omit<MotionProps, 'initial' | 'animate'> & {
  className?: string;
  children: React.ReactNode;
};

export function FadeIn({ className, children, transition, ...props }: FadeInProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduce ? 0 : 0.24,
        ease: easeBrand,
        ...transition,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

