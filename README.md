# Mindly — AI-powered Mind Map Planner

Plan projects visually. Drop nodes onto an infinite canvas, track budgets, deadlines, and locations, and let Claude expand your thinking.

## Features

- **Infinite canvas** — zoom, pan, and arrange nodes freely with React Flow
- **Six node types** — Idea, Task (due date + completion), Budget (amount + currency), Place, Event (date + location), and a root Project node
- **AI expand** — select any node and Claude suggests 3 child ideas automatically
- **Custom AI generation** — type a plain-language instruction and Claude creates a typed cluster of nodes linked to your selection
- **Cloud persistence** — maps are saved to Supabase per user account
- **Maps dashboard** — create, rename, open, and delete maps from one place
- **Dark theme** — purple/blue glow aesthetic throughout

## Tech stack

| Layer | Library |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Canvas | React Flow (`@xyflow/react`) |
| State | Zustand (with `persist` middleware) |
| AI | Claude via `@anthropic-ai/sdk` |
| Database / Auth | Supabase |
| Styles | Tailwind CSS |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |

### 3. Set up the Supabase database

Run this SQL in your Supabase project (SQL editor):

```sql
create table maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled map',
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- Row-level security: users can only see and edit their own maps
alter table maps enable row level security;

create policy "Users read own maps"
  on maps for select using (auth.uid() = user_id);

create policy "Users insert own maps"
  on maps for insert with check (auth.uid() = user_id);

create policy "Users update own maps"
  on maps for update using (auth.uid() = user_id);

create policy "Users delete own maps"
  on maps for delete using (auth.uid() = user_id);
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── auth/
│   │   ├── login/page.tsx        # Sign in
│   │   └── signup/page.tsx       # Sign up
│   ├── maps/
│   │   └── page.tsx              # Maps dashboard
│   ├── mindmap/
│   │   └── [id]/page.tsx         # Canvas for a specific map
│   └── api/ai/
│       ├── expand/route.ts       # Default AI expand (3 child ideas)
│       └── generate/route.ts     # Custom instruction → typed nodes
├── components/
│   ├── landing/                  # Nav, Hero, Features, Process, FAQ
│   └── mindmap/
│       ├── Canvas.tsx            # React Flow wrapper + save button
│       ├── Toolbar.tsx           # Add-node toolbar
│       ├── NodeEditor.tsx        # Right panel — edit + AI assist
│       └── nodes/                # RootNode, IdeaNode, TaskNode, …
└── lib/
    ├── types.ts                  # MindNode, MindEdge, NodeKind
    ├── store.ts                  # Zustand store
    ├── maps.ts                   # Supabase map CRUD helpers
    ├── supabase.ts               # Supabase client
    ├── auth.ts                   # useUser hook
    └── ai.ts                     # Claude client
```

## How the AI works

### Expand (automatic)
Select any node → click **✦ Expand with Claude** in the right panel. Claude reads the node's title, description, and type, then returns 3 child ideas as JSON. They are placed in a circle around the parent and connected with animated edges.

### Generate (custom instruction)
Select any node → type a plain-language instruction in the **Custom instruction** box, e.g.:
- *"give me 5 tasks to prepare a product launch"*
- *"suggest budget line items for a dev team of 4"*
- *"list 3 European cities for the event"*

Press **✦ Generate nodes** (or `⌘↵`). Claude picks the right node type for each item and connects them to your selection.

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```