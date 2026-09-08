import {
  AlertTriangle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ENQUIRY_SOURCE_LABELS, ENQUIRY_STATUS_META } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { getErrorMessage } from '@/lib/api';
import { formatDateTime, formatINR, formatRelative } from '@/lib/format';
import type { EnquiryStatus } from '@/types';
import { useEnquiry, useEnquiryMutations } from './useEnquiries';

const STATUS_OPTIONS = Object.entries(ENQUIRY_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

interface EnquiryDetailProps {
  id?: string;
  onClose: () => void;
}

export function EnquiryDetail({ id, onClose }: EnquiryDetailProps) {
  const { data: enquiry, isLoading, isError, error, refetch } = useEnquiry(id);
  const { update, remove, resend } = useEnquiryMutations();

  const [notes, setNotes] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the draft fields whenever a different enquiry is opened.
  useEffect(() => {
    setNotes(enquiry?.internalNotes ?? '');
    setDealValue(enquiry?.dealValue ? String(Math.round(Number(enquiry.dealValue))) : '');
  }, [enquiry?.id, enquiry?.internalNotes, enquiry?.dealValue]);

  const phoneDigits = enquiry?.phone.replace(/[^0-9]/g, '') ?? '';
  const notesChanged = enquiry ? notes !== enquiry.internalNotes : false;
  const dealChanged = enquiry
    ? dealValue !== (enquiry.dealValue ? String(Math.round(Number(enquiry.dealValue))) : '')
    : false;

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      size="lg"
      title={enquiry?.name ?? 'Enquiry'}
      description={
        enquiry
          ? `${ENQUIRY_SOURCE_LABELS[enquiry.source]} · ${formatDateTime(enquiry.createdAt)}`
          : undefined
      }
      footer={
        enquiry && (
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="h-4 w-4" />}
              className="mr-auto hover:text-danger"
            >
              Remove
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              loading={update.isPending}
              disabled={!notesChanged && !dealChanged}
              onClick={() =>
                update.mutate({
                  id: enquiry.id,
                  values: {
                    internalNotes: notes,
                    ...(dealChanged && dealValue ? { dealValue: Number(dealValue) } : {}),
                  },
                })
              }
            >
              Save notes
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !enquiry ? null : (
        <div className="space-y-5">
          {/* ── Reach them ─────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.open(`tel:${enquiry.phone.replace(/[^0-9+]/g, '')}`)}
              icon={<Phone className="h-4 w-4" />}
            >
              {enquiry.phone}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                window.open(
                  `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                    `Hello ${enquiry.name}, this is SM Interiors calling about your enquiry.`,
                  )}`,
                  '_blank',
                  'noopener',
                )
              }
              icon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
            {enquiry.email && (
              <Button
                variant="secondary"
                onClick={() => window.open(`mailto:${enquiry.email}`)}
                icon={<Mail className="h-4 w-4" />}
              >
                Email
              </Button>
            )}
          </div>

          {!enquiry.notificationSent && enquiry.status !== 'SPAM' && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/[0.07] px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-warning">The notification email did not go out.</p>
                {enquiry.notificationError && (
                  <p className="mt-1 break-words text-xs text-frost-dim">
                    {enquiry.notificationError}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={resend.isPending}
                onClick={() => resend.mutate(enquiry.id)}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retry
              </Button>
            </div>
          )}

          {/* ── Pipeline stage ─────────────────────────────────── */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Stage"
                className="min-w-[10rem]"
                options={STATUS_OPTIONS}
                value={enquiry.status}
                onChange={(e) =>
                  update.mutate({
                    id: enquiry.id,
                    values: { status: e.target.value as EnquiryStatus },
                  })
                }
              />
              {enquiry.status === 'WON' && (
                <Input
                  label="Contract value"
                  type="number"
                  min={0}
                  placeholder="850000"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="min-w-[10rem]"
                />
              )}
              <div className="ml-auto text-right text-xs text-frost-dim">
                {enquiry.contactedAt ? (
                  <>First contacted {formatRelative(enquiry.contactedAt)}</>
                ) : (
                  <>Not contacted yet</>
                )}
              </div>
            </div>
          </div>

          {/* ── What they told us ──────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow label="Phone" value={enquiry.phone} />
            <DetailRow label="Email" value={enquiry.email || '—'} />
            <DetailRow
              label="Location"
              value={enquiry.location || '—'}
              icon={<MapPin className="h-3.5 w-3.5" />}
            />
            <DetailRow label="Looking for" value={enquiry.scope || '—'} />
          </div>

          {enquiry.message && (
            <div>
              <p className="kicker mb-2">What they wrote</p>
              <div className="whitespace-pre-line rounded-xl border-l-2 border-azure/60 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-frost-muted">
                {enquiry.message}
              </div>
            </div>
          )}

          {enquiry.estimate && (
            <div className="rounded-xl border border-azure/20 bg-azure/[0.05] p-4">
              <p className="kicker text-azure-light">They used the budget planner</p>
              <p className="mt-2 font-display text-xl font-bold text-frost">
                {formatINR(enquiry.estimate.low)} – {formatINR(enquiry.estimate.high)}
              </p>
              <p className="mt-0.5 text-xs text-frost-dim">
                {enquiry.estimate.homeSize} · {enquiry.estimate.tier} finish
              </p>
              <ul className="mt-3 space-y-1">
                {enquiry.estimate.lineItems.map((item) => (
                  <li key={item.label} className="flex justify-between text-xs">
                    <span className="text-frost-muted">{item.label}</span>
                    <span className="font-medium text-frost">{formatINR(item.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Internal notes ─────────────────────────────────── */}
          <Textarea
            label="Internal notes"
            hint="Only your team sees this. The customer never does."
            rows={4}
            placeholder="Called on the 9th — wants to start after Sankranti. Budget around 8L."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <p className="text-xs text-frost-dim">
            Reference SMI-{enquiry.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
            {enquiry.referrer && ` · arrived from ${enquiry.referrer}`}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        loading={remove.isPending}
        title="Remove this enquiry?"
        message="It disappears from your list. The record is kept in the database, so nothing is lost permanently."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!enquiry) return;
          await remove.mutateAsync(enquiry.id);
          setConfirmDelete(false);
          onClose();
        }}
      />
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3.5 py-2.5">
      <p className="text-[0.65rem] uppercase tracking-wider text-frost-dim">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-frost">
        {icon}
        {value}
      </p>
    </div>
  );
}
