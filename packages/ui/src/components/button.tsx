'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  [
    'relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md px-4 py-2 text-sm font-semibold',
    'transition-[transform,opacity] duration-200 ease-brand',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:translate-y-px active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100',
  ],
  {
    variants: {
      variant: {
        primary: [
          'text-primary-fg shadow-[0_10px_26px_-10px_rgba(59,130,246,0.55)]',
          'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_22px_60px_-22px_rgba(59,130,246,0.95)]',
          'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:[background:var(--gradient-brand)]',
          'after:absolute after:inset-[-10px] after:-z-20 after:rounded-[inherit] after:opacity-0 after:blur-[22px]',
          'after:[background:radial-gradient(60%_60%_at_50%_20%,rgba(59,130,246,0.65),transparent_70%)]',
          'after:transition-opacity after:duration-300 after:ease-brand hover:after:opacity-100',
        ].join(' '),
        secondary: [
          'border border-line/12 bg-surface-2 text-fg',
          'hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/6 hover:border-line-strong/18',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        ].join(' '),
        glass: [
          'border border-line-strong/20 bg-white/5 text-fg backdrop-blur',
          'shadow-glass',
          'hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/8 hover:border-line-strong/30',
          'after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:opacity-0 after:[background:radial-gradient(240px_140px_at_20%_0%,rgba(99,102,241,0.26),transparent_70%)] after:transition-opacity after:duration-300 after:ease-brand',
          'hover:after:opacity-100',
        ].join(' '),
        ghost: [
          'bg-transparent text-fg-muted',
          'hover:-translate-y-0.5 hover:bg-white/5 hover:text-fg',
        ].join(' '),
        danger: [
          'bg-danger text-danger-fg shadow-[0_10px_30px_-14px_rgba(248,113,113,0.35)]',
          'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_22px_60px_-26px_rgba(248,113,113,0.7)]',
          'after:absolute after:inset-[-10px] after:-z-20 after:rounded-[inherit] after:opacity-0 after:blur-[22px]',
          'after:[background:radial-gradient(60%_60%_at_50%_20%,rgba(248,113,113,0.55),transparent_70%)]',
          'after:transition-opacity after:duration-300 after:ease-brand hover:after:opacity-90',
        ].join(' '),
        destructive: [
          'bg-danger text-danger-fg shadow-[0_10px_30px_-14px_rgba(248,113,113,0.35)]',
          'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_22px_60px_-26px_rgba(248,113,113,0.7)]',
          'after:absolute after:inset-[-10px] after:-z-20 after:rounded-[inherit] after:opacity-0 after:blur-[22px]',
          'after:[background:radial-gradient(60%_60%_at_50%_20%,rgba(248,113,113,0.55),transparent_70%)]',
          'after:transition-opacity after:duration-300 after:ease-brand hover:after:opacity-90',
        ].join(' '),
      },
      size: {
        sm: 'h-9 rounded-[12px] px-3 text-[13px]',
        md: 'h-11 rounded-[13px] px-5 text-[14.5px]',
        lg: 'h-12 rounded-[14px] px-6 text-[15px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  magnetic?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, magnetic, type, onPointerMove, onPointerLeave, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const reduce = useReducedMotion();

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 280, damping: 18, mass: 0.55 });
    const springY = useSpring(y, { stiffness: 280, damping: 18, mass: 0.55 });

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerMove?.(e);
      if (reduce || !magnetic || e.pointerType !== 'mouse') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const dx = e.clientX - rect.left - rect.width / 2;
      const dy = e.clientY - rect.top - rect.height / 2;
      x.set(dx * 0.22);
      y.set(dy * 0.26);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e);
      if (reduce || !magnetic) return;
      x.set(0);
      y.set(0);
    };

    return (
      <Comp
        ref={ref}
        type={type ?? 'button'}
        className={cn(buttonVariants({ variant, size }), className)}
        onPointerMove={asChild ? onPointerMove : handlePointerMove}
        onPointerLeave={asChild ? onPointerLeave : handlePointerLeave}
        {...props}
      >
        {asChild ? (
          props.children
        ) : (
          <motion.span
            className="relative z-10 inline-flex items-center justify-center gap-2"
            style={reduce || !magnetic ? undefined : { x: springX, y: springY }}
          >
            {props.children}
          </motion.span>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
