import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('glass rounded-2xl', className)}>{children}</div>;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold tracking-wide text-frost">{title}</h2>
        {description && <p className="mt-1 text-xs text-frost-dim">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: number | null;
  accent?: 'azure' | 'success' | 'warning' | 'danger';
}

const accents = {
  azure: 'text-azure-light bg-azure/12 ring-azure/25',
  success: 'text-success bg-success/12 ring-success/25',
  warning: 'text-warning bg-warning/12 ring-warning/25',
  danger: 'text-danger bg-danger/12 ring-danger/25',
};

export function StatTile({ label, value, hint, icon, trend, accent = 'azure' }: StatTileProps) {
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition-colors hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker truncate">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-frost sm:text-3xl">{value}</p>
        </div>
        {icon && (
          <span className={cn('rounded-xl p-2.5 ring-1', accents[accent])} aria-hidden>
            {icon}
          </span>
        )}
      </div>

      {(hint || trend !== undefined) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend !== undefined && trend !== null && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 font-medium',
                trend >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
          )}
          {hint && <span className="truncate text-frost-dim">{hint}</span>}
        </div>
      )}
    </div>
  );
}
