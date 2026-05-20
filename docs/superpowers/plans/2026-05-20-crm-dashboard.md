# CRM Dashboard with Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user CRM web app with Supabase authentication, a client management table, and a Kanban sales pipeline dashboard.

**Architecture:** Next.js 14 App Router with route groups separating auth `(auth)` and protected `(dashboard)` routes. Supabase handles authentication and PostgreSQL storage. Middleware enforces session checks on all dashboard routes. The Kanban pipeline is a client component using @hello-pangea/dnd for drag-and-drop.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Auth + PostgreSQL), Tailwind CSS, shadcn/ui, @hello-pangea/dnd, Vitest, React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `middleware.ts` | Redirect unauthenticated users to /login |
| `app/layout.tsx` | Root HTML shell |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(dashboard)/layout.tsx` | Dashboard shell with sidebar |
| `app/(dashboard)/page.tsx` | Dashboard metrics (server component) |
| `app/(dashboard)/clients/page.tsx` | Clients management page |
| `app/(dashboard)/pipeline/page.tsx` | Kanban pipeline page |
| `app/api/auth/callback/route.ts` | Supabase auth callback |
| `components/auth/login-form.tsx` | Login form (client component) |
| `components/layout/sidebar.tsx` | Navigation sidebar (client component) |
| `components/dashboard/metric-card.tsx` | Single metric display card |
| `components/clients/clients-table.tsx` | Clients data table |
| `components/clients/client-form.tsx` | Add/edit client modal form |
| `components/pipeline/kanban-board.tsx` | Full Kanban board (client component) |
| `components/pipeline/kanban-column.tsx` | Single Kanban column with droppable |
| `components/pipeline/deal-card.tsx` | Draggable deal card |
| `components/pipeline/deal-form.tsx` | Add/edit deal modal form |
| `lib/types.ts` | Shared TypeScript interfaces and constants |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client (SSR cookies) |
| `supabase/migrations/20260520_initial.sql` | DB schema: clients + deals tables with RLS |

---

### Task 1: Project Initialization

**Files:**
- Create: project root (via `create-next-app`)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Create Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
```
Answer prompts: Yes to TypeScript, Yes to Tailwind, Yes to ESLint, Yes to App Router, No to src/ directory, `@/*` for import alias.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @hello-pangea/dnd lucide-react
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
Choose: Default style, Slate color scheme, yes to CSS variables.

Then add required components:
```bash
npx shadcn@latest add button input label card table dialog badge
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test scripts to package.json**

In `package.json`, inside `"scripts"`, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Run smoke test to confirm setup**

```bash
npm run test:run
```
Expected: exits 0, "No test files found" or similar.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 14 project with Supabase and testing setup"
```

---

### Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `.env.local`
- Create: `supabase/migrations/20260520_initial.sql`

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com, sign in, create a new project. Wait for provisioning to complete (~2 minutes).

From Project Settings → API, copy:
- Project URL (format: `https://<ref>.supabase.co`)
- Anon public key

- [ ] **Step 2: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Verify `.env.local` is listed in `.gitignore` (create-next-app adds it automatically).

- [ ] **Step 3: Create the database migration file**

Create `supabase/migrations/20260520_initial.sql`:

```sql
create extension if not exists "uuid-ossp";

create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz default now() not null
);

create table deals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  title text not null,
  value numeric(12,2) default 0 not null,
  stage text not null check (stage in ('prospeccao','qualificacao','proposta','negociacao','fechado')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

alter table clients enable row level security;
alter table deals enable row level security;

create policy "authenticated_all" on clients
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on deals
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 4: Run the migration**

In the Supabase dashboard, go to SQL Editor, paste the full content of `20260520_initial.sql`, and click Run.

Expected: "Success. No rows returned."

- [ ] **Step 5: Create the single user**

In Supabase dashboard: Authentication → Users → Add user → Create new user.
Set email and password. This is the only account for the system.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with clients and deals tables"
```

---

### Task 3: TypeScript Types & Supabase Clients

**Files:**
- Create: `lib/types.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Test: `lib/__tests__/types.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { Client, Deal } from '../types'
import { DEAL_STAGES, STAGE_LABELS } from '../types'

describe('types', () => {
  it('DEAL_STAGES has all five stages', () => {
    expect(DEAL_STAGES).toHaveLength(5)
    expect(DEAL_STAGES).toContain('prospeccao')
    expect(DEAL_STAGES).toContain('fechado')
  })

  it('STAGE_LABELS covers all stages', () => {
    DEAL_STAGES.forEach(stage => {
      expect(STAGE_LABELS[stage]).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run lib/__tests__/types.test.ts
```
Expected: FAIL — cannot find module `../types`

- [ ] **Step 3: Create lib/types.ts**

```typescript
export type DealStage = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado'

export const DEAL_STAGES: DealStage[] = [
  'prospeccao',
  'qualificacao',
  'proposta',
  'negociacao',
  'fechado',
]

export const STAGE_LABELS: Record<DealStage, string> = {
  prospeccao: 'Prospecção',
  qualificacao: 'Qualificação',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  created_at: string
}

export interface Deal {
  id: string
  client_id: string
  title: string
  value: number
  stage: DealStage
  created_at: string
  updated_at: string
  client?: Client
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run lib/__tests__/types.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Create lib/supabase/client.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 6: Create lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/
git commit -m "feat: add TypeScript types and Supabase client utilities"
```

---

### Task 4: Auth Middleware & Callback Route

**Files:**
- Create: `middleware.ts`
- Create: `app/api/auth/callback/route.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

- [ ] **Step 2: Create app/api/auth/callback/route.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts app/api/
git commit -m "feat: add auth middleware and Supabase callback route"
```

---

### Task 5: Root Layout & Login Page

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `components/auth/login-form.tsx`
- Test: `components/__tests__/login-form.test.tsx`

- [ ] **Step 1: Write failing test for LoginForm**

Create `components/__tests__/login-form.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../auth/login-form'

const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword: mockSignIn } }),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email and password fields with submit button', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/senha/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
    })
  })

  it('redirects to / on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/senha/i), 'correct')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run components/__tests__/login-form.test.tsx
```
Expected: FAIL — cannot find module `../auth/login-form`

- [ ] **Step 3: Create components/auth/login-form.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciais inválidas. Verifique seu email e senha.')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run components/__tests__/login-form.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Update app/layout.tsx**

Replace the entire file content with:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRM',
  description: 'CRM Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Create app/(auth)/login/page.tsx**

```typescript
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">CRM</h1>
        <LoginForm />
      </div>
    </main>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/ components/auth/ components/__tests__/
git commit -m "feat: add login page with Supabase auth form"
```

---

### Task 6: Dashboard Layout & Sidebar

**Files:**
- Create: `components/layout/sidebar.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Test: `components/__tests__/sidebar.test.tsx`

- [ ] **Step 1: Write failing test for Sidebar**

Create `components/__tests__/sidebar.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../layout/sidebar'

const mockSignOut = vi.fn()
const mockPush = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))

describe('Sidebar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all navigation links', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Sidebar />)
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('calls signOut and redirects to /login on logout', async () => {
    mockSignOut.mockResolvedValue({})
    const user = userEvent.setup()
    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: /sair/i }))

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run components/__tests__/sidebar.test.tsx
```
Expected: FAIL — cannot find module `../layout/sidebar`

- [ ] **Step 3: Create components/layout/sidebar.tsx**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Kanban, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 h-screen bg-white border-r flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">CRM</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run components/__tests__/sidebar.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Create app/(dashboard)/layout.tsx**

```typescript
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/layout/ components/__tests__/sidebar.test.tsx app/
git commit -m "feat: add sidebar navigation and dashboard layout"
```

---

### Task 7: Dashboard Metrics Page

**Files:**
- Create: `components/dashboard/metric-card.tsx`
- Create: `app/(dashboard)/page.tsx`
- Test: `components/__tests__/metric-card.test.tsx`

- [ ] **Step 1: Write failing test for MetricCard**

Create `components/__tests__/metric-card.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '../dashboard/metric-card'

describe('MetricCard', () => {
  it('renders title and numeric value', () => {
    render(<MetricCard title="Total de Clientes" value={42} />)
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value (currency)', () => {
    render(<MetricCard title="Valor do Pipeline" value="R$ 150.000,00" />)
    expect(screen.getByText('R$ 150.000,00')).toBeInTheDocument()
  })

  it('renders optional description', () => {
    render(<MetricCard title="Fechados" value={3} description="no mês atual" />)
    expect(screen.getByText('no mês atual')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run components/__tests__/metric-card.test.tsx
```
Expected: FAIL — cannot find module `../dashboard/metric-card`

- [ ] **Step 3: Create components/dashboard/metric-card.tsx**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
}

export function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run components/__tests__/metric-card.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Create app/(dashboard)/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/metric-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: clientCount },
    { data: deals },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('value, stage, created_at'),
  ])

  const activeDeals = deals?.filter(d => d.stage !== 'fechado') ?? []
  const pipelineValue = activeDeals.reduce((sum, d) => sum + Number(d.value), 0)

  const now = new Date()
  const closedThisMonth = deals?.filter(d => {
    if (d.stage !== 'fechado') return false
    const created = new Date(d.created_at)
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    )
  }).length ?? 0

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total de Clientes" value={clientCount ?? 0} />
        <MetricCard title="Negócios Ativos" value={activeDeals.length} />
        <MetricCard title="Valor do Pipeline" value={fmt.format(pipelineValue)} />
        <MetricCard
          title="Fechados no Mês"
          value={closedThisMonth}
          description={now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/ components/__tests__/metric-card.test.tsx app/
git commit -m "feat: add dashboard metrics page with Supabase data"
```

---

### Task 8: Clients Management

**Files:**
- Create: `components/clients/clients-table.tsx`
- Create: `components/clients/client-form.tsx`
- Create: `app/(dashboard)/clients/page.tsx`
- Test: `components/__tests__/clients-table.test.tsx`
- Test: `components/__tests__/client-form.test.tsx`

- [ ] **Step 1: Write failing test for ClientsTable**

Create `components/__tests__/clients-table.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientsTable } from '../clients/clients-table'
import type { Client } from '@/lib/types'

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Empresa Alpha',
    email: 'alpha@alpha.com',
    phone: '11999999999',
    company: 'Alpha Ltda',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('ClientsTable', () => {
  it('renders client rows with all columns', () => {
    render(<ClientsTable clients={mockClients} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.getByText('Alpha Ltda')).toBeInTheDocument()
    expect(screen.getByText('alpha@alpha.com')).toBeInTheDocument()
  })

  it('renders empty state message when no clients', () => {
    render(<ClientsTable clients={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/nenhum cliente/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write failing test for ClientForm**

Create `components/__tests__/client-form.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from '../clients/client-form'

describe('ClientForm', () => {
  it('renders name, company, email and phone fields', () => {
    render(<ClientForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
  })

  it('calls onSubmit with entered data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/nome/i), 'João Silva')
    await user.type(screen.getByLabelText(/empresa/i), 'Silva Corp')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Silva', company: 'Silva Corp' })
    )
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run components/__tests__/clients-table.test.tsx components/__tests__/client-form.test.tsx
```
Expected: FAIL — cannot find modules

- [ ] **Step 4: Create components/clients/clients-table.tsx**

```typescript
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Client } from '@/lib/types'

interface ClientsTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
}

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  if (clients.length === 0) {
    return <p className="text-gray-500 text-center py-8">Nenhum cliente cadastrado.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.company ?? '—'}</TableCell>
            <TableCell>{client.email ?? '—'}</TableCell>
            <TableCell>{client.phone ?? '—'}</TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => onDelete(client.id)}
              >
                Remover
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 5: Create components/clients/client-form.tsx**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '@/lib/types'

type ClientFormData = Pick<Client, 'name' | 'email' | 'phone' | 'company' | 'notes'>

interface ClientFormProps {
  initial?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => void
  onCancel: () => void
}

export function ClientForm({ initial = {}, onSubmit, onCancel }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>({
    name: initial.name ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    company: initial.company ?? '',
    notes: initial.notes ?? '',
  })

  function field(key: keyof ClientFormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cf-name">Nome *</Label>
        <Input id="cf-name" value={form.name} onChange={field('name')} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-company">Empresa</Label>
        <Input id="cf-company" value={form.company ?? ''} onChange={field('company')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-email">Email</Label>
        <Input id="cf-email" type="email" value={form.email ?? ''} onChange={field('email')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-phone">Telefone</Label>
        <Input id="cf-phone" value={form.phone ?? ''} onChange={field('phone')} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run components/__tests__/clients-table.test.tsx components/__tests__/client-form.test.tsx
```
Expected: PASS (4 tests total)

- [ ] **Step 7: Create app/(dashboard)/clients/page.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClientsTable } from '@/components/clients/clients-table'
import { ClientForm } from '@/components/clients/client-form'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

type ClientFormData = Pick<Client, 'name' | 'email' | 'phone' | 'company' | 'notes'>

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(data: ClientFormData) {
    if (editing) {
      await supabase.from('clients').update(data).eq('id', editing.id)
    } else {
      await supabase.from('clients').insert(data)
    }
    setDialogOpen(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este cliente? Os negócios vinculados também serão removidos.')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  function openEdit(client: Client) {
    setEditing(client)
    setDialogOpen(true)
  }

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={openNew}>+ Novo Cliente</Button>
      </div>
      <div className="bg-white rounded-lg border">
        <ClientsTable clients={clients} onEdit={openEdit} onDelete={handleDelete} />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            initial={editing ?? {}}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add components/clients/ components/__tests__/ app/
git commit -m "feat: add client management page with CRUD operations"
```

---

### Task 9: Pipeline Kanban Board

**Files:**
- Create: `components/pipeline/deal-card.tsx`
- Create: `components/pipeline/deal-form.tsx`
- Create: `components/pipeline/kanban-column.tsx`
- Create: `components/pipeline/kanban-board.tsx`
- Create: `app/(dashboard)/pipeline/page.tsx`
- Test: `components/__tests__/deal-card.test.tsx`
- Test: `components/__tests__/deal-form.test.tsx`

- [ ] **Step 1: Write failing test for DealCard**

Create `components/__tests__/deal-card.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DealCard } from '../pipeline/deal-card'
import type { Deal } from '@/lib/types'

const mockDeal: Deal = {
  id: '1',
  client_id: 'c1',
  title: 'Proposta Alpha',
  value: 15000,
  stage: 'proposta',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  client: {
    id: 'c1', name: 'Alpha Corp',
    email: null, phone: null, company: null, notes: null,
    created_at: '2026-01-01T00:00:00Z',
  },
}

describe('DealCard', () => {
  it('renders deal title and client name', () => {
    render(<DealCard deal={mockDeal} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Proposta Alpha')).toBeInTheDocument()
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument()
  })

  it('renders formatted BRL value', () => {
    render(<DealCard deal={mockDeal} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/15\.000|15,000/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write failing test for DealForm**

Create `components/__tests__/deal-form.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DealForm } from '../pipeline/deal-form'
import type { Client } from '@/lib/types'

const mockClients: Client[] = [
  { id: 'c1', name: 'Alpha Corp', email: null, phone: null, company: null, notes: null, created_at: '' },
]

describe('DealForm', () => {
  it('renders title and value fields', () => {
    render(<DealForm clients={mockClients} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
  })

  it('calls onSubmit with title and numeric value', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<DealForm clients={mockClients} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/título/i), 'Novo Negócio')
    await user.clear(screen.getByLabelText(/valor/i))
    await user.type(screen.getByLabelText(/valor/i), '5000')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Novo Negócio', value: 5000 })
    )
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run components/__tests__/deal-card.test.tsx components/__tests__/deal-form.test.tsx
```
Expected: FAIL — cannot find modules

- [ ] **Step 4: Create components/pipeline/deal-card.tsx**

```typescript
import { Button } from '@/components/ui/button'
import type { Deal } from '@/lib/types'

interface DealCardProps {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  return (
    <div className="bg-white rounded-md border p-3 shadow-sm space-y-1 cursor-grab active:cursor-grabbing">
      <p className="font-medium text-sm leading-tight">{deal.title}</p>
      {deal.client && <p className="text-xs text-gray-500">{deal.client.name}</p>}
      <p className="text-sm font-semibold text-green-600">{fmt.format(deal.value)}</p>
      <div className="flex gap-1 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => onEdit(deal)}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2 text-red-500 hover:text-red-700"
          onClick={() => onDelete(deal.id)}
        >
          Remover
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create components/pipeline/deal-form.tsx**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client, Deal, DealStage } from '@/lib/types'
import { DEAL_STAGES, STAGE_LABELS } from '@/lib/types'

type DealFormData = Pick<Deal, 'title' | 'value' | 'stage' | 'client_id'>

interface DealFormProps {
  clients: Client[]
  initial?: Partial<DealFormData>
  onSubmit: (data: DealFormData) => void
  onCancel: () => void
}

export function DealForm({ clients, initial = {}, onSubmit, onCancel }: DealFormProps) {
  const [form, setForm] = useState<DealFormData>({
    title: initial.title ?? '',
    value: initial.value ?? 0,
    stage: initial.stage ?? 'prospeccao',
    client_id: initial.client_id ?? (clients[0]?.id ?? ''),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ ...form, value: Number(form.value) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="df-title">Título *</Label>
        <Input
          id="df-title"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-value">Valor (R$)</Label>
        <Input
          id="df-value"
          type="number"
          min="0"
          step="0.01"
          value={form.value}
          onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-client">Cliente</Label>
        <select
          id="df-client"
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
          value={form.client_id}
          onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
        >
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-stage">Etapa</Label>
        <select
          id="df-stage"
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
          value={form.stage}
          onChange={e => setForm(p => ({ ...p, stage: e.target.value as DealStage }))}
        >
          {DEAL_STAGES.map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run components/__tests__/deal-card.test.tsx components/__tests__/deal-form.test.tsx
```
Expected: PASS (4 tests total)

- [ ] **Step 7: Create components/pipeline/kanban-column.tsx**

```typescript
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { DealCard } from './deal-card'
import type { Deal, DealStage } from '@/lib/types'
import { STAGE_LABELS } from '@/lib/types'

interface KanbanColumnProps {
  stage: DealStage
  deals: Deal[]
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

export function KanbanColumn({ stage, deals, onEdit, onDelete }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-60 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h3>
        <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
          {deals.length}
        </span>
      </div>
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-20 rounded-lg p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
            }`}
          >
            {deals.map((deal, index) => (
              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
```

- [ ] **Step 8: Create components/pipeline/kanban-board.tsx**

```typescript
'use client'

import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { KanbanColumn } from './kanban-column'
import type { Deal, DealStage } from '@/lib/types'
import { DEAL_STAGES } from '@/lib/types'

interface KanbanBoardProps {
  deals: Deal[]
  onStageChange: (dealId: string, newStage: DealStage) => void
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

export function KanbanBoard({ deals, onStageChange, onEdit, onDelete }: KanbanBoardProps) {
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const newStage = result.destination.droppableId as DealStage
    const deal = deals.find(d => d.id === result.draggableId)
    if (!deal || deal.stage === newStage) return
    onStageChange(deal.id, newStage)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={deals.filter(d => d.stage === stage)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
```

- [ ] **Step 9: Create app/(dashboard)/pipeline/page.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { DealForm } from '@/components/pipeline/deal-form'
import { createClient } from '@/lib/supabase/client'
import type { Client, Deal, DealStage } from '@/lib/types'

type DealFormData = Pick<Deal, 'title' | 'value' | 'stage' | 'client_id'>

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const supabase = createClient()

  async function load() {
    const [{ data: dealsData }, { data: clientsData }] = await Promise.all([
      supabase.from('deals').select('*, client:clients(*)').order('created_at'),
      supabase.from('clients').select('*').order('name'),
    ])
    setDeals((dealsData as Deal[]) ?? [])
    setClients(clientsData ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleStageChange(dealId: string, newStage: DealStage) {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d))
    await supabase.from('deals').update({ stage: newStage }).eq('id', dealId)
  }

  async function handleSubmit(data: DealFormData) {
    if (editing) {
      await supabase.from('deals').update(data).eq('id', editing.id)
    } else {
      await supabase.from('deals').insert(data)
    }
    setDialogOpen(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este negócio?')) return
    await supabase.from('deals').delete().eq('id', id)
    load()
  }

  function openEdit(deal: Deal) {
    setEditing(deal)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>+ Novo Negócio</Button>
      </div>
      <KanbanBoard
        deals={deals}
        onStageChange={handleStageChange}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
          </DialogHeader>
          <DealForm
            clients={clients}
            initial={editing ?? {}}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 10: Run all tests**

```bash
npm run test:run
```
Expected: All tests PASS (12+ tests)

- [ ] **Step 11: Commit**

```bash
git add components/pipeline/ components/__tests__/ app/
git commit -m "feat: add Kanban pipeline with drag-and-drop deal management"
```

---

### Task 10: Final Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify redirect to login**

Open http://localhost:3000. You should be automatically redirected to `/login`.

- [ ] **Step 3: Verify login flow**

Enter the credentials created in Task 2 Step 5. You should land on the dashboard showing 4 metric cards (all zeros initially).

- [ ] **Step 4: Verify clients page**

Navigate to Clientes. Click "+ Novo Cliente", fill in name and company, save. The client should appear in the table. Edit it and verify the changes persist. 

- [ ] **Step 5: Verify pipeline page**

Navigate to Pipeline. Click "+ Novo Negócio", select the client you created, set a title and value, save. The deal should appear in the Prospecção column. Drag it to Qualificação. Refresh the page and verify it remains in Qualificação.

- [ ] **Step 6: Verify dashboard metrics update**

Navigate back to Dashboard. "Total de Clientes" should show 1, "Negócios Ativos" should show 1.

- [ ] **Step 7: Verify logout**

Click "Sair" in the sidebar. You should be redirected to `/login`. Try accessing http://localhost:3000/clients directly — you should be redirected back to `/login`.

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "feat: complete CRM dashboard — login, clients, and pipeline"
```
