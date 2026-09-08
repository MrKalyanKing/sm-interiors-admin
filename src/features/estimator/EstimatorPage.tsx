import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { api, getErrorMessage } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { EstimatorFactor, EstimatorFactorKind, EstimatorScope } from '@/types';

const KIND_LABELS: Record<EstimatorFactorKind, string> = {
  HOME_SIZE: 'Home size',
  PACKAGE_TIER: 'Finish level',
};

export function EstimatorPage() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['estimator'] });
  };

  const scopes = useQuery({
    queryKey: ['estimator', 'scopes'],
    queryFn: async () => (await api.get<EstimatorScope[]>('/estimator/scopes')).data,
  });

  const factors = useQuery({
    queryKey: ['estimator', 'factors'],
    queryFn: async () => (await api.get<EstimatorFactor[]>('/estimator/factors')).data,
  });

  const [editingScope, setEditingScope] = useState<Partial<EstimatorScope> | null>(null);
  const [editingFactor, setEditingFactor] = useState<Partial<EstimatorFactor> | null>(null);
  const [deleting, setDeleting] = useState<{ kind: 'scope' | 'factor'; id: string } | null>(null);

  const saveScope = useMutation({
    mutationFn: async (scope: Partial<EstimatorScope>) => {
      const body = { label: scope.label, baseCost: scope.baseCost, isPublished: scope.isPublished };
      if (scope.id) await api.patch(`/estimator/scopes/${scope.id}`, body);
      else await api.post('/estimator/scopes', body);
    },
    onSuccess: () => {
      toast.success('Rate saved.');
      setEditingScope(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const saveFactor = useMutation({
    mutationFn: async (factor: Partial<EstimatorFactor>) => {
      const body = { kind: factor.kind, label: factor.label, multiplier: factor.multiplier };
      if (factor.id) await api.patch(`/estimator/factors/${factor.id}`, body);
      else await api.post('/estimator/factors', body);
    },
    onSuccess: () => {
      toast.success('Multiplier saved.');
      setEditingFactor(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: async ({ kind, id }: { kind: 'scope' | 'factor'; id: string }) => {
      await api.delete(`/estimator/${kind === 'scope' ? 'scopes' : 'factors'}/${id}`);
    },
    onSuccess: () => {
      toast.success('Removed.');
      setDeleting(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (scopes.isLoading || factors.isLoading) return <PageLoader label="Loading the rate card" />;
  if (scopes.isError)
    return <ErrorState message={getErrorMessage(scopes.error)} onRetry={() => void scopes.refetch()} />;

  const homeSizes = (factors.data ?? []).filter((f) => f.kind === 'HOME_SIZE');
  const tiers = (factors.data ?? []).filter((f) => f.kind === 'PACKAGE_TIER');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Budget planner"
        description="The rates behind the estimator on your website. A visitor picks a home size, a finish level and the items they want; these numbers produce the range they see."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="What it costs"
            description="Base price for a 2 BHK at the Essential finish."
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setEditingScope({ label: '', baseCost: 100000, isPublished: true })}
              >
                Add item
              </Button>
            }
          />
          {!scopes.data?.length ? (
            <EmptyState icon={Calculator} title="No items yet" />
          ) : (
            <ul className="divide-y divide-white/6">
              {scopes.data.map((scope) => (
                <li key={scope.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-frost">{scope.label}</p>
                    <p className="text-xs text-frost-dim">{formatINR(scope.baseCost)} base</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingScope(scope)}>
                    Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remove"
                    className="hover:text-danger"
                    onClick={() => setDeleting({ kind: 'scope', id: scope.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <FactorCard
            title="Home size"
            description="Scales every selected item. A 2 BHK sits at 1.0 — that is the baseline the prices above are quoted at."
            factors={homeSizes}
            onAdd={() =>
              setEditingFactor({ kind: 'HOME_SIZE', label: '', multiplier: 1 })
            }
            onEdit={setEditingFactor}
            onDelete={(id) => setDeleting({ kind: 'factor', id })}
          />
          <FactorCard
            title="Finish level"
            description="Essential sits at 1.0. Premium and Luxe multiply on top of the home size."
            factors={tiers}
            onAdd={() =>
              setEditingFactor({ kind: 'PACKAGE_TIER', label: '', multiplier: 1 })
            }
            onEdit={setEditingFactor}
            onDelete={(id) => setDeleting({ kind: 'factor', id })}
          />
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-frost-dim">
        The upper and lower bounds of the quoted range live under{' '}
        <span className="text-frost-muted">Site settings → Budget planner</span>.
      </p>

      {/* ── Edit a rate ──────────────────────────────────────────── */}
      <Modal
        open={Boolean(editingScope)}
        onClose={() => setEditingScope(null)}
        title={editingScope?.id ? 'Edit item' : 'New item'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingScope(null)}>
              Cancel
            </Button>
            <Button
              loading={saveScope.isPending}
              onClick={() => editingScope && saveScope.mutate(editingScope)}
            >
              Save
            </Button>
          </>
        }
      >
        {editingScope && (
          <div className="space-y-4">
            <Input
              label="Item"
              placeholder="Modular kitchen"
              value={editingScope.label ?? ''}
              onChange={(e) => setEditingScope({ ...editingScope, label: e.target.value })}
            />
            <Input
              label="Base cost"
              type="number"
              min={0}
              hint="What this costs for a 2 BHK at the Essential finish, in rupees."
              value={String(editingScope.baseCost ?? '')}
              onChange={(e) =>
                setEditingScope({ ...editingScope, baseCost: Number(e.target.value) })
              }
            />
          </div>
        )}
      </Modal>

      {/* ── Edit a multiplier ────────────────────────────────────── */}
      <Modal
        open={Boolean(editingFactor)}
        onClose={() => setEditingFactor(null)}
        title={editingFactor?.id ? 'Edit multiplier' : 'New multiplier'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingFactor(null)}>
              Cancel
            </Button>
            <Button
              loading={saveFactor.isPending}
              onClick={() => editingFactor && saveFactor.mutate(editingFactor)}
            >
              Save
            </Button>
          </>
        }
      >
        {editingFactor && (
          <div className="space-y-4">
            <Select
              label="Applies to"
              options={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
              value={editingFactor.kind ?? 'HOME_SIZE'}
              onChange={(e) =>
                setEditingFactor({
                  ...editingFactor,
                  kind: e.target.value as EstimatorFactorKind,
                })
              }
            />
            <Input
              label="Name"
              placeholder="3 BHK"
              value={editingFactor.label ?? ''}
              onChange={(e) => setEditingFactor({ ...editingFactor, label: e.target.value })}
            />
            <Input
              label="Multiplier"
              type="number"
              step="0.05"
              min={0.1}
              max={10}
              hint="1.35 means 35% more than the baseline."
              value={String(editingFactor.multiplier ?? 1)}
              onChange={(e) =>
                setEditingFactor({ ...editingFactor, multiplier: Number(e.target.value) })
              }
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title="Remove this?"
        message="It disappears from the budget planner on your website straight away."
        confirmLabel="Remove"
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}

interface FactorCardProps {
  title: string;
  description: string;
  factors: EstimatorFactor[];
  onAdd: () => void;
  onEdit: (factor: EstimatorFactor) => void;
  onDelete: (id: string) => void;
}

function FactorCard({ title, description, factors, onAdd, onEdit, onDelete }: FactorCardProps) {
  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={onAdd}>
            Add
          </Button>
        }
      />
      <CardBody className="flex flex-wrap gap-2">
        {factors.length === 0 ? (
          <p className="text-sm text-frost-dim">Nothing configured.</p>
        ) : (
          factors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-3 pr-1.5"
            >
              <span className="text-sm text-frost">{factor.label}</span>
              <Badge tone="azure">×{Number(factor.multiplier).toFixed(2)}</Badge>
              <button
                onClick={() => onEdit(factor)}
                className="rounded px-1.5 py-0.5 text-xs text-frost-dim hover:text-frost"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(factor.id)}
                aria-label={`Remove ${factor.label}`}
                className="rounded p-1 text-frost-dim hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
