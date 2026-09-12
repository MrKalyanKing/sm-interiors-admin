/** Mirrors the DTOs the API returns. Kept in one file so a backend change has
 *  exactly one place to land on this side. */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export type EnquiryStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'SITE_VISIT'
  | 'QUOTED'
  | 'WON'
  | 'LOST'
  | 'SPAM';

export type EnquirySource =
  | 'WEBSITE_FORM'
  | 'COST_ESTIMATOR'
  | 'WHATSAPP'
  | 'PHONE'
  | 'WALK_IN'
  | 'REFERRAL'
  | 'INSTAGRAM'
  | 'OTHER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Fields every ordered content row shares. */
export interface ContentBase {
  id: string;
  position: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Service extends ContentBase {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  points: string[];
}

export interface ProjectCategory extends ContentBase {
  slug: string;
  name: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnailPath?: string | null;
  url?: string;
  thumbnailUrl?: string | null;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  alt: string;
  folder: string;
  createdAt: string;
}

export interface Project extends ContentBase {
  slug: string;
  title: string;
  location: string;
  blurb: string;
  scope: string[];
  isFeatured: boolean;
  completedOn?: string | null;
  categoryId?: string | null;
  category?: ProjectCategory | null;
  imageId?: string | null;
  image?: MediaAsset | null;
  imageUrl?: string | null;
}

export interface Testimonial extends ContentBase {
  quote: string;
  name: string;
  detail: string;
  rating: number;
  source?: string;
  token?: string | null;
}

export interface ReviewInvite {
  id: string;
  token: string;
  clientName?: string | null;
  projectDetail?: string | null;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
}


export interface Faq extends ContentBase {
  question: string;
  answer: string;
  category: string;
}

export interface ProcessStep extends ContentBase {
  phase: string;
  title: string;
  description: string;
  duration: string;
}

export interface PromiseItem extends ContentBase {
  title: string;
  body: string;
  icon: string;
}

export interface Stat extends ContentBase {
  value: number;
  suffix: string;
  label: string;
}

export interface BeforeAfterPair extends ContentBase {
  title: string;
  caption: string;
  beforeImageId?: string | null;
  afterImageId?: string | null;
  beforeImage?: MediaAsset | null;
  afterImage?: MediaAsset | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
}

export interface EnquiryEstimate {
  homeSize: string;
  tier: string;
  low: number;
  high: number;
  lineItems: { label: string; amount: number }[];
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  location: string;
  scope: string;
  message: string;
  source: EnquirySource;
  status: EnquiryStatus;
  estimate?: EnquiryEstimate | null;
  internalNotes: string;
  assignedToId?: string | null;
  assignedTo?: AuthUser | null;
  contactedAt?: string | null;
  dealValue?: string | null;
  notificationSent: boolean;
  notificationError?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryStatistics {
  total: number;
  new: number;
  open: number;
  won: number;
  lost: number;
  thisMonth: number;
  previousMonth: number;
  monthOverMonthPct: number | null;
  conversionRatePct: number | null;
  byStatus: { status: EnquiryStatus; count: number }[];
  bySource: { source: EnquirySource; count: number }[];
  daily: { date: string; count: number }[];
}

export interface DashboardOverview {
  enquiries: EnquiryStatistics;
  recentEnquiries: Enquiry[];
  content: {
    projects: number;
    services: number;
    testimonials: number;
    faqs: number;
    mediaAssets: number;
    activeUsers: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: unknown;
  group: string;
  label: string;
  helpText: string;
  isPublic: boolean;
}

export interface EstimatorScope extends ContentBase {
  slug: string;
  label: string;
  baseCost: number;
}

export type EstimatorFactorKind = 'HOME_SIZE' | 'PACKAGE_TIER';

export interface EstimatorFactor extends ContentBase {
  kind: EstimatorFactorKind;
  slug: string;
  label: string;
  multiplier: number;
}
