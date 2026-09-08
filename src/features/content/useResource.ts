import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api';
import type { ContentBase, Paginated } from '@/types';

interface ResourceEndpoint {
  /** API path without a leading slash, e.g. "services". */
  path: string;
  singular: string;
}

/**
 * Every ordered content collection exposes the same eight endpoints, so one set
 * of hooks serves services, FAQs, testimonials and the rest.
 */
export function useResourceList<T extends ContentBase>(
  { path }: ResourceEndpoint,
  params: { search?: string; page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: [path, 'list', params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<T>>(`/${path}/admin`, {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 100,
          search: params.search || undefined,
          sortBy: 'position',
          sortOrder: 'ASC',
          // The admin panel is the one place hidden items must be visible.
          includeHidden: 'true',
        },
      });
      return data;
    },
  });
}

export function useResourceMutations<T extends ContentBase>({
  path,
  singular,
}: ResourceEndpoint) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [path] });

  const create = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data } = await api.post<T>(`/${path}`, values);
      return data;
    },
    onSuccess: () => {
      toast.success(`${singular} created.`);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, `Could not create the ${singular.toLowerCase()}.`)),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { data } = await api.patch<T>(`/${path}/${id}`, values);
      return data;
    },
    onSuccess: () => {
      toast.success('Saved.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not save your changes.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/${path}/${id}`);
    },
    onSuccess: () => {
      toast.success(`${singular} removed.`);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not remove it.')),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { data } = await api.patch<T>(`/${path}/${id}/publish`, { isPublished });
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isPublished ? 'Now live on the website.' : 'Hidden from the website.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not change visibility.')),
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      await api.patch(`/${path}/reorder`, { items });
    },
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not save the new order.'));
      // Snap the list back to what the server actually holds.
      invalidate();
    },
  });

  return { create, update, remove, togglePublish, reorder };
}
