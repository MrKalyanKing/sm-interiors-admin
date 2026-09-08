import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentBase } from '@/types';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'tags'
  | 'icon'
  | 'image'
  | 'toggle'
  | 'date';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Half-width on wide screens, so short fields pair up. */
  half?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
  /** Async options, e.g. project categories loaded from the API. */
  optionsKey?: 'project-categories';
  defaultValue?: unknown;
}

export interface ColumnConfig<T> {
  key: string;
  header: string;
  /** Rendered inside the list row. */
  render: (row: T) => ReactNode;
  className?: string;
}

export interface ResourceConfig<T extends ContentBase = ContentBase> {
  /** API path segment, also used as the react-query key. */
  path: string;
  title: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  fields: FieldConfig[];
  /** How each row is summarised in the list. */
  primary: (row: T) => ReactNode;
  secondary?: (row: T) => ReactNode;
  /** Small square preview at the start of the row. */
  thumbnail?: (row: T) => ReactNode;
  /** Drag-to-reorder. Off for collections where order is meaningless. */
  reorderable?: boolean;
  /** Copy shown when the collection is empty. */
  emptyHint?: string;
}
