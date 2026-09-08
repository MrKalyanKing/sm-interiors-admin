import { X } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';
import { FieldShell } from './Field';

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  max?: number;
}

/** Short bullet points — the "L / U / parallel" chips under a service. */
export function TagsInput({
  value,
  onChange,
  label,
  hint,
  error,
  placeholder = 'Type and press Enter',
  max = 8,
}: TagsInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const text = draft.trim();
    // Silently ignore duplicates rather than showing an error for a non-problem.
    if (!text || value.includes(text) || value.length >= max) {
      setDraft('');
      return;
    }
    onChange([...value, text]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <FieldShell
      label={label}
      hint={hint ?? `Up to ${max}. Press Enter after each one.`}
      error={error}
    >
      <div className="flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-night-raised/60 px-2.5 py-2 focus-within:border-azure/60 focus-within:ring-2 focus-within:ring-azure/25">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-azure/12 py-1 pl-2 pr-1 text-xs text-azure-light ring-1 ring-azure/25"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="rounded p-0.5 hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {value.length < max && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            // Committing on blur stops a typed-but-unsubmitted point vanishing
            // when someone tabs straight to Save.
            onBlur={commit}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-frost placeholder:text-frost-dim/70 focus:outline-none"
          />
        )}
      </div>
    </FieldShell>
  );
}
