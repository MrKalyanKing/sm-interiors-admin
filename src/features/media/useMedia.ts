import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getErrorMessage, BACKEND_ORIGIN, SITE_URL } from '@/lib/api';
import type { MediaAsset, Paginated } from '@/types';

export interface MediaQuery {
  search?: string;
  folder?: string;
  page?: number;
  limit?: number;
}

export function useMediaList(params: MediaQuery = {}) {
  return useQuery({
    queryKey: ['media', 'list', params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<MediaAsset>>('/media', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 48,
          search: params.search || undefined,
          folder: params.folder || undefined,
        },
      });
      return data;
    },
  });
}

export function useMediaFolders() {
  return useQuery({
    queryKey: ['media', 'folders'],
    queryFn: async () => {
      const { data } = await api.get<{ folder: string; count: number }[]>('/media/folders');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useMediaMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['media'] });

  const upload = useMutation({
    mutationFn: async ({
      file,
      folder,
      alt,
      onProgress,
    }: {
      file: File;
      folder?: string;
      alt?: string;
      onProgress?: (percent: number) => void;
    }) => {
      const form = new FormData();
      form.append('file', file);
      if (folder) form.append('folder', folder);
      if (alt) form.append('alt', alt);

      const { data } = await api.post<MediaAsset>('/media/upload', form, {
        // Let the browser set the multipart boundary itself.
        headers: { 'Content-Type': undefined },
        timeout: 120_000,
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
        },
      });
      return data;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error, 'That file could not be uploaded.')),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: { alt?: string; folder?: string } }) => {
      const { data } = await api.patch<MediaAsset>(`/media/${id}`, values);
      return data;
    },
    onSuccess: () => {
      toast.success('File details saved.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/media/${id}`);
    },
    onSuccess: () => {
      toast.success('File removed from the library.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { upload, update, remove };
}

/** Absolute URL for an asset, whichever shape the API returned it in. */
export function mediaUrl(asset: Pick<MediaAsset, 'url' | 'path'> | null | undefined): string {
  if (!asset) return '';
  if (asset.url) return asset.url;
  if (!asset.path) return '';
  const path = asset.path.startsWith('/') ? asset.path : `/${asset.path}`;
  if (path.startsWith('/uploads/')) {
    const filename = path.replace('/uploads/', '');
    return `${BACKEND_ORIGIN}/api/media/file/${filename}`;
  }
  if (path.startsWith('/images/')) {
    return `${SITE_URL}${path}`;
  }
  return `${BACKEND_ORIGIN}${path}`;
}

export function mediaThumb(asset: MediaAsset | null | undefined): string {
  if (!asset) return '';
  if (asset.thumbnailUrl) return asset.thumbnailUrl;
  if (asset.thumbnailPath) {
    const path = asset.thumbnailPath.startsWith('/') ? asset.thumbnailPath : `/${asset.thumbnailPath}`;
    if (path.startsWith('/uploads/')) {
      const filename = path.replace('/uploads/', '');
      return `${BACKEND_ORIGIN}/api/media/file/${filename}?thumb=1`;
    }
    if (path.startsWith('/images/')) {
      return `${SITE_URL}${path}`;
    }
    return `${BACKEND_ORIGIN}${path}`;
  }
  return mediaUrl(asset);
}

/** Resolves any resource image url (e.g. project row.imageUrl), whether absolute, asset-based, or static */
export function resolveResourceImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    return `${BACKEND_ORIGIN}/api/media/file/${filename}`;
  }
  if (url.startsWith('/images/')) {
    return `${SITE_URL}${url}`;
  }
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * One asset by id. Used by the picker when the selected image is older than the
 * page of results it is showing.
 */
export function useMediaAsset(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['media', 'detail', id],
    enabled: Boolean(id) && enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await api.get<MediaAsset>(`/media/${id}`);
      return data;
    },
  });
}
