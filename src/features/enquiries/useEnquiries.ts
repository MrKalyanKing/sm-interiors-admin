import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_URL, getErrorMessage, tokenStore } from '@/lib/api';
import type { Enquiry, EnquirySource, EnquiryStatus, Paginated } from '@/types';

export interface EnquiryFilters {
  search?: string;
  status?: EnquiryStatus | '';
  source?: EnquirySource | '';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

const toParams = (filters: EnquiryFilters) => ({
  page: filters.page ?? 1,
  limit: filters.limit ?? 25,
  search: filters.search || undefined,
  status: filters.status || undefined,
  source: filters.source || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
});

export function useEnquiries(filters: EnquiryFilters) {
  return useQuery({
    queryKey: ['enquiries', 'list', filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Enquiry>>('/enquiries', {
        params: toParams(filters),
      });
      return data;
    },
    // Leads are time-sensitive; a stale list costs a callback.
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useEnquiry(id: string | undefined) {
  return useQuery({
    queryKey: ['enquiries', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Enquiry>(`/enquiries/${id}`);
      return data;
    },
  });
}

export function useEnquiryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const update = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<Pick<Enquiry, 'status' | 'internalNotes' | 'assignedToId'>> & {
        dealValue?: number;
      };
    }) => {
      const { data } = await api.patch<Enquiry>(`/enquiries/${id}`, values);
      return data;
    },
    onSuccess: () => {
      toast.success('Enquiry updated.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update the enquiry.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/enquiries/${id}`);
    },
    onSuccess: () => {
      toast.success('Enquiry removed.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Enquiry>(`/enquiries/${id}/resend-notification`);
      return data;
    },
    onSuccess: (enquiry) => {
      if (enquiry.notificationSent) toast.success('Notification email sent.');
      else toast.error(enquiry.notificationError ?? 'The email still could not be sent.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { update, remove, resend };
}

/**
 * Downloads the filtered list as CSV. Fetched rather than linked because the
 * endpoint needs the Authorization header.
 */
export async function downloadEnquiriesCsv(filters: EnquiryFilters): Promise<void> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(toParams({ ...filters, page: 1, limit: 5000 }))) {
    if (value !== undefined) params.set(key, String(value));
  }

  const response = await fetch(`${API_URL}/enquiries/export?${params.toString()}`, {
    headers: { Authorization: `Bearer ${tokenStore.access ?? ''}` },
  });

  if (!response.ok) throw new Error('The export could not be generated.');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sm-interiors-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
