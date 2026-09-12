import { ImageOff, SquareStack, Star } from 'lucide-react';
import { useState } from 'react';
import { ResourcePage } from '@/features/content/ResourcePage';
import type { ResourceConfig } from '@/features/content/types';
import { mediaThumb, resolveResourceImageUrl } from '@/features/media/useMedia';
import { truncate } from '@/lib/format';
import type { Project } from '@/types';

function ProjectThumbnail({ src, isFeatured }: { src: string; isFeatured?: boolean }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/5 text-frost-dim ring-1 ring-white/10">
        <ImageOff className="h-4 w-4" />
      </span>
    );
  }

  return (
    <div className="relative">
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setError(true)}
        className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
      />
      {isFeatured && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-warning text-night">
          <Star className="h-2.5 w-2.5 fill-current" />
        </span>
      )}
    </div>
  );
}

const config: ResourceConfig<Project> = {
  path: 'projects',
  title: 'Work gallery',
  singular: 'Project',
  icon: SquareStack,
  description:
    'Completed jobs, shown in the gallery on your homepage. Featured projects are pinned to the front.',
  emptyHint:
    'Add a handover photo, a short write-up and the category it belongs to. Portrait photos (4:5) crop best.',
  thumbnail: (row) => {
    const src = row.image ? mediaThumb(row.image) : resolveResourceImageUrl(row.imageUrl);
    return <ProjectThumbnail src={src} isFeatured={row.isFeatured} />;
  },
  primary: (row) => row.title,
  secondary: (row) =>
    [row.category?.name, row.location, truncate(row.blurb, 60)].filter(Boolean).join(' · '),
  fields: [
    { name: 'title', label: 'Project title', type: 'text', required: true, maxLength: 180 },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      optionsKey: 'project-categories',
      half: true,
      hint: 'Sets which filter chip it appears under.',
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      half: true,
      defaultValue: 'Bhimavaram',
      placeholder: 'Sri Rama Puram, Bhimavaram',
      hint: 'Town or neighborhood of the project.',
    },
    {
      name: 'imageId',
      label: 'Photo',
      type: 'image',
      hint: 'Shoot or crop to 4:5 portrait. Large photos are resized automatically.',
    },
    {
      name: 'blurb',
      label: 'Write-up',
      type: 'textarea',
      rows: 3,
      hint: 'One or two sentences describing what you built and why.',
    },
    {
      name: 'scope',
      label: 'What was done',
      type: 'tags',
      hint: 'Short chips, e.g. "Sage laminate shutters", "Tall units".',
    },
    {
      name: 'completedOn',
      label: 'Completed on',
      type: 'date',
      half: true,
    },
    {
      name: 'isFeatured',
      label: 'Pin to the front of the gallery',
      type: 'toggle',
      half: true,
    },
    {
      name: 'slug',
      label: 'URL slug',
      type: 'text',
      half: true,
      hint: 'Leave blank and it is made from the title.',
    },
    {
      name: 'isPublished',
      label: 'Show on the website',
      type: 'toggle',
      defaultValue: true,
      half: true,
    },
  ],
};

export function ProjectsPage() {
  return <ResourcePage config={config} />;
}
