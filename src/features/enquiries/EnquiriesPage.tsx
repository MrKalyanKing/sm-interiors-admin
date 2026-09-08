import { Download, Inbox, MessageCircle, Phone, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, ENQUIRY_SOURCE_LABELS, ENQUIRY_STATUS_META, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback';
import { useDebounced } from '@/hooks/useDebounced';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatINRShort, formatRelative, truncate } from '@/lib/format';
import type { EnquirySource, EnquiryStatus } from '@/types';
import { EnquiryDetail } from './EnquiryDetail';
import { downloadEnquiriesCsv, useEnquiries, type EnquiryFilters } from './useEnquiries';

const STATUS_OPTIONS = [
  { value: '', label: 'Every status' },
  ...Object.entries(ENQUIRY_STATUS_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Every source' },
  ...Object.entries(ENQUIRY_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

export function EnquiriesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnquiryStatus | ''>('');
  const [source, setSource] = useState<EnquirySource | ''>('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounced(search, 350);
  const filters: EnquiryFilters = { search: debouncedSearch, status, source, page, limit: 25 };

  const { data, isLoading, isError, error, refetch } = useEnquiries(filters);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadEnquiriesCsv(filters);
      toast.success('Export downloaded.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'The export failed.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Enquiries"
        description="Every lead from the website, plus the ones you add yourself. Call the new ones first."
        action={
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            icon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 border-b border-white/8 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Name, phone, email or message"
            leading={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="lg:col-span-2"
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EnquiryStatus | '');
              setPage(1);
            }}
          />
          <Select
            options={SOURCE_OPTIONS}
            value={source}
            onChange={(e) => {
              setSource(e.target.value as EnquirySource | '');
              setPage(1);
            }}
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : isError ? (
          <div className="p-5">
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={Inbox}
            title={debouncedSearch || status || source ? 'No enquiries match' : 'No enquiries yet'}
            description={
              debouncedSearch || status || source
                ? 'Try clearing the filters above.'
                : 'When someone submits the form on your website, it appears here and you get an email straight away.'
            }
          />
        ) : (
          <ul className="divide-y divide-white/6">
            {data.items.map((enquiry) => (
              <li key={enquiry.id}>
                <button
                  onClick={() => navigate(`/enquiries/${enquiry.id}`)}
                  className={cn(
                    'flex w-full items-start gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]',
                    enquiry.status === 'NEW' && 'bg-azure/[0.04]',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-frost">
                        {enquiry.name}
                      </span>
                      <StatusBadge status={enquiry.status} />
                      {enquiry.estimate && (
                        <Badge tone="azure">
                          {formatINRShort(enquiry.estimate.low)}–{formatINRShort(enquiry.estimate.high)}
                        </Badge>
                      )}
                      {!enquiry.notificationSent && enquiry.status !== 'SPAM' && (
                        <Badge tone="warning">Email not sent</Badge>
                      )}
                    </div>

                    <p className="mt-1 truncate text-xs text-frost-muted">
                      {enquiry.phone}
                      {enquiry.location && ` · ${enquiry.location}`}
                      {enquiry.scope && ` · ${enquiry.scope}`}
                    </p>

                    {enquiry.message && (
                      <p className="mt-1 truncate text-xs text-frost-dim">
                        {truncate(enquiry.message, 120)}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-frost-dim">
                      {formatRelative(enquiry.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${enquiry.phone.replace(/[^0-9+]/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Call"
                        aria-label={`Call ${enquiry.name}`}
                        className="rounded-lg p-1.5 text-frost-dim transition-colors hover:bg-white/8 hover:text-azure-light"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${enquiry.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="WhatsApp"
                        aria-label={`WhatsApp ${enquiry.name}`}
                        className="rounded-lg p-1.5 text-frost-dim transition-colors hover:bg-white/8 hover:text-success"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {data && data.meta.pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
            <p className="text-xs text-frost-dim">
              Page {data.meta.page} of {data.meta.pageCount} · {data.meta.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.meta.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <EnquiryDetail id={id} onClose={() => navigate('/enquiries')} />
    </div>
  );
}
