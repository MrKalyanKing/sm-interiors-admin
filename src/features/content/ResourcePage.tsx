import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, Eye, EyeOff, GripVertical, Pencil, Plus, Search, Share2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, PublishBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useDebounced } from '@/hooks/useDebounced';
import { getErrorMessage, getFieldErrors } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { ContentBase } from '@/types';
import { ReviewShareModal } from '@/features/testimonials/ReviewShareModal';
import { ResourceForm, useFormState, validateValues } from './ResourceForm';

import type { ResourceConfig } from './types';
import { useResourceList, useResourceMutations } from './useResource';

interface ResourcePageProps<T extends ContentBase> {
  config: ResourceConfig<T>;
}

export function ResourcePage<T extends ContentBase>({ config }: ResourcePageProps<T>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);

  const { data, isLoading, isError, error, refetch } = useResourceList<T>(
    { path: config.path, singular: config.singular },
    { search: debouncedSearch },
  );
  const mutations = useResourceMutations<T>({ path: config.path, singular: config.singular });

  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Local copy so a drag reorders instantly instead of waiting on the server.
  const [rows, setRows] = useState<T[]>([]);
  useEffect(() => {
    setRows(data?.items ?? []);
  }, [data]);

  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so tapping Edit still works.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canReorder = config.reorderable !== false && !debouncedSearch;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next);
    mutations.reorder.mutate(next.map((row, index) => ({ id: row.id, position: index })));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <div className="flex items-center gap-2">
            {config.path === 'testimonials' && (
              <Button
                variant="secondary"
                onClick={() => setShareModalOpen(true)}
                icon={<Share2 className="h-4 w-4 text-azure-light" />}
              >
                Share Review Link
              </Button>
            )}
            <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" />}>
              Add {config.singular.toLowerCase()}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="border-b border-white/8 p-4">
          <Input
            placeholder={`Search ${config.title.toLowerCase()}`}
            leading={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : isError ? (
          <div className="p-5">
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={config.icon}
            title={debouncedSearch ? 'Nothing matches that search' : `No ${config.title.toLowerCase()} yet`}
            description={
              debouncedSearch
                ? 'Try a different word, or clear the search box.'
                : (config.emptyHint ??
                  `Add your first ${config.singular.toLowerCase()} and it appears on the website straight away.`)
            }
            action={
              !debouncedSearch && (
                <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" />}>
                  Add {config.singular.toLowerCase()}
                </Button>
              )
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
              disabled={!canReorder}
            >
              <ul className="divide-y divide-white/6">
                {rows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    config={config}
                    canReorder={canReorder}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                    onTogglePublish={() =>
                      mutations.togglePublish.mutate({
                        id: row.id,
                        isPublished: !row.isPublished,
                      })
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {canReorder && rows.length > 1 && (
          <p className="border-t border-white/8 px-5 py-3 text-xs text-frost-dim">
            Drag the handle to change the order they appear in on the website.
          </p>
        )}
      </Card>

      <ResourceModal
        config={config}
        open={creating}
        row={null}
        onClose={() => setCreating(false)}
        onSubmit={async (values) => {
          await mutations.create.mutateAsync(values);
          setCreating(false);
        }}
      />

      <ResourceModal
        config={config}
        open={Boolean(editing)}
        row={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          if (!editing) return;
          await mutations.update.mutateAsync({ id: editing.id, values });
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={mutations.remove.isPending}
        title={`Remove this ${config.singular.toLowerCase()}?`}
        message="It disappears from the website immediately. Nothing is permanently erased — ask your developer if you ever need it back."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!deleting) return;
          await mutations.remove.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />

      {config.path === 'testimonials' && (
        <ReviewShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────── row ─────────────────────────────── */

interface SortableRowProps<T extends ContentBase> {
  row: T;
  config: ResourceConfig<T>;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

function SortableRow<T extends ContentBase>({
  row,
  config,
  canReorder,
  onEdit,
  onDelete,
  onTogglePublish,
}: SortableRowProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !canReorder,
  });

  const isCustomerSubmission = (row as Record<string, unknown>).source === 'customer_submission';

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors',
        isDragging ? 'relative z-10 bg-night-raised shadow-glass-lg' : 'hover:bg-white/[0.03]',
        !row.isPublished && 'opacity-75',
      )}
    >
      {canReorder && (
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded p-1 text-frost-dim transition-colors hover:text-frost active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {config.thumbnail && <div className="shrink-0">{config.thumbnail(row)}</div>}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-frost">{config.primary(row)}</span>
          <PublishBadge published={row.isPublished} />
          {isCustomerSubmission && (
            !row.isPublished ? (
              <Badge tone="warning">Pending Review</Badge>
            ) : (
              <Badge tone="azure">Customer Review</Badge>
            )
          )}
        </div>
        {config.secondary && (
          <div className="mt-0.5 truncate text-xs text-frost-dim">{config.secondary(row)}</div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {isCustomerSubmission && !row.isPublished && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onTogglePublish}
            title="Approve and show on website"
            className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 mr-1"
            icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
          >
            Approve
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePublish}
          title={row.isPublished ? 'Hide from the website' : 'Show on the website'}
          aria-label={row.isPublished ? 'Hide from the website' : 'Show on the website'}
        >
          {row.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} title="Edit" aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          title="Remove"
          aria-label="Remove"
          className="hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

/* ────────────────────────────── modal ────────────────────────────── */

interface ResourceModalProps<T extends ContentBase> {
  config: ResourceConfig<T>;
  open: boolean;
  row: T | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

function ResourceModal<T extends ContentBase>({
  config,
  open,
  row,
  onClose,
  onSubmit,
}: ResourceModalProps<T>) {
  const { values, errors, setErrors, setField } = useFormState(
    config.fields,
    row as Record<string, unknown> | null,
  );
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(row);

  const handleSubmit = async () => {
    const validation = validateValues(config.fields, values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    try {
      // Strip keys the user never filled in, so the API applies its own defaults.
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined && value !== ''),
      );
      await onSubmit(payload);
    } catch (error) {
      setErrors(getFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
      description={
        isEdit ? 'Changes appear on the website as soon as you save.' : config.description
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : `Create ${config.singular.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <ResourceForm
        fields={config.fields}
        values={values}
        errors={errors}
        onChange={setField}
        mediaFolder={config.path}
      />
    </Modal>
  );
}

/** Re-exported so route files can build configs without a second import. */
export type { ResourceConfig };
