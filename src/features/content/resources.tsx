import {
  BadgeCheck,
  Image as ImageIcon,
  ListChecks,
  MessageSquareQuote,
  Route,
  Sparkles,
  Star,
  Tags,
  TrendingUp,
} from 'lucide-react';
import { renderLucideIcon } from '@/components/ui/IconPicker';
import { mediaThumb } from '@/features/media/useMedia';
import { truncate } from '@/lib/format';
import type {
  BeforeAfterPair,
  Faq,
  ProcessStep,
  ProjectCategory,
  PromiseItem,
  Service,
  Stat,
  Testimonial,
} from '@/types';
import type { ResourceConfig } from './types';

/** Small azure tile showing the lucide icon a row is configured with. */
function IconTile({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-azure/10 text-azure-light ring-1 ring-azure/20">
      {renderLucideIcon(name, 'h-[1.1rem] w-[1.1rem]')}
    </span>
  );
}

export const servicesConfig: ResourceConfig<Service> = {
  path: 'services',
  title: 'Services',
  singular: 'Service',
  icon: Sparkles,
  description:
    'The service cards on the homepage. Each one shows a title, a one-line tagline and up to three bullet points.',
  thumbnail: (row) => <IconTile name={row.icon} />,
  primary: (row) => row.title,
  secondary: (row) => row.tagline || truncate(row.description, 90),
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 160, half: true },
    {
      name: 'tagline',
      label: 'Tagline',
      type: 'text',
      maxLength: 200,
      half: true,
      placeholder: 'Smart workflows for modern kitchens',
      hint: 'One short line under the title.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      rows: 4,
      hint: 'Two or three sentences. Say what the customer actually gets.',
    },
    {
      name: 'points',
      label: 'Bullet points',
      type: 'tags',
      hint: 'Up to 8 short points, e.g. "Tall units & corner solutions".',
    },
    { name: 'icon', label: 'Icon', type: 'icon' },
    {
      name: 'slug',
      label: 'URL slug',
      type: 'text',
      half: true,
      hint: 'Leave blank and it is made from the title.',
    },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true, half: true },
  ],
};

export const categoriesConfig: ResourceConfig<ProjectCategory> = {
  path: 'project-categories',
  title: 'Work categories',
  singular: 'Category',
  icon: Tags,
  description:
    'The filter buttons above the work gallery. Add one here before you can file a project under it.',
  primary: (row) => row.name,
  secondary: (row) => `/${row.slug}`,
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120, half: true },
    {
      name: 'slug',
      label: 'URL slug',
      type: 'text',
      half: true,
      hint: 'Leave blank and it is made from the name.',
    },
    { name: 'isPublished', label: 'Show as a filter', type: 'toggle', defaultValue: true },
  ],
};

export const testimonialsConfig: ResourceConfig<Testimonial> = {
  path: 'testimonials',
  title: 'Testimonials',
  singular: 'Testimonial',
  icon: MessageSquareQuote,
  description: 'What past customers said. Use their own words — polished quotes read as fake.',
  primary: (row) => row.name,
  secondary: (row) => truncate(row.quote, 110),
  thumbnail: (row) => (
    <span className="flex h-10 w-10 items-center justify-center gap-0.5 rounded-lg bg-warning/10 text-warning ring-1 ring-warning/20">
      <Star className="h-3.5 w-3.5 fill-current" />
      <span className="text-xs font-semibold">{row.rating}</span>
    </span>
  ),
  fields: [
    { name: 'name', label: 'Customer name', type: 'text', required: true, half: true },
    {
      name: 'detail',
      label: 'Detail',
      type: 'text',
      half: true,
      placeholder: '2 BHK · Sri Rama Puram',
      hint: 'Home size and area. Specifics make it believable.',
    },
    { name: 'quote', label: 'What they said', type: 'textarea', required: true, rows: 4 },
    {
      name: 'rating',
      label: 'Rating',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 5,
      half: true,
    },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true, half: true },
  ],
};

export const faqsConfig: ResourceConfig<Faq> = {
  path: 'faqs',
  title: 'FAQs',
  singular: 'FAQ',
  icon: ListChecks,
  description:
    'Questions customers actually ask on the phone. Answering them here saves the same call twice.',
  primary: (row) => row.question,
  secondary: (row) => truncate(row.answer, 110),
  fields: [
    { name: 'question', label: 'Question', type: 'text', required: true, maxLength: 300 },
    { name: 'answer', label: 'Answer', type: 'textarea', required: true, rows: 5 },
    {
      name: 'category',
      label: 'Group',
      type: 'text',
      half: true,
      defaultValue: 'General',
      placeholder: 'Pricing',
    },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true, half: true },
  ],
};

export const processConfig: ResourceConfig<ProcessStep> = {
  path: 'process-steps',
  title: 'Our process',
  singular: 'Step',
  icon: Route,
  description: 'The step-by-step timeline from first visit to handover.',
  thumbnail: (row) => (
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-azure/10 font-display text-sm font-bold text-azure-light ring-1 ring-azure/20">
      {row.phase}
    </span>
  ),
  primary: (row) => row.title,
  secondary: (row) => row.duration || truncate(row.description, 90),
  fields: [
    {
      name: 'phase',
      label: 'Step number',
      type: 'text',
      required: true,
      maxLength: 8,
      half: true,
      placeholder: '01',
    },
    {
      name: 'duration',
      label: 'How long',
      type: 'text',
      half: true,
      placeholder: 'Week 1–3',
    },
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 180 },
    { name: 'description', label: 'Description', type: 'textarea', required: true, rows: 4 },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true },
  ],
};

export const promisesConfig: ResourceConfig<PromiseItem> = {
  path: 'promises',
  title: 'Our promises',
  singular: 'Promise',
  icon: BadgeCheck,
  description:
    'The commitments block. Only put things here you are happy to be held to — a specific promise builds more trust than "quality assured".',
  thumbnail: (row) => <IconTile name={row.icon} />,
  primary: (row) => row.title,
  secondary: (row) => truncate(row.body, 110),
  fields: [
    { name: 'title', label: 'Promise', type: 'text', required: true, maxLength: 180 },
    { name: 'body', label: 'What it means', type: 'textarea', required: true, rows: 3 },
    { name: 'icon', label: 'Icon', type: 'icon' },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true },
  ],
};

export const statsConfig: ResourceConfig<Stat> = {
  path: 'stats',
  title: 'Headline numbers',
  singular: 'Number',
  icon: TrendingUp,
  description:
    'The four counting figures under the hero. Keep them true — they are the first claim a visitor reads.',
  thumbnail: (row) => (
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-azure/10 font-display text-sm font-bold text-azure-light ring-1 ring-azure/20">
      {row.value}
    </span>
  ),
  primary: (row) => row.label,
  secondary: (row) => `Counts up to ${row.value}${row.suffix}`,
  fields: [
    { name: 'value', label: 'Number', type: 'number', required: true, min: 0, half: true },
    {
      name: 'suffix',
      label: 'Suffix',
      type: 'text',
      half: true,
      maxLength: 16,
      placeholder: '+',
      hint: 'Shown in azure after the number, e.g. "+" or " wk".',
    },
    { name: 'label', label: 'Label', type: 'text', required: true, maxLength: 120 },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true },
  ],
};

export const beforeAfterConfig: ResourceConfig<BeforeAfterPair> = {
  path: 'before-after',
  title: 'Before / after',
  singular: 'Pair',
  icon: ImageIcon,
  description:
    'The drag-to-compare slider. Both photos should be the same room from the same spot, or the effect falls apart.',
  thumbnail: (row) => {
    const src = row.afterImage ? mediaThumb(row.afterImage) : (row.afterImageUrl ?? '');
    return src ? (
      <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10" />
    ) : (
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-frost-dim">
        <ImageIcon className="h-4 w-4" />
      </span>
    );
  },
  primary: (row) => row.title,
  secondary: (row) => truncate(row.caption, 110),
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 180 },
    { name: 'caption', label: 'Caption', type: 'textarea', rows: 2 },
    { name: 'beforeImageId', label: 'Before photo', type: 'image', half: true },
    { name: 'afterImageId', label: 'After photo', type: 'image', half: true },
    { name: 'isPublished', label: 'Show on the website', type: 'toggle', defaultValue: true },
  ],
};
