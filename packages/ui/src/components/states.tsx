'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line/10 bg-surface px-6 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[13px] border border-line-strong/14 bg-white/5 text-fg-muted">
          {icon}
        </div>
      ) : null}
      <div className="font-display text-[18px] leading-[1.15] text-fg">{title}</div>
      {description ? <div className="mt-2 text-sm leading-6 text-fg-muted">{description}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-danger/25 bg-surface px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        className,
      )}
    >
      <div className="font-display text-[18px] leading-[1.15] text-fg">{title}</div>
      {description ? <div className="mt-2 text-sm leading-6 text-fg-muted">{description}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState({
  label,
  children,
  className,
}: {
  label?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-line/10 bg-surface p-6', className)}>
      {children}
      {label ? <div className="mt-4 text-sm text-fg-muted">{label}</div> : null}
    </div>
  );
}

