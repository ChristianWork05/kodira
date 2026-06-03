'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { easeBrand } from './easings';

export function PageTransition({ children, routeKey }: { children: React.ReactNode; routeKey: string }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={reduce ? false : { opacity: 0, transform: 'translate3d(0,16px,0) scale(0.985)' }}
        animate={{ opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }}
        exit={reduce ? undefined : { opacity: 0, transform: 'translate3d(0,-10px,0) scale(0.99)' }}
        transition={{ duration: reduce ? 0 : 0.42, ease: easeBrand }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
