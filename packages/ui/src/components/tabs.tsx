'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { easeBrand } from '../motion/easings';

export interface TabsItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, defaultValue, onValueChange, className }: TabsProps) {
  const reduce = useReducedMotion();
  const [uncontrolled, setUncontrolled] = React.useState<string>(defaultValue ?? items[0]?.value ?? '');
  const active = value ?? uncontrolled;

  const setActive = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <div
      className={cn(
        'relative flex flex-wrap gap-1 rounded-[13px] border border-line/10 bg-bg-2 p-1',
        className,
      )}
    >
      {items.map((it) => {
        const isActive = it.value === active;
        return (
          <button
            key={it.value}
            type="button"
            className={cn(
              'relative z-10 basis-[140px] flex-1 rounded-[10px] px-3 py-2 text-[13.5px] font-semibold',
              'transition-colors duration-200 ease-brand motion-reduce:transition-none',
              isActive ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
            onClick={() => setActive(it.value)}
          >
            {isActive ? (
              <motion.span
                layoutId="kodira-tabs-indicator"
                className="absolute inset-0 -z-10 rounded-[10px] border border-line-strong/14 bg-white/6"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: 'spring', duration: 0.42, bounce: 0.22, ease: easeBrand }
                }
              />
            ) : null}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
