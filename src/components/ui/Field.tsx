import { AlertCircle } from 'lucide-react';
import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useId,
} from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-lg border bg-night-raised/60 px-3.5 py-2.5 text-sm text-frost placeholder:text-frost-dim/70 ' +
  'transition-colors focus:border-azure/60 focus:bg-night-raised focus:outline-none focus:ring-2 focus:ring-azure/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/** Label, hint and error wrapper shared by every control below. */
export function FieldShell({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-frost-muted">
          {label}
          {required && <span className="ml-0.5 text-azure">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="text-xs leading-relaxed text-frost-dim">{hint}</p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, leading, className, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-frost-dim">
            {leading}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            control,
            leading && 'pl-9',
            error ? 'border-danger/60' : 'border-white/10',
            className,
          )}
          {...props}
        />
      </div>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, rows = 4, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          control,
          'resize-y leading-relaxed',
          error ? 'border-danger/60' : 'border-white/10',
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, options, placeholder, className, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <select
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={cn(
          control,
          'appearance-none bg-[length:14px] bg-[right:0.9rem_center] bg-no-repeat pr-9',
          error ? 'border-danger/60' : 'border-white/10',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239DB4C9' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-night-raised">
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, hint, disabled }: ToggleProps) {
  return (
    <div
      role="group"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'group flex cursor-pointer items-start gap-3 select-none',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-azure/40 focus:ring-offset-2 focus:ring-offset-night',
          checked ? 'bg-azure' : 'bg-white/15',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      {(label || hint) && (
        <span className="min-w-0 flex-1">
          {label && (
            <span className="block text-sm text-frost transition-colors group-hover:text-white break-words">
              {label}
            </span>
          )}
          {hint && (
            <span className="mt-0.5 block text-xs leading-relaxed text-frost-dim break-words">
              {hint}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

