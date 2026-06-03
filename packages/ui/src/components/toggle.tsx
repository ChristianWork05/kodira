'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { easeBrand } from '../motion/easings';

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Toggle({
  checked,
  defaultChecked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: ToggleProps) {
  const reduce = useReducedMotion();
  const [uncontrolled, setUncontrolled] = React.useState<boolean>(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolled;

  const setChecked = (next: boolean) => {
    if (checked === undefined) setUncontrolled(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => setChecked(!isChecked)}
      className={cn(
        [
          'relative inline-flex h-[27px] w-[48px] items-center rounded-full border',
          'transition-[background-color,border-color] duration-200 ease-brand motion-reduce:transition-none',
          isChecked
            ? 'border-transparent'
            : 'border-line-strong/16 bg-surface-2',
          disabled ? 'opacity-60' : 'cursor-pointer',
        ],
        className,
      )}
      style={isChecked ? { backgroundImage: 'var(--gradient-brand)' } : undefined}
      {...props}
    >
      <motion.span
        className="absolute left-[3px] top-[2.5px] h-5 w-5 rounded-full bg-white"
        animate={{
          transform: isChecked ? 'translate3d(20px,0,0)' : 'translate3d(0,0,0)',
        }}
        transition={{ duration: reduce ? 0 : 0.26, ease: easeBrand }}
      />
    </button>
  );
}

