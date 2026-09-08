import { Check, ImageOff, Search, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/lib/format';
import type { MediaAsset } from '@/types';
import { mediaThumb, mediaUrl, useMediaAsset, useMediaList, useMediaMutations } from './useMedia';

interface MediaPickerProps {
  value?: string | null;
  /** Passed the asset id, or null when cleared. */
  onChange: (assetId: string | null, asset: MediaAsset | null) => void;
  label?: string;
  hint?: string;
  /** Uploads made from inside the picker land in this folder. */
  folder?: string;
  /** Shown when the record still points at a /public path rather than an asset. */
  fallbackUrl?: string | null;
}

export function MediaPicker({
  value,
  onChange,
  label,
  hint,
  folder = 'general',
  fallbackUrl,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useMediaList({ search, limit: 60 });
  const { upload } = useMediaMutations();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // The library page is capped, so the currently-selected asset may not be in
  // it. Fetch that one directly rather than showing an empty box when someone
  // opens an older project for editing.
  const inList = data?.items.find((item) => item.id === value) ?? null;
  const { data: fetched } = useMediaAsset(value, Boolean(value) && !inList);
  const selected = inList ?? fetched ?? null;

  const previewUrl = selected ? mediaThumb(selected) : (fallbackUrl ?? '');

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await upload.mutateAsync({ file, folder });
      onChange(asset.id, asset);
      toast.success('Uploaded and selected.');
      setOpen(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-frost-muted">{label}</label>}

      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-night-raised">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-frost-dim">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange(null, null)}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-md bg-night/80 p-1 text-frost-muted backdrop-blur hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
              Choose from library
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={uploading}
              onClick={() => fileInput.current?.click()}
              icon={<Upload className="h-3.5 w-3.5" />}
            >
              Upload
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          {selected ? (
            <p className="mt-2 truncate text-xs text-frost-dim">
              {selected.originalName} · {formatBytes(selected.size)}
              {selected.width ? ` · ${selected.width}×${selected.height}` : ''}
            </p>
          ) : (
            hint && <p className="mt-2 text-xs leading-relaxed text-frost-dim">{hint}</p>
          )}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Media library"
        description="Pick an existing photo, or upload a new one."
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <Input
          placeholder="Search by file name or alt text"
          leading={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={ImageOff}
            title="Nothing here yet"
            description="Upload a photo and it becomes available to every project and section."
            action={
              <Button size="sm" onClick={() => fileInput.current?.click()}>
                Upload a photo
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {data.items.map((asset) => {
              const isSelected = asset.id === value;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onChange(asset.id, asset);
                    setOpen(false);
                  }}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-xl border transition-all',
                    isSelected
                      ? 'border-azure ring-2 ring-azure/40'
                      : 'border-white/10 hover:border-white/25',
                  )}
                >
                  <img
                    src={mediaThumb(asset)}
                    alt={asset.alt || asset.originalName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isSelected && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-azure text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-night/95 to-transparent px-2 pb-1.5 pt-6 text-left text-[0.65rem] text-frost-muted">
                    {asset.originalName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

export { mediaUrl };
