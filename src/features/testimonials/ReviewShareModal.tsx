import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Link2, MessageSquare, Send, Sparkles, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { api, getErrorMessage } from '@/lib/api';
import type { ReviewInvite } from '@/types';

interface ReviewShareModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReviewShareModal({ open, onClose }: ReviewShareModalProps) {
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState('');
  const [projectDetail, setProjectDetail] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [copiedPersonal, setCopiedPersonal] = useState(false);

  // Compute public website base URL (reads VITE_SITE_URL with origin fallback)
  const publicBaseUrl =
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined'
      ? window.location.origin.includes(':5174')
        ? window.location.origin.replace(':5174', ':5173')
        : window.location.origin.replace('admin.', '')
      : 'https://sminteriors.in');

  const generalReviewUrl = `${publicBaseUrl}/review`;

  // Fetch recent invites
  const { data: invites, isLoading: loadingInvites } = useQuery<ReviewInvite[]>({
    queryKey: ['review-invites'],
    queryFn: async () => {
      const res = await api.get<ReviewInvite[]>('/testimonials/invites/all');
      return res.data;
    },
    enabled: open,
  });

  // Mutation to create personalized invite
  const createInviteMutation = useMutation({
    mutationFn: async (payload: { clientName?: string; projectDetail?: string }) => {
      const res = await api.post<ReviewInvite>('/testimonials/invites', payload);
      return res.data;
    },
    onSuccess: (data) => {
      const fullUrl = `${publicBaseUrl}/review?token=${data.token}`;
      setGeneratedLink(fullUrl);
      queryClient.invalidateQueries({ queryKey: ['review-invites'] });
      toast.success('Personalized review link generated!');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInviteMutation.mutateAsync({
      clientName: clientName.trim() || undefined,
      projectDetail: projectDetail.trim() || undefined,
    });
  };

  const copyToClipboard = async (text: string, isPersonal = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPersonal) {
        setCopiedPersonal(true);
        setTimeout(() => setCopiedPersonal(false), 2500);
      } else {
        setCopiedGeneral(true);
        setTimeout(() => setCopiedGeneral(false), 2500);
      }
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  const openWhatsApp = (url: string, name?: string, detail?: string) => {
    const greeting = name ? `Hi ${name}!` : 'Hello!';
    const projectInfo = detail ? ` for your ${detail} project` : '';
    const text = `${greeting} Thank you for choosing SM Interiors! We would love to hear your thoughts and feedback${projectInfo}. Please take a quick moment to share your review with us:\n\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Share Customer Review Link"
      description="Invite your clients to submit their genuine feedback, ratings, and experience."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6 text-frost">
        {/* General Public Link */}
        <div className="rounded-xl border border-white/10 bg-night-raised p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-azure-light" />
            <h4 className="text-sm font-semibold text-frost">General Review Page</h4>
            <Badge tone="azure">Public Link</Badge>
          </div>
          <p className="text-xs text-frost-dim mb-3">
            Standard link for any customer to leave a review directly on your website.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generalReviewUrl}
              className="flex-1 rounded-lg border border-white/10 bg-night px-3 py-2 text-xs font-mono text-frost-dim focus:outline-none"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyToClipboard(generalReviewUrl)}
              icon={copiedGeneral ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            >
              {copiedGeneral ? 'Copied' : 'Copy'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openWhatsApp(generalReviewUrl)}
              icon={<MessageSquare className="h-3.5 w-3.5 text-emerald-400" />}
            >
              WhatsApp
            </Button>
            <a
              href={generalReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg p-2 text-frost-dim hover:text-frost hover:bg-white/5 transition-colors"
              title="Open review page in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Client-Specific Invite Link Generator */}
        <div className="rounded-xl border border-azure/20 bg-azure/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-azure-light" />
            <h4 className="text-sm font-semibold text-frost">Personalized Client Invitation</h4>
            <Badge tone="warning">Prefilled Link</Badge>
          </div>
          <p className="text-xs text-frost-dim mb-4">
            Generate a dedicated link for a specific client. Their name and home/project details will be prefilled automatically.
          </p>

          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Customer / Couple Name"
                placeholder="e.g. Ramesh & Sunitha"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <Input
                label="Project or Home Detail"
                placeholder="e.g. 3 BHK · Balusumoodi"
                value={projectDetail}
                onChange={(e) => setProjectDetail(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              loading={createInviteMutation.isPending}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              Generate Dedicated Link
            </Button>
          </form>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
              <p className="text-xs font-medium text-azure-light mb-1.5 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> Generated Dedicated Review Link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 rounded-lg border border-azure/30 bg-night px-3 py-2 text-xs font-mono text-frost focus:outline-none"
                />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(generatedLink, true)}
                  icon={copiedPersonal ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                >
                  {copiedPersonal ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openWhatsApp(generatedLink, clientName, projectDetail)}
                  icon={<MessageSquare className="h-3.5 w-3.5 text-emerald-400" />}
                >
                  Send via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Generated Invites */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-frost-dim mb-2">
            Recent Client Invitations
          </h4>
          {loadingInvites ? (
            <div className="text-xs text-frost-dim py-2">Loading recent invitations...</div>
          ) : !invites || invites.length === 0 ? (
            <div className="text-xs text-frost-dim py-2">No personalized invitations generated yet.</div>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-white/6 rounded-lg border border-white/8 bg-night">
              {invites.map((inv) => {
                const url = `${publicBaseUrl}/review?token=${inv.token}`;
                return (
                  <div key={inv.id} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-frost truncate">
                          {inv.clientName || 'General Client'}
                        </span>
                        {inv.isUsed ? (
                          <Badge tone="success">
                            <UserCheck className="h-3 w-3" /> Submitted
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Pending</Badge>
                        )}
                      </div>
                      {inv.projectDetail && (
                        <div className="text-[0.7rem] text-frost-dim truncate">{inv.projectDetail}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(url)}
                        title="Copy Link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          openWhatsApp(url, inv.clientName || undefined, inv.projectDetail || undefined)
                        }
                        title="Share via WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
