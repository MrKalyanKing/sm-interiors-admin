import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  CheckCircle2,
  Image as ImageIcon,
  Inbox,
  Phone,
  SquareStack,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { ENQUIRY_SOURCE_LABELS, StatusBadge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, StatTile } from '@/components/ui/Card';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import { api, getErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import type { DashboardOverview } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>('/dashboard');
      return data;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <PageLoader label="Loading your dashboard" />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  if (!data) return null;

  const { enquiries, recentEnquiries, content } = data;

  const dailySeries = enquiries.daily.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    count: point.count,
  }));

  const sourceSeries = enquiries.bySource
    .map((row) => ({ name: ENQUIRY_SOURCE_LABELS[row.source] ?? row.source, count: row.count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good to see you, ${user?.name.split(' ')[0] ?? 'there'}`}
        description="Where the enquiries stand, and what is currently live on the website."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="New, not yet called"
          value={enquiries.new}
          hint={enquiries.new > 0 ? 'Call these first' : 'All caught up'}
          icon={<Inbox className="h-5 w-5" />}
          accent={enquiries.new > 0 ? 'warning' : 'success'}
        />
        <StatTile
          label="Open in the pipeline"
          value={enquiries.open}
          hint="Contacted through to quoted"
          icon={<Phone className="h-5 w-5" />}
        />
        <StatTile
          label="Enquiries this month"
          value={enquiries.thisMonth}
          trend={enquiries.monthOverMonthPct}
          hint={`vs ${enquiries.previousMonth} last month`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatTile
          label="Conversion rate"
          value={enquiries.conversionRatePct === null ? '—' : `${enquiries.conversionRatePct}%`}
          hint={`${enquiries.won} won · ${enquiries.lost} lost`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Enquiries, last 30 days"
            description="Spam submissions are excluded."
          />
          <CardBody className="pl-0 pr-3">
            {dailySeries.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-frost-dim">
                No enquiries in the last 30 days yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="enquiryFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#29ABE2" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#29ABE2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6B8299', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#6B8299', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0C1B2C',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#9DB4C9' }}
                    itemStyle={{ color: '#EAF4FB' }}
                    cursor={{ stroke: 'rgba(41,171,226,0.35)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Enquiries"
                    stroke="#29ABE2"
                    strokeWidth={2}
                    fill="url(#enquiryFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Where they come from" description="All time, excluding spam." />
          <CardBody className="pl-0 pr-3">
            {sourceSeries.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-frost-dim">Nothing to show yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={sourceSeries}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#6B8299', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fill: '#9DB4C9', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0C1B2C',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ fill: 'rgba(41,171,226,0.08)' }}
                  />
                  <Bar dataKey="count" name="Enquiries" fill="#29ABE2" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Needs a call"
            description="New and contacted enquiries, most recent first."
            action={
              <Link
                to="/enquiries"
                className="inline-flex items-center gap-1 text-xs font-medium text-azure-light hover:underline"
              >
                All enquiries <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {recentEnquiries.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing waiting"
              description="Every enquiry has been picked up. New ones land here the moment they arrive."
            />
          ) : (
            <ul className="divide-y divide-white/6">
              {recentEnquiries.map((enquiry) => (
                <li key={enquiry.id}>
                  <Link
                    to={`/enquiries/${enquiry.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-frost">
                          {enquiry.name}
                        </span>
                        <StatusBadge status={enquiry.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-frost-dim">
                        {enquiry.phone}
                        {enquiry.location && ` · ${enquiry.location}`}
                        {enquiry.scope && ` · ${enquiry.scope}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-frost-dim">
                      {formatRelative(enquiry.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Live on the website" />
          <CardBody className="space-y-3">
            <ContentCount to="/projects" icon={SquareStack} label="Projects in the gallery" value={content.projects} />
            <ContentCount to="/services" icon={TrendingUp} label="Services" value={content.services} />
            <ContentCount to="/testimonials" icon={CheckCircle2} label="Testimonials" value={content.testimonials} />
            <ContentCount to="/faqs" icon={Inbox} label="FAQs" value={content.faqs} />
            <ContentCount to="/media" icon={ImageIcon} label="Files in the library" value={content.mediaAssets} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

interface ContentCountProps {
  to: string;
  icon: typeof Inbox;
  label: string;
  value: number;
}

function ContentCount({ to, icon: Icon, label, value }: ContentCountProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3 transition-colors hover:border-white/16 hover:bg-white/[0.06]"
    >
      <Icon className="h-4 w-4 shrink-0 text-azure-light" />
      <span className="min-w-0 flex-1 truncate text-sm text-frost-muted">{label}</span>
      <span className="font-display text-sm font-bold text-frost">{value}</span>
    </Link>
  );
}
