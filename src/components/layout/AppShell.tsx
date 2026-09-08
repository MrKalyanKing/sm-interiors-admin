import {
  BadgeCheck,
  Calculator,
  ChevronsUpDown,
  ExternalLink,
  Image,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareQuote,
  Route,
  Settings,
  Sparkles,
  SquareStack,
  Tags,
  TrendingUp,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Minimum role. Omitted means every signed-in user. */
  role?: Role;
  end?: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, role: 'ADMIN', end: true },
      { to: '/enquiries', label: 'Enquiries', icon: Inbox, role: 'ADMIN' },
    ],
  },
  {
    heading: 'Website content',
    items: [
      { to: '/projects', label: 'Work gallery', icon: SquareStack },
      { to: '/categories', label: 'Categories', icon: Tags },
      { to: '/services', label: 'Services', icon: Sparkles },
      { to: '/before-after', label: 'Before / after', icon: Image },
      { to: '/stats', label: 'Headline numbers', icon: TrendingUp },
      { to: '/process', label: 'Our process', icon: Route },
      { to: '/promises', label: 'Promises', icon: BadgeCheck },
      { to: '/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { to: '/faqs', label: 'FAQs', icon: ListChecks },
      { to: '/media', label: 'Media library', icon: Image },
    ],
  },
  {
    heading: 'Configuration',
    items: [
      { to: '/estimator', label: 'Budget planner', icon: Calculator, role: 'ADMIN' },
      { to: '/settings', label: 'Site settings', icon: Settings, role: 'ADMIN' },
      { to: '/team', label: 'Team', icon: Users, role: 'SUPER_ADMIN' },
    ],
  },
];

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173';

export function AppShell() {
  const { user, logout, can } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Navigating on a phone should close the drawer behind you.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile scrim ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-night/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-white/8 bg-night-soft/95 backdrop-blur-2xl transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <div className="font-display text-base font-extrabold uppercase tracking-[0.14em] text-frost">
            SM <span className="azure-text">Interiors</span>
          </div>
          <button
            className="rounded-lg p-1.5 text-frost-dim hover:bg-white/8 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => {
            const visible = group.items.filter((item) => !item.role || can(item.role));
            if (visible.length === 0) return null;

            return (
              <div key={group.heading} className="mb-5">
                <p className="kicker px-3 pb-2">{group.heading}</p>
                <ul className="space-y-0.5">
                  {visible.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-azure/12 font-medium text-azure-light ring-1 ring-azure/20'
                              : 'text-frost-muted hover:bg-white/[0.06] hover:text-frost',
                          )
                        }
                      >
                        <item.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/8 p-3">
          <a
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-frost-dim transition-colors hover:bg-white/[0.06] hover:text-frost"
          >
            <ExternalLink className="h-4 w-4" />
            View the live website
          </a>
          <UserMenu name={user?.name ?? ''} email={user?.email ?? ''} onLogout={logout} />
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[17rem]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/8 bg-night/80 px-4 backdrop-blur-xl lg:hidden">
          <button
            className="rounded-lg p-2 text-frost hover:bg-white/8"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-frost">
            SM <span className="azure-text">Interiors</span>
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface UserMenuProps {
  name: string;
  email: string;
  onLogout: () => void;
}

function UserMenu({ name, email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="glass-raised absolute bottom-full left-0 mb-2 w-full animate-scale-in overflow-hidden rounded-xl p-1">
          <NavLink
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-frost-muted transition-colors hover:bg-white/[0.07] hover:text-frost"
          >
            <UserCircle className="h-4 w-4" />
            Your profile
          </NavLink>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-azure/15 text-xs font-semibold text-azure-light ring-1 ring-azure/25">
          {initials(name) || '?'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-frost">{name}</span>
          <span className="block truncate text-xs text-frost-dim">{email}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-frost-dim" />
      </button>
    </div>
  );
}
