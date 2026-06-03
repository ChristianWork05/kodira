'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../utils/cn';

const cardVariants = cva(
  [
    'relative isolate overflow-hidden',
    'transition-transform duration-300 ease-brand will-change-transform motion-reduce:transition-none',
  ],
  {
  variants: {
    variant: {
      solid: [
        'rounded-lg border border-line/10 bg-surface',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        'hover:-translate-y-1 hover:scale-[1.01]',
        'after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-400 after:ease-brand',
        'after:[background:radial-gradient(520px_240px_at_50%_-10%,rgba(99,102,241,0.18),transparent_70%)] group-hover:after:opacity-100',
      ].join(' '),
      gradient: [
        'rounded-lg p-px',
        'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:[background:var(--gradient-brand)]',
        'hover:-translate-y-1 hover:scale-[1.01]',
        'after:pointer-events-none after:absolute after:inset-[-8px] after:-z-20 after:rounded-[inherit] after:opacity-0 after:blur-[26px] after:transition-opacity after:duration-400 after:ease-brand',
        'after:[background:radial-gradient(60%_60%_at_50%_20%,rgba(99,102,241,0.28),transparent_72%)] group-hover:after:opacity-100',
      ].join(' '),
      glass: [
        'rounded-lg border border-line-strong/14 bg-white/4 backdrop-blur',
        'shadow-glass',
        'hover:-translate-y-1 hover:scale-[1.01]',
        'after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:h-full after:w-1/2 after:-z-10 after:skew-x-[-18deg]',
        'after:opacity-0 after:transition-[transform,opacity] after:duration-700 after:ease-brand',
        'after:[background:linear-gradient(110deg,transparent,rgba(255,255,255,0.12),transparent)]',
        'after:[transform:translate3d(-160%,0,0)] hover:after:opacity-70 hover:after:[transform:translate3d(260%,0,0)]',
      ].join(' '),
      tilt: [
        'rounded-lg border border-line/10 bg-surface',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        'after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-400 after:ease-brand',
        'after:[background:radial-gradient(520px_240px_at_50%_-10%,rgba(99,102,241,0.18),transparent_70%)] group-hover:after:opacity-100',
      ].join(' '),
    },
    padding: {
      none: '',
      md: 'p-6',
      lg: 'p-7',
    },
  },
  defaultVariants: {
    variant: 'solid',
    padding: 'md',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, children, ...props }: CardProps) {
  if (variant !== 'gradient') {
    return (
      <CardTiltWrapper enabled={variant === 'tilt'} className={cn(cardVariants({ variant, padding }), className)} {...props}>
        {children}
      </CardTiltWrapper>
    );
  }

  return (
    <div className={cn('group', cardVariants({ variant, padding: 'none' }), className)} {...props}>
      <div className="relative rounded-[calc(var(--radius-lg)-1px)] bg-surface p-7">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-400 ease-brand [background:radial-gradient(420px_220px_at_50%_-20%,rgba(99,102,241,0.3),transparent_72%)] group-hover:opacity-100" />
        {children}
      </div>
    </div>
  );
}

function CardTiltWrapper({
  enabled,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { enabled: boolean }) {
  const reduce = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const lift = useMotionValue(0);

  const springX = useSpring(rotateX, { stiffness: 220, damping: 22, mass: 0.6 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 22, mass: 0.6 });
  const springLift = useSpring(lift, { stiffness: 220, damping: 22, mass: 0.6 });
  const transform = useTransform(
    [springX, springY, springLift],
    ([rx, ry, lv]) => `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0,${-lv}px,0)`,
  );

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || reduce || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 12);
    rotateX.set(-py * 12);
    lift.set(9);
  };

  const onPointerLeave = () => {
    if (!enabled || reduce) return;
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  };

  return (
    <motion.div
      className={cn('group', className)}
      style={enabled && !reduce ? { transform } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-display text-[18px] leading-[1.15] text-fg', className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-6 text-fg-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-4', className)} {...props} />;
}
