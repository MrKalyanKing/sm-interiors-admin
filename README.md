# SM Interiors — Admin panel

Where the studio manages the website without a developer.

**React 18 · TypeScript · Tailwind CSS · Vite · TanStack Query · dnd-kit · Recharts**

---

## Quick start

```bash
npm install
cp .env.example .env      # point VITE_API_URL at the running API
npm run dev               # http://localhost:5174
```

Sign in with the account the backend's `npm run seed` created.

> The API must allow this origin. `CORS_ORIGINS` in the backend `.env` needs to include
> `http://localhost:5174`.

---

## What the studio can do here

| Screen | Purpose |
| --- | --- |
| **Dashboard** | New leads waiting, pipeline, 30-day trend, where enquiries come from |
| **Enquiries** | The sales pipeline: filter, search, call/WhatsApp in one tap, move through stages, add private notes, export CSV |
| **Work gallery** | Add a project with a photo, category, write-up and scope chips; drag to reorder; pin favourites |
| **Categories** | The filter buttons above the gallery |
| **Services** | The nine service cards, each with an icon, tagline and bullet points |
| **Before / after** | The drag-to-compare slider pairs |
| **Headline numbers** | The four counting figures under the hero |
| **Our process** | The step-by-step timeline |
| **Promises** | The commitments block |
| **Testimonials** | Customer reviews with a star rating |
| **FAQs** | Questions and answers |
| **Media library** | Drag-and-drop upload, alt text, folders |
| **Budget planner** | The rates behind the website's cost estimator |
| **Site settings** | Phone numbers, address, opening hours, social links, SEO, who gets enquiry emails |
| **Team** | Admin accounts and what each person may change |

Everything published here appears on the website within about a minute.

---

## Folder structure

```
src/
├── main.tsx                   Providers: query client, router, auth, toasts
├── App.tsx                    Routes and the role guards on them
│
├── lib/
│   ├── api.ts                 Axios instance, token storage, refresh-on-401
│   ├── format.ts              Indian currency, relative dates, file sizes
│   ├── queryClient.ts         Cache and retry policy
│   └── cn.ts                  Tailwind class merging
│
├── types/index.ts             Every API shape, in one file
│
├── components/
│   ├── layout/                AppShell (sidebar, mobile drawer), PageHeader
│   └── ui/                    Button, Field, Card, Modal, Badge, Feedback,
│                              IconPicker, TagsInput
│
└── features/
    ├── auth/                  AuthProvider, login screen, role checks
    ├── dashboard/             Charts and counts
    ├── enquiries/             List, filters, detail drawer, CSV export
    ├── content/               The generic CRUD engine (see below)
    ├── projects/              Work gallery, on top of that engine
    ├── media/                 Library page and the reusable MediaPicker
    ├── estimator/             Budget-planner rate card
    ├── settings/              Grouped, self-describing settings editor
    ├── users/                 Team management
    └── profile/               Own details and password
```

### The content engine

Eight of the content screens are the same screen. `features/content/` holds it:

- **`types.ts`** — a resource is a path, some labels, and a list of typed fields.
- **`resources.tsx`** — one config per section. This is where the fields, hints and
  row summaries live.
- **`ResourceForm.tsx`** — renders a form from the field spec (`text`, `textarea`,
  `number`, `select`, `tags`, `icon`, `image`, `toggle`, `date`).
- **`ResourcePage.tsx`** — list, search, drag-to-reorder, publish toggle, create/edit
  modal, delete confirmation.
- **`useResource.ts`** — the React Query hooks, shared by all of them.

Adding a new website section is a config object in `resources.tsx` and a route in
`App.tsx`. It is also why every content screen behaves identically, which matters more
for a non-technical user than any individual screen does.

---

## Notes for whoever maintains this

**Auth.** Access tokens live in `localStorage` and are short-lived; refresh tokens rotate
on every use. A 401 triggers a single shared refresh — concurrent requests wait on the
same promise, because firing several refreshes at once would look like token replay to
the API and drop the whole session.

**Roles.** `useAuth().can('ADMIN')` mirrors the backend's rank check. It decides what the
sidebar shows and which routes render — but it is only cosmetic. The API enforces the
same rules again, which is the enforcement that counts.

**Images.** Uploads are converted to WebP and capped at 2000px by the API, so the studio
can upload straight off a phone without thinking about it.

**Icons.** `components/ui/IconPicker.tsx` holds a curated map of ~57 lucide icons. It is
deliberately not the whole library — importing all of them cost about 800 KB. The
website has a matching map in `src/shared/lib/lucideIcons.ts`; **add a new icon to both**
or it will render as a blank square on the live site.

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on port 5174 |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run typecheck` | Types only |

---

## Deploying

It is a static SPA — any static host works (Netlify, Vercel, Nginx, S3 + CloudFront).

- Build with `VITE_API_URL` pointing at the production API.
- Configure the host to rewrite all paths to `/index.html`, or deep links like
  `/enquiries/abc` will 404 on refresh.
- Add the admin domain to the API's `CORS_ORIGINS`.
- Keep it off search engines — `index.html` already sends `noindex, nofollow`.
