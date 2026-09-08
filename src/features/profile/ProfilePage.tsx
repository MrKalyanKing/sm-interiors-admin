import { useMutation } from '@tanstack/react-query';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, ROLE_LABELS } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { useAuth } from '@/features/auth/AuthProvider';
import { api, getErrorMessage } from '@/lib/api';
import { initials } from '@/lib/format';

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const saveProfile = useMutation({
    mutationFn: async () => {
      await api.patch('/users/me', { name, phone: phone || undefined });
    },
    onSuccess: async () => {
      toast.success('Profile updated.');
      await refreshUser();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      // The API revokes every other session on a password change, so say so.
      toast.success('Password changed. You have been signed out everywhere else.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmitPassword =
    currentPassword.length > 0 && newPassword.length >= 8 && passwordsMatch;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Your profile" description="Your details and your password." />

      <Card className="mb-5">
        <CardBody className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-azure/12 font-display text-lg font-bold text-azure-light ring-1 ring-azure/25">
            {initials(user?.name ?? '')}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-frost">
              {user?.name}
            </p>
            <p className="truncate text-sm text-frost-dim">{user?.email}</p>
            <div className="mt-1.5">
              <Badge tone="azure">
                <ShieldCheck className="h-3 w-3" />
                {user ? ROLE_LABELS[user.role] : ''}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Your details" />
        <CardBody className="space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Phone"
            value={phone}
            placeholder="+91 84990 22611"
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              loading={saveProfile.isPending}
              disabled={name.trim().length < 2}
              onClick={() => saveProfile.mutate()}
            >
              Save
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader
          title="Change your password"
          description="Changing it signs you out on every other device."
        />
        <CardBody className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={
              confirmPassword.length > 0 && !passwordsMatch
                ? 'The two passwords do not match.'
                : undefined
            }
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              loading={changePassword.isPending}
              disabled={!canSubmitPassword}
              onClick={() => changePassword.mutate()}
            >
              Change password
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-frost">Sign out of this device</p>
            <p className="mt-0.5 text-xs text-frost-dim">
              Always do this on a shared or public computer.
            </p>
          </div>
          <Button variant="secondary" onClick={logout} icon={<LogOut className="h-4 w-4" />}>
            Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
