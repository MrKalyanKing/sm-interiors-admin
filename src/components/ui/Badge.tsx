import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { EnquirySource, EnquiryStatus, Role } from '@/types';

type Tone = 'neutral' | 'azure' | 'success' | 'warning' | 'danger' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-white/[0.08] text-frost ring-white/12',
  azure: 'bg-azure/12 text-azure-light ring-azure/25',
  success: 'bg-success/12 text-success ring-success/25',
  warning: 'bg-warning/12 text-warning ring-warning/25',
  danger: 'bg-danger/12 text-danger ring-danger/25',
  muted: 'bg-white/[0.05] text-frost-dim ring-white/8',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The pipeline stage, in the studio's own language rather than the enum. */
export const ENQUIRY_STATUS_META: Record<EnquiryStatus, { label: string; tone: Tone }> = {
  NEW: { label: 'New', tone: 'azure' },
  CONTACTED: { label: 'Contacted', tone: 'neutral' },
  SITE_VISIT: { label: 'Site visit', tone: 'warning' },
  QUOTED: { label: 'Quoted', tone: 'warning' },
  WON: { label: 'Won', tone: 'success' },
  LOST: { label: 'Lost', tone: 'danger' },
  SPAM: { label: 'Spam', tone: 'muted' },
};

export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  WEBSITE_FORM: 'Website form',
  COST_ESTIMATOR: 'Budget planner',
  WHATSAPP: 'WhatsApp',
  PHONE: 'Phone',
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  INSTAGRAM: 'Instagram',
  OTHER: 'Other',
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
};

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  const meta = ENQUIRY_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? 'success' : 'muted'}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          published ? 'bg-success' : 'bg-frost-dim',
        )}
      />
      {published ? 'Live' : 'Hidden'}
    </Badge>
  );
}
