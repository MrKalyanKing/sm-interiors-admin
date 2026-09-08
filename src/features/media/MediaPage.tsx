import { FileText, ImageOff, Search, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useDebounced } from '@/hooks/useDebounced';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatBytes, formatDate } from '@/lib/format';
import type { MediaAsset } from '@/types';
import { mediaThumb, mediaUrl, useMediaFolders, useMediaList, useMediaMutations } from './useMedia';

export function MediaPage() {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const debouncedSearch = useDebounced(search, 300);

  const { data, isLoading, isError, error, refetch } = useMediaList({
    search: debouncedSearch,
    folder,
    limit: 60,
  });
  const { data: folders } = useMediaFolders();
  const { upload, update, remove } = useMediaMutations();

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState<MediaAsset | null>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    let done = 0;
    try {
      // Sequential rather than parallel: eight phone photos at once would
      // saturate a rural connection and time the whole batch out.
      for (const file of list) {
        await upload.mutateAsync({
          file,
          folder: folder || 'general',
          onProgress: (percent) =>
            setProgress(Math.round(((done + percent / 100) / list.length) * 100)),
        });
        done += 1;
      }
      toast.success(list.length === 1 ? 'Photo uploaded.' : `${list.length} files uploaded.`);
    } catch {
      // The mutation already surfaced the reason.
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const folderOptions = [
    { value: '', label: 'All folders' },
    ...(folders ?? []).map((f) => ({ value: f.folder, label: `${f.folder} (${f.count})` })),
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Media library"
        description="Every photo used across the website. Upload once here and reuse it anywhere."
        action={
          <Button
            onClick={() => fileInput.current?.click()}
            loading={uploading}
            icon={<Upload className="h-4 w-4" />}
          >
            Upload
          </Button>
        }
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 border-b border-white/8 p-4 sm:grid-cols-[1fr_14rem]">
          <Input
            placeholder="Search by file name or alt text"
            leading={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={folderOptions}
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void uploadFiles(e.dataTransfer.files);
          }}
          className={cn(
            'relative min-h-[16rem] p-4 transition-colors',
            dragOver && 'bg-azure/[0.06] ring-2 ring-inset ring-azure/40',
          )}
        >
          {uploading && (
            <div className="mb-4 rounded-lg border border-azure/25 bg-azure/[0.07] px-4 py-3">
              <div className="flex items-center justify-between text-xs text-azure-light">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-azure transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Spinner />
            </div>
          ) : isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          ) : !data?.items.length ? (
            <EmptyState
              icon={ImageOff}
              title={debouncedSearch ? 'Nothing matches that search' : 'The library is empty'}
              description="Drag photos here, or use the Upload button. Big photos are resized and converted automatically, so the website stays fast."
              action={
                <Button onClick={() => fileInput.current?.click()} icon={<Upload className="h-4 w-4" />}>
                  Upload photos
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {data.items.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-night-raised/50"
                >
                  <button
                    onClick={() => setEditing(asset)}
                    className="block aspect-square w-full"
                    aria-label={`Edit ${asset.originalName}`}
                  >
                    {asset.mimeType.startsWith('image/') ? (
                      <img
                        src={mediaThumb(asset)}
                        alt={asset.alt || asset.originalName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-frost-dim">
                        <FileText className="h-8 w-8" />
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setDeleting(asset)}
                    aria-label={`Remove ${asset.originalName}`}
                    className="absolute right-2 top-2 rounded-lg bg-night/80 p-1.5 text-frost-muted opacity-0 backdrop-blur transition-opacity hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="px-2.5 py-2">
                    <p className="truncate text-xs text-frost">{asset.originalName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[0.65rem] text-frost-dim">
                      {formatBytes(asset.size)}
                      {!asset.alt && asset.mimeType.startsWith('image/') && (
                        <Badge tone="warning" className="px-1 py-0 text-[0.6rem]">
                          no alt
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── File details ─────────────────────────────────────────── */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="File details"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Close
            </Button>
            <Button
              loading={update.isPending}
              onClick={async () => {
                if (!editing) return;
                await update.mutateAsync({
                  id: editing.id,
                  values: { alt: editing.alt, folder: editing.folder },
                });
                setEditing(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {editing.mimeType.startsWith('image/') && (
              <img
                src={mediaUrl(editing)}
                alt={editing.alt}
                className="max-h-64 w-full rounded-xl object-contain"
              />
            )}

            <Input
              label="Alt text"
              hint="Describes the photo for screen readers and for Google Images. Worth filling in."
              placeholder="Sage green modular kitchen with granite counter"
              value={editing.alt}
              onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
            />

            <Input
              label="Folder"
              hint="Just a label for finding things later."
              value={editing.folder}
              onChange={(e) => setEditing({ ...editing, folder: e.target.value })}
            />

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <Meta label="File name" value={editing.originalName} />
              <Meta label="Size" value={formatBytes(editing.size)} />
              <Meta
                label="Dimensions"
                value={editing.width ? `${editing.width} × ${editing.height}` : '—'}
              />
              <Meta label="Uploaded" value={formatDate(editing.createdAt)} />
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title="Remove this file?"
        message="Anything currently using this photo will lose it. Check the work gallery first if you are not sure."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
      <dt className="text-[0.65rem] uppercase tracking-wider text-frost-dim">{label}</dt>
      <dd className="mt-0.5 truncate text-frost">{value}</dd>
    </div>
  );
}
