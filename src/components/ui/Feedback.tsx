import { Loader2, type LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-azure', className)} />;
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-7 w-7" />
      <p className="text-sm text-frost-dim">{label}…</p>
    </div>
  );
}

/** Rows of shimmering placeholders, sized like the table they stand in for. */
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <div
              key={colIndex}
              className="skeleton h-10"
              style={{ width: colIndex === 0 ? '32%' : `${Math.round(68 / (columns - 1))}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-2xl bg-azure/10 p-4 ring-1 ring-azure/20">
          <Icon className="h-7 w-7 text-azure-light" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-frost">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-frost-dim">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-danger/25 bg-danger/[0.07] px-5 py-6 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-medium text-azure-light underline-offset-4 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
