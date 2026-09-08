import {
  Award,
  BadgeCheck,
  Bed,
  Blocks,
  Box,
  Boxes,
  Building2,
  CalendarCheck,
  Calculator,
  ChefHat,
  ClipboardCheck,
  Clock,
  Columns3,
  CookingPot,
  DoorOpen,
  Drill,
  Droplets,
  Grid2x2,
  Hammer,
  HandHeart,
  Headset,
  Home,
  IndianRupee,
  Lamp,
  Layers,
  Layers3,
  Lightbulb,
  ListChecks,
  type LucideIcon,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PaintRoller,
  Paintbrush,
  Palette,
  PencilRuler,
  Phone,
  Receipt,
  Rows3,
  Ruler,
  Scan,
  Search,
  ShieldCheck,
  Sofa,
  Sparkles,
  Square,
  Star,
  Sun,
  ThumbsUp,
  Timer,
  TreePine,
  TrendingUp,
  Users,
  Wallet,
  Wallpaper,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { FieldShell } from './Field';

/**
 * A curated set rather than the whole lucide library. Importing all 1,500 icons
 * added roughly 800 KB to the bundle, and nobody choosing an icon for "Modular
 * kitchen" needs `Bitcoin` in the list. The names match what the website's
 * renderer expects, so adding one here is the only step needed to offer it.
 */
export const ICON_LIBRARY: Record<string, LucideIcon> = {
  Home, Building2, DoorOpen, Sofa, Bed, Lamp, CookingPot, ChefHat,
  Boxes, Package, Layers, Layers3, Rows3, Columns3, Grid2x2, Blocks, Box,
  PaintRoller, Paintbrush, Palette, Wallpaper, Ruler, PencilRuler,
  Hammer, Wrench, Drill, Scan,
  Sparkles, Star, BadgeCheck, ShieldCheck, Award, ThumbsUp,
  ClipboardCheck, ListChecks, CalendarCheck, Clock, Timer,
  IndianRupee, Wallet, Receipt, Calculator, TrendingUp,
  Headset, Phone, MessageSquare, Mail, MapPin, Users, HandHeart,
  Waves, Droplets, Sun, Lightbulb, Zap, Wind, TreePine,
};

const ICON_NAMES = Object.keys(ICON_LIBRARY);

/** Renders a lucide icon by name, falling back to a neutral square. */
export function renderLucideIcon(name: string | undefined, className?: string) {
  const Icon = name ? ICON_LIBRARY[name] : undefined;
  if (!Icon) return <Square className={className} />;
  return <Icon className={className} />;
}

interface IconPickerProps {
  value?: string;
  onChange: (name: string) => void;
  label?: string;
  hint?: string;
  error?: string;
}

export function IconPicker({ value, onChange, label, hint, error }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ICON_NAMES;
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(term));
  }, [search]);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <div className="rounded-xl border border-white/10 bg-night-raised/50 p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-azure/12 text-azure-light ring-1 ring-azure/25">
            {renderLucideIcon(value, 'h-5 w-5')}
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-frost-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={value ? `Selected: ${value}` : 'Search icons'}
              className="w-full rounded-lg border border-white/10 bg-night-raised/70 py-2 pl-9 pr-3 text-xs text-frost placeholder:text-frost-dim/70 focus:border-azure/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="no-scrollbar grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto sm:grid-cols-10">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              className={cn(
                'grid aspect-square place-items-center rounded-lg transition-colors',
                value === name
                  ? 'bg-azure/20 text-azure-light ring-1 ring-azure/40'
                  : 'text-frost-muted hover:bg-white/[0.07] hover:text-frost',
              )}
            >
              {renderLucideIcon(name, 'h-4 w-4')}
            </button>
          ))}
          {results.length === 0 && (
            <p className="col-span-full py-4 text-center text-xs text-frost-dim">
              No icon matches “{search}”.
            </p>
          )}
        </div>
      </div>
    </FieldShell>
  );
}
