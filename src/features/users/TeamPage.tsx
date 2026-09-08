import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, ROLE_LABELS } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Toggle } from '@/components/ui/Field';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/AuthProvider';
import { api, getErrorMessage } from '@/lib/api';
import { formatRelative, initials } from '@/lib/format';
import type { AdminUser, Paginated, Role } from '@/types';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'EDITOR', label: 'Editor — website content only' },
  { value: 'ADMIN', label: 'Admin — content, enquiries and settings' },
  { value: 'SUPER_ADMIN', label: 'Super admin — everything, including this page' },
];

interface UserDraft {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  isActive: boolean;
}

const emptyDraft: UserDraft = {
  name: '',
  email: '',
  password: '',
  role: 'EDITOR',
  phone: '',
  isActive: true,
};

export function TeamPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['users'] });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<Paginated<AdminUser>>('/users', { params: { limit: 50 } })).data,
  });

  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const save = useMutation({
    mutationFn: async (values: UserDraft) => {
      if (values.id) {
        await api.patch(`/users/${values.id}`, {
          name: values.name,
          email: values.email,
          role: values.role,
          phone: values.phone || undefined,
          isActive: values.isActive,
        });
      } else {
        await api.post('/users', {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          phone: values.phone || undefined,
          isActive: values.isActive,
        });
      }
    },
    onSuccess: () => {
      toast.success('Saved.');
      setDraft(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetPassword = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await api.post(`/users/${id}/password`, { password });
    },
    onSuccess: () => {
      toast.success('Password changed. Pass it on to them directly, not by email.');
      setResetting(null);
      setNewPassword('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success('Account removed.');
      setDeleting(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Team"
        description="Who can sign in to this panel, and how much each of them can change."
        action={
          <Button onClick={() => setDraft(emptyDraft)} icon={<Plus className="h-4 w-4" />}>
            Add person
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <TableSkeleton rows={4} columns={3} />
        ) : isError ? (
          <div className="p-5">
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          </div>
        ) : !data?.items.length ? (
          <EmptyState icon={Users} title="No accounts yet" />
        ) : (
          <ul className="divide-y divide-white/6">
            {data.items.map((person) => {
              const isSelf = person.id === currentUser?.id;
              return (
                <li key={person.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-azure/12 text-xs font-semibold text-azure-light ring-1 ring-azure/25">
                    {initials(person.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-frost">{person.name}</span>
                      <Badge tone={person.role === 'SUPER_ADMIN' ? 'azure' : 'neutral'}>
                        {ROLE_LABELS[person.role]}
                      </Badge>
                      {isSelf && <Badge tone="muted">You</Badge>}
                      {!person.isActive && <Badge tone="danger">Deactivated</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-frost-dim">
                      {person.email}
                      {person.lastLoginAt
                        ? ` · last signed in ${formatRelative(person.lastLoginAt)}`
                        : ' · never signed in'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft({
                          id: person.id,
                          name: person.name,
                          email: person.email,
                          password: '',
                          role: person.role,
                          phone: person.phone ?? '',
                          isActive: person.isActive,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Reset password"
                      aria-label={`Reset password for ${person.name}`}
                      onClick={() => setResetting(person)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {!isSelf && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Remove"
                        aria-label={`Remove ${person.name}`}
                        className="hover:text-danger"
                        onClick={() => setDeleting(person)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ── Add / edit ───────────────────────────────────────────── */}
      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit account' : 'Add someone to the team'}
        description={
          draft?.id
            ? undefined
            : 'They sign in with this email and password. Give them the password in person or over the phone.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button loading={save.isPending} onClick={() => draft && save.mutate(draft)}>
              Save
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Input
              label="Full name"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              label="Email address"
              type="email"
              required
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            {!draft.id && (
              <Input
                label="Password"
                type="text"
                required
                hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              />
            )}
            <Input
              label="Phone"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <Select
              label="Access level"
              options={ROLE_OPTIONS}
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
            />
            <Toggle
              label="Account is active"
              hint="Turn this off to block sign-in without deleting anything."
              checked={draft.isActive}
              onChange={(isActive) => setDraft({ ...draft, isActive })}
            />
          </div>
        )}
      </Modal>

      {/* ── Reset password ───────────────────────────────────────── */}
      <Modal
        open={Boolean(resetting)}
        onClose={() => {
          setResetting(null);
          setNewPassword('');
        }}
        title={`Set a new password for ${resetting?.name ?? ''}`}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setResetting(null);
                setNewPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              loading={resetPassword.isPending}
              disabled={newPassword.length < 8}
              onClick={() =>
                resetting && resetPassword.mutate({ id: resetting.id, password: newPassword })
              }
            >
              Set password
            </Button>
          </>
        }
      >
        <Input
          label="New password"
          type="text"
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number. Tell them in person — never email a password."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={`Remove ${deleting?.name ?? 'this account'}?`}
        message="They lose access immediately. Anything they created on the website stays exactly as it is."
        confirmLabel="Remove"
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
