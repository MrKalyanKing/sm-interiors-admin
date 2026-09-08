import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FieldShell, Input, Textarea, Toggle } from '@/components/ui/Field';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import { TagsInput } from '@/components/ui/TagsInput';
import { api, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { SiteSetting } from '@/types';

const GROUP_LABELS: Record<string, string> = {
  identity: 'Business identity',
  contact: 'Contact details',
  social: 'Social links',
  seo: 'Search engine listing',
  estimator: 'Budget planner',
  notifications: 'Email notifications',
  general: 'General',
};

const GROUP_ORDER = ['identity', 'contact', 'social', 'seo', 'estimator', 'notifications', 'general'];

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<Record<string, SiteSetting[]>>('/settings');
      return data;
    },
  });

  const groups = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).sort((a, b) => {
      const ai = GROUP_ORDER.indexOf(a);
      const bi = GROUP_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [data]);

  const [activeGroup, setActiveGroup] = useState<string>('');
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
  }, [groups, activeGroup]);

  const save = useMutation({
    mutationFn: async (settings: { key: string; value: unknown }[]) => {
      await api.patch('/settings', { settings });
    },
    onSuccess: () => {
      toast.success('Settings saved. The website picks them up within a minute.');
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not save the settings.')),
  });

  if (isLoading) return <PageLoader label="Loading settings" />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  if (!data) return null;

  const settings = data[activeGroup] ?? [];
  const dirtyKeys = Object.keys(draft);

  const valueOf = (setting: SiteSetting) =>
    draft[setting.key] !== undefined ? draft[setting.key] : setting.value;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Site settings"
        description="Your contact details, opening hours and search listing. These feed straight into the website."
        action={
          <Button
            loading={save.isPending}
            disabled={dirtyKeys.length === 0}
            icon={<Save className="h-4 w-4" />}
            onClick={() =>
              save.mutate(dirtyKeys.map((key) => ({ key, value: draft[key] })))
            }
          >
            {dirtyKeys.length > 0 ? `Save ${dirtyKeys.length} change${dirtyKeys.length > 1 ? 's' : ''}` : 'Save'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[13rem_1fr]">
        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors',
                activeGroup === group
                  ? 'bg-azure/12 font-medium text-azure-light ring-1 ring-azure/20'
                  : 'text-frost-muted hover:bg-white/[0.06] hover:text-frost',
              )}
            >
              {GROUP_LABELS[group] ?? group}
            </button>
          ))}
        </nav>

        <Card>
          <CardBody className="space-y-5">
            {settings.length === 0 ? (
              <p className="py-8 text-center text-sm text-frost-dim">Nothing to configure here.</p>
            ) : (
              settings.map((setting) => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  value={valueOf(setting)}
                  onChange={(value) => setDraft((prev) => ({ ...prev, [setting.key]: value }))}
                />
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

interface SettingFieldProps {
  setting: SiteSetting;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Settings are stored as free-form JSON, so the control is chosen from the
 * shape of the value that is already there. That keeps a new setting working
 * without a matching change in this file.
 */
function SettingField({ setting, value, onChange }: SettingFieldProps) {
  // Booleans
  if (typeof value === 'boolean') {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <Toggle checked={value} onChange={onChange} label={setting.label} hint={setting.helpText} />
      </div>
    );
  }

  // Numbers
  if (typeof value === 'number') {
    return (
      <Input
        label={setting.label}
        hint={setting.helpText}
        type="number"
        step="any"
        value={String(value)}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    );
  }

  // Arrays of plain strings — service areas, keywords, recipient emails.
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return (
      <TagsInput
        label={setting.label}
        hint={setting.helpText}
        max={20}
        value={value as string[]}
        onChange={onChange}
      />
    );
  }

  // Arrays of objects (phones, opening hours) and nested objects (address).
  if (typeof value === 'object' && value !== null) {
    return (
      <FieldShell
        label={setting.label}
        hint={
          setting.helpText ||
          'Structured value. Keep the field names exactly as they are — only change the text after each colon.'
        }
      >
        <JsonEditor value={value} onChange={onChange} />
      </FieldShell>
    );
  }

  const text = String(value ?? '');
  const isLong = text.length > 90;

  return isLong ? (
    <Textarea
      label={setting.label}
      hint={setting.helpText}
      rows={3}
      value={text}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <Input
      label={setting.label}
      hint={setting.helpText}
      value={text}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * A guarded JSON box for the handful of structured settings. Invalid JSON is
 * flagged and simply not committed, so a stray comma can never save a broken
 * address onto the live site.
 */
function JsonEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  return (
    <div className="space-y-1.5">
      <textarea
        rows={Math.min(14, text.split('\n').length + 1)}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setError(null);
          } catch {
            setError('Not valid yet — check the quotes, commas and brackets.');
          }
        }}
        className={cn(
          'w-full rounded-lg border bg-night-raised/60 px-3.5 py-2.5 font-mono text-xs leading-relaxed text-frost focus:outline-none focus:ring-2 focus:ring-azure/25',
          error ? 'border-danger/60' : 'border-white/10 focus:border-azure/60',
        )}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
