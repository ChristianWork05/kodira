'use client';

import * as React from 'react';
import { motion, type MotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { easeBrand } from './easings';

export type RevealProps = Omit<MotionProps, 'initial' | 'animate' | 'whileInView' | 'viewport'> & {
  className?: string;
  children: React.ReactNode;
  amount?: number;
  once?: boolean;
  stagger?: number;
};

export function Reveal({
  className,
  children,
  amount = 0.25,
  once = true,
  stagger = 0.095,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : 0.05,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export type RevealItemProps = Omit<MotionProps, 'variants' | 'transition'> & {
  className?: string;
  children: React.ReactNode;
};

export function RevealItem({ className, children, ...props }: RevealItemProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, transform: 'translate3d(0,26px,0) scale(0.96)' },
        show: { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' },
      }}
      transition={{
        ...(reduce
          ? { duration: 0 }
          : { type: 'spring', duration: 0.48, bounce: 0.26, ease: easeBrand }),
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
