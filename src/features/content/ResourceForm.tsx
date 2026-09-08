import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field';
import { IconPicker } from '@/components/ui/IconPicker';
import { TagsInput } from '@/components/ui/TagsInput';
import { MediaPicker } from '@/features/media/MediaPicker';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { ProjectCategory } from '@/types';
import type { FieldConfig } from './types';

export type FormValues = Record<string, unknown>;

interface ResourceFormProps {
  fields: FieldConfig[];
  values: FormValues;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
  /** Folder new uploads from image fields are filed under. */
  mediaFolder?: string;
}

/**
 * Renders a form from a field spec. Every content section in this panel is a
 * list of typed fields, so declaring them beats writing eight near-identical
 * forms that then drift apart.
 */
export function ResourceForm({
  fields,
  values,
  errors,
  onChange,
  mediaFolder,
}: ResourceFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={cn(field.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
          <FieldRenderer
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => onChange(field.name, value)}
            mediaFolder={mediaFolder}
          />
        </div>
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  mediaFolder?: string;
}

function FieldRenderer({ field, value, error, onChange, mediaFolder }: FieldRendererProps) {
  const asyncOptions = useAsyncOptions(field.optionsKey);
  const options = field.optionsKey ? asyncOptions : (field.options ?? []);

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          label={field.label}
          hint={field.hint}
          error={error}
          required={field.required}
          rows={field.rows ?? 4}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <Input
          label={field.label}
          hint={field.hint}
          error={error}
          required={field.required}
          type="number"
          min={field.min}
          max={field.max}
          step="any"
          placeholder={field.placeholder}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => {
            // An empty box means "not set", not zero.
            const raw = e.target.value;
            onChange(raw === '' ? undefined : Number(raw));
          }}
        />
      );

    case 'select':
      return (
        <Select
          label={field.label}
          hint={field.hint}
          error={error}
          required={field.required}
          options={options}
          placeholder={field.placeholder ?? 'Choose one'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );

    case 'tags':
      return (
        <TagsInput
          label={field.label}
          hint={field.hint}
          error={error}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case 'icon':
      return (
        <IconPicker
          label={field.label}
          hint={field.hint}
          error={error}
          value={(value as string) ?? ''}
          onChange={onChange}
        />
      );

    case 'image':
      return (
        <MediaPicker
          label={field.label}
          hint={field.hint}
          folder={mediaFolder}
          value={(value as string) ?? null}
          onChange={(assetId) => onChange(assetId ?? undefined)}
        />
      );

    case 'toggle':
      return (
        <div className="pt-1">
          <Toggle
            label={field.label}
            hint={field.hint}
            checked={Boolean(value)}
            onChange={onChange}
          />
        </div>
      );

    case 'date':
      return (
        <Input
          label={field.label}
          hint={field.hint}
          error={error}
          type="date"
          value={(value as string)?.slice(0, 10) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );

    case 'text':
    default:
      return (
        <Input
          label={field.label}
          hint={field.hint}
          error={error}
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** Options that come from another collection, e.g. the project categories. */
function useAsyncOptions(key: FieldConfig['optionsKey']) {
  const { data } = useQuery({
    queryKey: ['project-categories', 'options'],
    enabled: key === 'project-categories',
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await api.get<ProjectCategory[]>('/project-categories');
      return data;
    },
  });

  if (key !== 'project-categories') return [];
  return (data ?? []).map((category) => ({ value: category.id, label: category.name }));
}

/** Seeds the form state from an existing row, or from the field defaults. */
export function buildInitialValues(
  fields: FieldConfig[],
  row?: Record<string, unknown> | null,
): FormValues {
  const values: FormValues = {};

  for (const field of fields) {
    if (row && row[field.name] !== undefined && row[field.name] !== null) {
      values[field.name] = row[field.name];
      continue;
    }
    values[field.name] =
      field.defaultValue ??
      (field.type === 'tags' ? [] : field.type === 'toggle' ? false : undefined);
  }

  return values;
}

/** Client-side required check, so an obvious miss never costs a round trip. */
export function validateValues(
  fields: FieldConfig[],
  values: FormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.name];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    if (empty) errors[field.name] = `${field.label} is required.`;
  }

  return errors;
}

/** Small hook so the modal can reset its state whenever the row changes. */
export function useFormState(fields: FieldConfig[], row?: Record<string, unknown> | null) {
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(fields, row));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(buildInitialValues(fields, row));
    setErrors({});
  }, [fields, row]);

  const setField = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  return { values, errors, setErrors, setField };
}
