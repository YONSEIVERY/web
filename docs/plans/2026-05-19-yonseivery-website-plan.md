# yonseivery.com Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship VERY 학회 공식 사이트 `yonseivery.com` — branding + activity archive + alumni showcase, deployed on Vercel.

**Architecture:** Next.js 15 App Router on Vercel. Static + ISR. Hybrid CMS: code holds brand copy/static content, Notion holds curriculum/alumni/awards/teams (via Notion API, 60s ISR). Korean-only with English typographic accents. Dark cinematic aesthetic matching @very_yonsei Instagram tone.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion, `@notionhq/client`, Pretendard + Geist fonts, Vercel (Analytics, hosting, domain).

**Design Doc:** [`./2026-05-19-yonseivery-website-design.md`](./2026-05-19-yonseivery-website-design.md) — full design rationale, color tokens, IA, component catalog.

**Project root convention:** This plan assumes the Next.js app is created in a subfolder `web/` inside `C:\Users\ricky\Desktop\very 43기\`. All file paths below are relative to that `web/` folder unless otherwise noted.

---

## Conventions Used in This Plan

- **Each task** is small enough to commit independently (5–20 min).
- **TDD applies to**: Notion parsers, utility functions, API route handlers, season-gate logic. UI components are verified via `next dev` + visual check (per design doc, full UI test coverage is intentionally out of scope).
- **Commit cadence**: one commit per task minimum, more if useful.
- **Branch**: work on `develop`, merge to `main` only after Phase 15 QA.
- **PowerShell users**: paths use forward slashes — Node tooling handles cross-platform. Avoid `cd` chains.

---

## Phase 0 — Bootstrap (Setup project, repo, tooling)

### Task 0.1: Create Next.js project

**Files:** Create `web/` subfolder.

**Steps:**

1. Run from project root (`C:/Users/ricky/Desktop/very 43기`):
   ```bash
   npx create-next-app@latest web --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint --turbopack --no-git
   ```
   Answer prompts: TypeScript ✅, ESLint ✅, Tailwind ✅, App Router ✅, Turbopack ✅, no `src/` dir, alias `@/*`.

2. Verify:
   ```bash
   cd web && npm run dev
   ```
   Expected: dev server starts on `http://localhost:3000`, default Next.js page renders. Kill the server.

3. Commit: not yet — git initialized in next task.

### Task 0.2: Initialize git, base config

**Files:**
- Modify: `web/.gitignore` (already exists from create-next-app)
- Create: `web/.editorconfig`
- Create: `web/.nvmrc`

**Steps:**

1. From project root:
   ```bash
   git init
   git branch -m main
   git checkout -b develop
   ```

2. Create `web/.nvmrc`:
   ```
   20
   ```

3. Create `web/.editorconfig`:
   ```
   root = true
   [*]
   indent_style = space
   indent_size = 2
   end_of_line = lf
   charset = utf-8
   trim_trailing_whitespace = true
   insert_final_newline = true
   ```

4. Move design doc + plan into repo (already in `docs/plans/`).

5. Commit:
   ```bash
   git add .
   git commit -m "chore: bootstrap Next.js 15 project + dev tooling"
   ```

### Task 0.3: Strict TypeScript + Prettier

**Files:**
- Modify: `web/tsconfig.json`
- Create: `web/.prettierrc.json`
- Create: `web/.prettierignore`

**Steps:**

1. In `web/tsconfig.json`, ensure `compilerOptions` has:
   ```json
   "strict": true,
   "noUncheckedIndexedAccess": true,
   "noImplicitOverride": true,
   "verbatimModuleSyntax": true
   ```

2. Install Prettier:
   ```bash
   cd web && npm i -D prettier prettier-plugin-tailwindcss
   ```

3. Create `web/.prettierrc.json`:
   ```json
   {
     "semi": false,
     "singleQuote": true,
     "trailingComma": "all",
     "printWidth": 100,
     "plugins": ["prettier-plugin-tailwindcss"]
   }
   ```

4. Create `web/.prettierignore`:
   ```
   .next
   node_modules
   public
   ```

5. Run: `npx tsc --noEmit` — expect zero errors.

6. Commit: `chore: enable strict TS + Prettier`.

### Task 0.4: Folder structure

**Files:** Create empty folders + `.gitkeep` files inside `web/`:

```
web/
├── app/
│   ├── (marketing)/
│   ├── api/
│   └── ...
├── components/
│   ├── ui/
│   ├── layout/
│   ├── sections/
│   ├── content/
│   ├── notion/
│   └── motion/
├── lib/
│   ├── notion/
│   │   └── parsers/
│   ├── content/
│   └── utils/
├── content/
├── public/
│   ├── brand/
│   ├── partners/
│   └── people/
└── tests/
    └── notion/
```

**Steps:**
1. Create folders. On Windows bash: `mkdir -p` works.
2. Add `.gitkeep` to each empty folder.
3. Commit: `chore: scaffold folder structure`.

### Task 0.5: Install runtime dependencies

**Steps:**

1. From `web/`:
   ```bash
   npm i @notionhq/client framer-motion clsx tailwind-merge zod
   npm i -D @types/node
   ```

2. Verify `package.json` lists them.

3. Commit: `chore: add runtime deps (notion, framer, zod, clsx)`.

### Task 0.6: Environment variables scaffold

**Files:**
- Create: `web/.env.local.example`
- Modify: `web/.gitignore` (verify `.env*.local` is ignored)

**Steps:**

1. Create `web/.env.local.example`:
   ```
   # Notion CMS
   NOTION_TOKEN=
   NOTION_DB_CURRICULUM_43=
   NOTION_DB_CURRICULUM_42=
   NOTION_DB_ALUMNI=
   NOTION_DB_AWARDS=
   NOTION_DB_TEAMS=

   # Site
   SITE_URL=https://yonseivery.com
   RECRUIT_OPEN=false
   RECRUIT_FORM_URL=
   CONTACT_FORM_TO_EMAIL=yonseivery1997@gmail.com

   # Revalidate secret
   REVALIDATE_SECRET=

   # (Optional, for contact form email send)
   RESEND_API_KEY=
   ```

2. Copy to `.env.local` locally with placeholder values for dev (use `RECRUIT_OPEN=true` for testing).

3. Commit: `chore: env vars scaffold`.

### Task 0.7: Next.js config (image domains, headers)

**Files:** Modify `web/next.config.ts`

**Code:**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.notion.so' },
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default config
```

**Verify:** `npm run dev` still starts cleanly.

**Commit:** `chore: configure Next.js (images, security headers)`.

---

## Phase 1 — Design System

### Task 1.1: Color tokens + global CSS

**Files:** Modify `web/app/globals.css`

**Code:** Replace contents with:

```css
@import 'tailwindcss';

@theme {
  --color-bg-base: #000000;
  --color-bg-elev: #0a0a0f;
  --color-fg-primary: #ffffff;
  --color-fg-muted: #6b7280;
  --color-fg-subtle: #9ca3af;
  --color-accent: #3a4ff0;
  --color-accent-2: #818cf8;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.16);

  --font-sans: 'Pretendard Variable', system-ui, sans-serif;
  --font-display: 'Geist', 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
}

@layer base {
  html {
    background: var(--color-bg-base);
    color: var(--color-fg-primary);
    color-scheme: dark;
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  body {
    min-height: 100dvh;
  }
  ::selection {
    background: var(--color-accent);
    color: white;
  }
  *:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: var(--color-bg-base);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-border-strong);
    border-radius: 4px;
  }
}
```

**Note:** Confirm the actual VERY blue from the logo at this step by sampling `design/Artboard 7.png` or the logo. Update `--color-accent` if it differs from `#3a4ff0`.

**Commit:** `feat(design): color tokens + global base styles`.

### Task 1.2: Fonts (Pretendard + Geist)

**Files:**
- Modify: `web/app/layout.tsx`

**Steps:**

1. Install Pretendard via CDN link + Geist via `next/font/google` (Geist is on Google Fonts).

2. In `web/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-display' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: 'VERY ─ 연세대학교 창업학회', template: '%s · VERY' },
  description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
  metadataBase: new URL(process.env.SITE_URL ?? 'https://yonseivery.com'),
  openGraph: {
    title: 'VERY ─ 연세대학교 창업학회',
    description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
    siteName: 'VERY',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

3. Verify in browser — fonts load.

**Commit:** `feat(design): Pretendard + Geist fonts`.

### Task 1.3: `cn()` utility

**Files:** Create `web/lib/utils/cn.ts`

**Code:**

```typescript
import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**Commit:** `feat(utils): cn helper for class merging`.

### Task 1.4: `<NoiseLayer />` — global SVG noise overlay

**Files:** Create `web/components/ui/noise-layer.tsx`

**Code:**

```typescript
export function NoiseLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.04] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      }}
    />
  )
}
```

Mount it in `app/layout.tsx` `<body>` before `{children}`.

**Verify:** Open dev server, see subtle film grain.

**Commit:** `feat(ui): NoiseLayer film-grain overlay`.

### Task 1.5: `<GlowBackground />`

**Files:** Create `web/components/ui/glow-background.tsx`

**Code:**

```typescript
import { cn } from '@/lib/utils/cn'

export function GlowBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 -z-10',
        'bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_55%)]',
        'opacity-50',
        className,
      )}
    />
  )
}
```

**Commit:** `feat(ui): GlowBackground radial hero glow`.

### Task 1.6: `<Button />` + `<Tag />` + `<Divider />`

**Files:**
- Create `web/components/ui/button.tsx`
- Create `web/components/ui/tag.tsx`
- Create `web/components/ui/divider.tsx`

**`button.tsx`:**

```typescript
import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'ghost' | 'link'

type Common = { variant?: Variant; className?: string; children: React.ReactNode }
type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string }

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)] transition-colors',
  ghost:
    'border border-[var(--color-border-strong)] text-white hover:bg-white/5 transition-colors',
  link: 'text-white underline underline-offset-4 decoration-[var(--color-accent)] hover:decoration-[var(--color-accent-2)]',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-tight'

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(
  function Button(props, ref) {
    const { variant = 'primary', className, children, as, ...rest } = props
    if (as === 'a') {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cn(base, styles[variant], className)}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      )
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(base, styles[variant], className)}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    )
  },
)
```

**`tag.tsx`:**

```typescript
import { cn } from '@/lib/utils/cn'

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-muted)]',
        className,
      )}
    >
      {children}
    </span>
  )
}
```

**`divider.tsx`:**

```typescript
import { cn } from '@/lib/utils/cn'

export function Divider({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      className={cn('flex items-center gap-3', className)}
    >
      <div className="h-px flex-1 bg-[var(--color-border)]" />
      {label ? (
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)]">
          {label}
        </span>
      ) : null}
      {label ? <div className="h-px flex-1 bg-[var(--color-border)]" /> : null}
    </div>
  )
}
```

**Commit:** `feat(ui): Button, Tag, Divider primitives`.

### Task 1.7: `<SectionHeader />` + `<Section />` container

**Files:**
- Create `web/components/ui/section.tsx`
- Create `web/components/ui/section-header.tsx`

**`section.tsx`:**

```typescript
import { cn } from '@/lib/utils/cn'

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('relative px-6 py-24 sm:px-8 md:py-32', className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  )
}
```

**`section-header.tsx`:**

```typescript
import { cn } from '@/lib/utils/cn'

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-12 flex flex-col gap-4 md:mb-16',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-2)]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">{title}</h2>
      {subtitle ? <p className="max-w-2xl text-[var(--color-fg-subtle)]">{subtitle}</p> : null}
    </header>
  )
}
```

**Commit:** `feat(ui): Section + SectionHeader containers`.

---

## Phase 2 — Global Layout (Nav + Footer)

### Task 2.1: `<Nav />` — desktop + scroll blur

**Files:** Create `web/components/layout/nav.tsx`

**Behavior:**
- Fixed top, transparent at scroll 0, `bg-black/60 backdrop-blur-xl` after 100px.
- Logo (wing-V) left, menu center, RECRUIT CTA right.
- Active route gets blue underline.

**Code:**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

const items = [
  { href: '/about', label: 'About' },
  { href: '/curriculum', label: 'Curriculum' },
  { href: '/demoday', label: 'Demoday' },
  { href: '/alumni', label: 'Alumni' },
  { href: '/partners', label: 'Partners' },
  { href: '/contact', label: 'Contact' },
] as const

export function Nav({ recruitOpen }: { recruitOpen: boolean }) {
  const path = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'border-b border-[var(--color-border)] bg-black/60 backdrop-blur-xl' : '',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="font-display text-lg font-bold italic tracking-tight">
          VERY
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          {items.map((it) => {
            const active = path === it.href
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    'relative text-sm tracking-tight transition-colors',
                    active
                      ? 'text-white'
                      : 'text-[var(--color-fg-subtle)] hover:text-white',
                  )}
                >
                  {it.label}
                  {active && (
                    <span className="absolute -bottom-1 left-0 h-px w-full bg-[var(--color-accent)]" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <Link
          href="/recruit"
          className={cn(
            'hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex',
            recruitOpen
              ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)]'
              : 'border border-[var(--color-border-strong)] text-[var(--color-fg-subtle)] hover:text-white',
          )}
        >
          {recruitOpen ? 'Recruit ↗' : 'Recruit'}
        </Link>
        {/* Mobile menu trigger added in Task 2.2 */}
      </nav>
    </header>
  )
}
```

**Mount it** in `app/layout.tsx` body:

```typescript
import { Nav } from '@/components/layout/nav'
// ...
<body>
  <NoiseLayer />
  <Nav recruitOpen={process.env.RECRUIT_OPEN === 'true'} />
  {children}
</body>
```

**Commit:** `feat(layout): Nav with scroll-blur + active route`.

### Task 2.2: `<Nav />` — mobile drawer

**Files:** Modify `web/components/layout/nav.tsx`

**Add:** Hamburger trigger (visible only on `md:hidden`), opens a full-screen overlay with large stacked menu items + RECRUIT CTA. Stagger entry with framer-motion.

Use `framer-motion`'s `<AnimatePresence>` + a state `open: boolean`. Lock body scroll while open.

**Verify:** Test on mobile viewport (Chrome DevTools).

**Commit:** `feat(layout): Nav mobile drawer with stagger entry`.

### Task 2.3: `<Footer />`

**Files:** Create `web/components/layout/footer.tsx`

**Code:**

```typescript
import Link from 'next/link'
import { Divider } from '@/components/ui/divider'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-base)] px-6 py-16 sm:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-12 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold italic">VERY</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)]">
            Since 1997
          </p>
          <p className="mt-4 text-sm text-[var(--color-fg-subtle)]">
            연세대학교 창업학회
            <br />
            Yonsei Venture Society
          </p>
        </div>
        <FooterCol title="Navigate">
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/curriculum">Curriculum</FooterLink>
          <FooterLink href="/demoday">Demoday</FooterLink>
          <FooterLink href="/alumni">Alumni</FooterLink>
          <FooterLink href="/partners">Partners</FooterLink>
        </FooterCol>
        <FooterCol title="Connect">
          <FooterLink href="https://instagram.com/very_yonsei">Instagram ↗</FooterLink>
          <FooterLink href="/recruit">Recruit</FooterLink>
        </FooterCol>
        <FooterCol title="Contact">
          <a
            href="mailto:yonseivery1997@gmail.com"
            className="text-sm text-white hover:text-[var(--color-accent-2)]"
          >
            yonseivery1997@gmail.com
          </a>
        </FooterCol>
      </div>
      <div className="mx-auto mt-12 w-full max-w-7xl">
        <Divider />
        <p className="mt-6 font-mono text-xs text-[var(--color-fg-muted)]">
          © {new Date().getFullYear()} VERY · 연세대학교 창업학회
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)]">
        {title}
      </p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-white hover:text-[var(--color-accent-2)]">
        {children}
      </Link>
    </li>
  )
}
```

Mount in `app/layout.tsx` after `{children}`.

**Commit:** `feat(layout): Footer`.

---

## Phase 3 — Motion Helpers

### Task 3.1: `<Reveal />` — stagger entry on scroll

**Files:** Create `web/components/motion/reveal.tsx`

**Code:**

```typescript
'use client'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

const variants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={variants}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
```

**Commit:** `feat(motion): Reveal stagger-entry component`.

### Task 3.2: `<CountUp />`

**Files:** Create `web/components/motion/count-up.tsx`

**Code:**

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'

export function CountUp({
  to,
  duration = 1600,
  prefix = '',
  suffix = '',
}: {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setValue(Math.round(to * eased))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.disconnect()
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration])

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}
```

**Commit:** `feat(motion): CountUp`.

### Task 3.3: `<TiltCard />` (skip if YAGNI)

**Defer:** Implement only when used (Phase 5/6 cards). Add to backlog mental note.

---

## Phase 4 — Static Content

### Task 4.1: Site constants

**Files:** Create `web/lib/content/site.ts`

**Code:**

```typescript
export const SITE = {
  name: 'VERY',
  fullName: 'VERY ─ 연세대학교 창업학회',
  since: 1997,
  currentCohort: 43,
  email: 'yonseivery1997@gmail.com',
  instagram: 'https://instagram.com/very_yonsei',
  recruitFormUrl: process.env.RECRUIT_FORM_URL ?? '#',
} as const

export const STATS = {
  yearsActive: new Date().getFullYear() - 1997,
  cohorts: 43,
  alumniCount: 500, // 학회 측 확정값으로 교체 필요
  startupsCount: 60, // 학회 측 확정값으로 교체 필요
} as const
```

**Commit:** `feat(content): site constants`.

### Task 4.2: Manifesto, Core Values, About copy

**Files:** Create `web/lib/content/manifesto.ts` and `web/lib/content/core-values.ts`

**`manifesto.ts`:** (text from Notion 페이지 "Who We Are"/"VISION")

```typescript
export const MANIFESTO = {
  heroEyebrow: 'Since 1997',
  heroHeadline: '세상을 바꾸는 28년',
  heroSub: '연세대학교의 가장 뿌리깊은 창업학회.',
  whoWeAre: `VERY는 1997년 벤처창업연구회로 발족한 창업학회로, 연세대학교의 가장 뿌리깊은 창업학회로써 주어진 명예와 의무에 충실하며, 수많은 예비창업인을 돕는 창업 인큐베이터로 기능하고 있습니다.`,
  vision: `단순히 '학회'에 만족하지 않고, 대내외적 실전 경험을 쌓으며 대학생 창업 생태계, 나아가 우리 사회 전반의 발전에 기여하는 선두 주자가 될 것입니다.`,
} as const
```

**`core-values.ts`:**

```typescript
export const CORE_VALUES = [
  {
    key: 'knowledge',
    accent: 'Knowledge',
    title: '체계적인 지식의 토대',
    body: 'VERY는 체계적인 커리큘럼을 통해 수많은 예비창업인들이 실질적으로 창업을 하는 데에 필요한 지식을 제공합니다. 더 높은 곳으로의 성장, 더 견고한 성공을 위해 함께 달립니다.',
  },
  {
    key: 'experience',
    accent: 'Experience',
    title: 'Fail Forward',
    body: '창업가라면 겪을 수밖에 없는 수많은 시도, 실패, 그리고 성공을 모두 경험해볼 수 있도록 지원합니다. VERY의 \u2018Fail Forward\u2019 정신은 풍부한 경험에서 출발합니다.',
  },
  {
    key: 'network',
    accent: 'Network',
    title: '함께 걷는 동료',
    body: '많은 창업가들이 팀빌딩에 대한 어려움을 호소합니다. VERY에서는 다양한 네트워킹 기회를 통해, 많은 사람들을 경험하고 또 좋은 사람들을 만날 수 있습니다.',
  },
] as const
```

**Commit:** `feat(content): manifesto + core values`.

### Task 4.3: Members benefits + Partners scaffolding

**Files:**
- Create `web/lib/content/member-benefits.ts`
- Create `web/lib/content/partners.ts`

**`member-benefits.ts`:**

```typescript
export const MEMBER_BENEFITS = [
  { icon: '💬', title: '알럼나이 톡방', desc: '1997년부터 누적된 창업가 네트워크와 정보 공유.' },
  { icon: '🧑🏻‍🏫', title: '스타트업 대표 멘토링', desc: 'VERY 세션 연사진과의 1:1 멘토링 기회.' },
  { icon: '💼', title: '협력사 채용 우대', desc: 'VERY 협력 기업·단체 포지션 지원 시 우대.' },
  { icon: '🏬', title: 'VC 투자 미팅 / IR', desc: '데모데이 IR 피칭, 우수팀 후속 VC 투자 미팅.' },
] as const
```

**`partners.ts`:** placeholder array with `{ name, logoSrc, link?, category }` entries — fill with known partners (에이블리, ZUZU). Logo files go in `public/partners/`.

**Commit:** `feat(content): member benefits + partners scaffold`.

---

## Phase 5 — Home Page

> **Test approach for Phase 5–13:** UI pages are verified by visual inspection in `npm run dev` and a manual checklist at the end. No unit tests for visual components (per design doc YAGNI).

### Task 5.1: `<PageHero />` shared component

**Files:** Create `web/components/sections/page-hero.tsx`

A reusable hero block: eyebrow + big italic display + sub + GlowBackground. Used across sub-pages.

**Commit:** `feat(sections): PageHero`.

### Task 5.2: Home hero

**Files:** Create `web/app/(marketing)/page.tsx`

The home hero is custom (full 100vh, wing-V logo overlaid, count-up to `Since 1997`).

```typescript
import Image from 'next/image'
import { GlowBackground } from '@/components/ui/glow-background'
import { MANIFESTO } from '@/lib/content/manifesto'

function HomeHero() {
  return (
    <section className="relative flex h-[100dvh] items-center justify-center overflow-hidden px-6">
      <GlowBackground />
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="font-mono text-xs uppercase tracking-[0.4em] text-[var(--color-accent-2)]">
          {MANIFESTO.heroEyebrow}
        </span>
        <h1 className="mt-6 font-display text-[clamp(3rem,12vw,10rem)] font-bold italic leading-[0.9] tracking-tight">
          VERY
        </h1>
        <p className="mt-6 max-w-xl text-balance text-[var(--color-fg-subtle)]">
          {MANIFESTO.heroSub}
        </p>
      </div>
      <ScrollHint />
    </section>
  )
}

function ScrollHint() {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)]">
      ↓ Scroll
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      {/* later: Manifesto, Core Value, Numbers, Recent, Alumni, CTA */}
    </main>
  )
}
```

**Commit:** `feat(home): hero section`.

### Task 5.3: Home — Manifesto block

Add a `<ManifestoBlock />` component (`components/sections/manifesto-block.tsx`) with the big italic `Fail Forward` headline + `MANIFESTO.whoWeAre` body. Use `<Reveal />`.

Mount into home page after hero.

**Commit:** `feat(home): Manifesto block`.

### Task 5.4: Home — Core Value cards

Create `<CoreValueCard />` (`components/content/core-value-card.tsx`) and a `<CoreValuesSection />` rendering 3 cards from `CORE_VALUES`.

Card styling: large accent word (`Knowledge`/`Experience`/`Network`) in italic display font, then title in white, body in muted. Border + hover lift.

**Commit:** `feat(home): Core Value cards`.

### Task 5.5: Home — Numbers section

Create `<NumberStat>` (`components/content/number-stat.tsx`) using `<CountUp />`. Layout 4 stats from `STATS` constants in a grid.

**Commit:** `feat(home): Numbers section`.

### Task 5.6: Home — Alumni LogoMarquee (placeholder)

Create `<LogoMarquee />` (`components/content/logo-marquee.tsx`) — infinite horizontal scroll of placeholder logo boxes. Will be wired to Notion data in Phase 10. For now show 8 placeholder `[VERY ALUMNI]` blocks.

**Commit:** `feat(home): LogoMarquee placeholder`.

### Task 5.7: Home — Latest Activities placeholder + CTA

Add a placeholder grid (3 cards) for recent activities; will wire to Notion in Phase 8. Add final CTA section with two buttons: "협업 문의 →" and "Recruit →".

**Commit:** `feat(home): Latest activities + CTA`.

---

## Phase 6 — About Page

### Task 6.1: About route + hero

Create `web/app/(marketing)/about/page.tsx`. Use shared `<PageHero />`: eyebrow `1997 ─ NOW`, title `28년의 창업 인큐베이터`, subtitle from Vision excerpt.

**Commit:** `feat(about): hero`.

### Task 6.2: About — Who We Are + Vision

Two side-by-side blocks (stack on mobile) rendering `MANIFESTO.whoWeAre` and `MANIFESTO.vision`. Use blue accent on key phrases (`<span className="text-accent">`).

**Commit:** `feat(about): Who We Are + Vision`.

### Task 6.3: About — K·E·N full-screen sections

Three full-viewport sections, each with one core value. Background per section: subtle blue glow on one corner. Snap-scroll optional (skip if buggy).

Reuse `<CoreValueCard />` content but render expanded.

**Commit:** `feat(about): K·E·N full sections`.

### Task 6.4: About — For VERY Members

Render `MEMBER_BENEFITS` as a 4-card grid with icon + title + desc.

**Commit:** `feat(about): For VERY Members cards`.

---

## Phase 7 — Notion Integration

### Task 7.1: Notion client wrapper

**Files:** Create `web/lib/notion/client.ts`

```typescript
import { Client } from '@notionhq/client'

const token = process.env.NOTION_TOKEN
if (!token && process.env.NODE_ENV === 'production') {
  throw new Error('NOTION_TOKEN missing')
}

export const notion = new Client({ auth: token ?? 'placeholder' })
```

**Commit:** `feat(notion): client wrapper`.

### Task 7.2: Notion types

**Files:** Create `web/lib/notion/types.ts`

```typescript
export type Cohort = number

export interface CurriculumWeek {
  id: string
  cohort: Cohort
  week: number
  topic: string
  speaker?: string
  date?: string
  keywords: string[]
  photoUrl?: string
}

export interface AlumniStartup {
  id: string
  name: string
  founder?: string
  cohort?: Cohort
  category?: string
  logoUrl?: string
  link?: string
  oneLiner?: string
}

export interface Award {
  id: string
  alumniName?: string
  cohort?: Cohort
  award: string
  year?: number
  organization?: string
}

export interface Team {
  id: string
  cohort: Cohort
  name: string
  members: string[]
  oneLiner?: string
  output?: string
}
```

**Commit:** `feat(notion): type defs`.

### Task 7.3: Property getters helpers (TDD)

**Files:**
- Create `web/lib/notion/property.ts`
- Create `web/tests/notion/property.test.ts`

**Step 1 — Write failing test:**

```typescript
import { describe, it, expect } from 'vitest'
import { getTitle, getRichText, getSelect, getNumber, getUrl } from '@/lib/notion/property'

describe('notion property getters', () => {
  it('reads title', () => {
    const page = { properties: { 회사명: { type: 'title', title: [{ plain_text: 'Ably' }] } } }
    expect(getTitle(page as any, '회사명')).toBe('Ably')
  })

  it('returns empty string when title missing', () => {
    expect(getTitle({ properties: {} } as any, '회사명')).toBe('')
  })

  it('reads number', () => {
    const page = { properties: { 기수: { type: 'number', number: 42 } } }
    expect(getNumber(page as any, '기수')).toBe(42)
  })

  it('returns undefined when number absent', () => {
    expect(getNumber({ properties: {} } as any, '기수')).toBeUndefined()
  })
})
```

**Step 2 — Install vitest + run (expect fail):**

```bash
cd web && npm i -D vitest @vitest/ui
```

Add to `package.json` scripts: `"test": "vitest run"`.

Run `npm test` — expect FAIL (module not found).

**Step 3 — Implement:**

```typescript
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

type Page = Pick<PageObjectResponse, 'properties'>

export function getTitle(page: Page, key: string): string {
  const prop = page.properties[key]
  if (prop?.type !== 'title') return ''
  return prop.title.map((t) => t.plain_text).join('')
}

export function getRichText(page: Page, key: string): string {
  const prop = page.properties[key]
  if (prop?.type !== 'rich_text') return ''
  return prop.rich_text.map((t) => t.plain_text).join('')
}

export function getNumber(page: Page, key: string): number | undefined {
  const prop = page.properties[key]
  return prop?.type === 'number' ? (prop.number ?? undefined) : undefined
}

export function getSelect(page: Page, key: string): string | undefined {
  const prop = page.properties[key]
  return prop?.type === 'select' ? (prop.select?.name ?? undefined) : undefined
}

export function getMultiSelect(page: Page, key: string): string[] {
  const prop = page.properties[key]
  if (prop?.type !== 'multi_select') return []
  return prop.multi_select.map((s) => s.name)
}

export function getUrl(page: Page, key: string): string | undefined {
  const prop = page.properties[key]
  return prop?.type === 'url' ? (prop.url ?? undefined) : undefined
}

export function getFileUrl(page: Page, key: string): string | undefined {
  const prop = page.properties[key]
  if (prop?.type !== 'files') return undefined
  const f = prop.files[0]
  if (!f) return undefined
  return f.type === 'external' ? f.external.url : f.file.url
}

export function getDate(page: Page, key: string): string | undefined {
  const prop = page.properties[key]
  return prop?.type === 'date' ? (prop.date?.start ?? undefined) : undefined
}
```

**Step 4 — Run tests:** `npm test` → expect PASS.

**Step 5 — Commit:** `feat(notion): property getter helpers + tests`.

### Task 7.4: parseAlumniStartup (TDD)

**Files:**
- Create `web/lib/notion/parsers/alumni.ts`
- Create `web/tests/notion/alumni.test.ts`

**Step 1 — Test:**

```typescript
import { describe, it, expect } from 'vitest'
import { parseAlumniStartup } from '@/lib/notion/parsers/alumni'

describe('parseAlumniStartup', () => {
  it('maps a full page', () => {
    const page = {
      id: 'abc',
      properties: {
        회사명: { type: 'title', title: [{ plain_text: 'Ably' }] },
        대표: { type: 'rich_text', rich_text: [{ plain_text: '강석훈' }] },
        기수: { type: 'number', number: 25 },
        분야: { type: 'select', select: { name: '커머스' } },
        홈페이지: { type: 'url', url: 'https://a-bly.com' },
      },
    }
    const result = parseAlumniStartup(page as any)
    expect(result).toMatchObject({
      id: 'abc',
      name: 'Ably',
      founder: '강석훈',
      cohort: 25,
      category: '커머스',
      link: 'https://a-bly.com',
    })
  })

  it('safely defaults when properties missing', () => {
    const page = { id: 'xyz', properties: {} }
    const result = parseAlumniStartup(page as any)
    expect(result.id).toBe('xyz')
    expect(result.name).toBe('')
    expect(result.cohort).toBeUndefined()
  })
})
```

Run `npm test` — expect FAIL.

**Step 2 — Implement:**

```typescript
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { getTitle, getRichText, getNumber, getSelect, getUrl, getFileUrl } from '../property'
import type { AlumniStartup } from '../types'

export function parseAlumniStartup(page: PageObjectResponse): AlumniStartup {
  return {
    id: page.id,
    name: getTitle(page, '회사명'),
    founder: getRichText(page, '대표') || undefined,
    cohort: getNumber(page, '기수'),
    category: getSelect(page, '분야'),
    logoUrl: getFileUrl(page, '로고'),
    link: getUrl(page, '홈페이지'),
    oneLiner: getRichText(page, '한줄소개') || undefined,
  }
}
```

Run `npm test` — expect PASS.

**Step 3 — Commit:** `feat(notion): parseAlumniStartup + tests`.

### Task 7.5: parseCurriculum, parseAward, parseTeam (TDD, batched)

Replicate Task 7.4 pattern for the remaining three parsers. Each gets its own test file.

Notion column names to confirm with 학회 (Open Question #2 in design doc):
- 커리큘럼: `주차`, `주제`, `연사`, `날짜`, `키워드` (multi-select), `사진` (file)
- 수상내역: `상`, `수상자`, `기수`, `연도`, `기관`
- 창업팀: `팀명`, `기수`, `멤버` (multi-select 또는 rich_text), `한줄소개`, `결과물`

**Commit:** `feat(notion): parseCurriculum + parseAward + parseTeam + tests`.

### Task 7.6: Data-fetcher functions

**Files:** Create `web/lib/notion/queries.ts`

```typescript
import { notion } from './client'
import { parseAlumniStartup } from './parsers/alumni'
import { parseCurriculum } from './parsers/curriculum'
import { parseAward } from './parsers/award'
import { parseTeam } from './parsers/team'
import type { AlumniStartup, CurriculumWeek, Award, Team } from './types'

async function queryDb<T>(dbId: string, parse: (page: any) => T): Promise<T[]> {
  if (!dbId) return []
  try {
    const res = await notion.databases.query({ database_id: dbId, page_size: 100 })
    return res.results.filter((p: any) => p.object === 'page').map(parse)
  } catch (err) {
    console.warn(`[notion] query failed for ${dbId}:`, err)
    return []
  }
}

export const getAlumniStartups = (): Promise<AlumniStartup[]> =>
  queryDb(process.env.NOTION_DB_ALUMNI ?? '', parseAlumniStartup)

export const getCurriculum = (cohort: 42 | 43): Promise<CurriculumWeek[]> => {
  const dbId =
    cohort === 43
      ? (process.env.NOTION_DB_CURRICULUM_43 ?? '')
      : (process.env.NOTION_DB_CURRICULUM_42 ?? '')
  return queryDb(dbId, parseCurriculum)
}

export const getAwards = (): Promise<Award[]> =>
  queryDb(process.env.NOTION_DB_AWARDS ?? '', parseAward)

export const getTeams = (): Promise<Team[]> =>
  queryDb(process.env.NOTION_DB_TEAMS ?? '', parseTeam)
```

**Commit:** `feat(notion): data-fetcher functions with safe fallback`.

---

## Phase 8 — Curriculum Page

### Task 8.1: `<CurriculumCard />`

`components/notion/curriculum-card.tsx` — renders one `CurriculumWeek`: large week number in mono, topic title, speaker, date, keyword tags, optional photo strip on the right.

**Commit:** `feat(curriculum): card component`.

### Task 8.2: Cohort selector + TimelineRail

`components/notion/cohort-selector.tsx` — tabs/buttons for `43` (default) / `42`. URL search param `?cohort=43`.

`components/content/timeline-rail.tsx` — left vertical line with circular nodes (one per week).

**Commit:** `feat(curriculum): cohort selector + timeline rail`.

### Task 8.3: Curriculum page assembly

`web/app/(marketing)/curriculum/page.tsx`:

```typescript
import { getCurriculum } from '@/lib/notion/queries'
import { PageHero } from '@/components/sections/page-hero'

export const revalidate = 60

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const params = await searchParams
  const cohort = params.cohort === '42' ? 42 : 43
  const weeks = await getCurriculum(cohort)
  // render hero + cohort selector + timeline of cards
}
```

**Commit:** `feat(curriculum): page assembly with ISR`.

---

## Phase 9 — Demoday Page

### Task 9.1: TeamCard + TeamsGallery

Render team grid (3 col desktop, 1 col mobile). Card: team name, cohort tag, members, one-liner.

**Commit:** `feat(demoday): team card + gallery`.

### Task 9.2: AwardsTimeline

Render awards sorted by year DESC, grouped by cohort. Year as large mono in left column.

**Commit:** `feat(demoday): awards timeline`.

### Task 9.3: Demoday page assembly

`app/(marketing)/demoday/page.tsx` — hero + teams gallery + awards timeline + speakers/judges section (placeholder until Notion data confirmed).

`export const revalidate = 60`.

**Commit:** `feat(demoday): page assembly`.

---

## Phase 10 — Alumni Page ★

### Task 10.1: `<AlumniStartupCard />`

Square card: logo top (or company initial fallback), name + one-liner + cohort + category tag + external link arrow.

**Commit:** `feat(alumni): startup card`.

### Task 10.2: `<FilterBar />` — client component

`'use client'` component with category and cohort filter buttons. Reads/writes `?category=&cohort=` search params via `useRouter`.

**Commit:** `feat(alumni): filter bar`.

### Task 10.3: `<AlumniGrid />` server component + page assembly

Server component fetches alumni, applies filters from search params, renders grid.

`app/(marketing)/alumni/page.tsx`:

```typescript
import { getAlumniStartups } from '@/lib/notion/queries'

export const revalidate = 60

export default async function AlumniPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; cohort?: string }>
}) {
  const params = await searchParams
  const all = await getAlumniStartups()
  const filtered = all.filter(
    (a) =>
      (!params.category || a.category === params.category) &&
      (!params.cohort || String(a.cohort) === params.cohort),
  )
  // render hero + FilterBar + grid of AlumniStartupCard
}
```

**Commit:** `feat(alumni): page with filter`.

### Task 10.4: Wire `<LogoMarquee />` on Home to alumni data

Replace Phase 5.6 placeholder with real data from `getAlumniStartups()`.

**Commit:** `feat(home): wire LogoMarquee to alumni data`.

---

## Phase 11 — Partners Page

### Task 11.1: `<PartnerLogoGrid />`

Grayscale logos by default, `hover:` reveals color. Tooltip with partner name + category.

**Commit:** `feat(partners): logo grid`.

### Task 11.2: `<CaseStudyCard />`

For 에이블리, ZUZU 케이스: image, partner name, what we did, outcome.

**Commit:** `feat(partners): case study card`.

### Task 11.3: Partners page assembly

`app/(marketing)/partners/page.tsx` — hero + logo grid + case study cards + CTA → /contact.

**Commit:** `feat(partners): page assembly`.

---

## Phase 12 — Recruit Page (Season Gate, TDD)

### Task 12.1: `seasonGate` util (TDD)

**Files:**
- Create `web/lib/utils/season-gate.ts`
- Create `web/tests/season-gate.test.ts`

**Step 1 — Test:**

```typescript
import { describe, it, expect } from 'vitest'
import { isRecruitOpen } from '@/lib/utils/season-gate'

describe('isRecruitOpen', () => {
  it('is true when RECRUIT_OPEN=true', () => {
    expect(isRecruitOpen({ RECRUIT_OPEN: 'true' })).toBe(true)
  })
  it('is false when RECRUIT_OPEN=false', () => {
    expect(isRecruitOpen({ RECRUIT_OPEN: 'false' })).toBe(false)
  })
  it('defaults to false on missing value', () => {
    expect(isRecruitOpen({})).toBe(false)
  })
  it('rejects junk values', () => {
    expect(isRecruitOpen({ RECRUIT_OPEN: 'yes' })).toBe(false)
  })
})
```

Run — fail.

**Step 2 — Implement:**

```typescript
export function isRecruitOpen(env: Record<string, string | undefined>): boolean {
  return env.RECRUIT_OPEN === 'true'
}
```

Run — pass.

**Step 3 — Commit:** `feat(util): isRecruitOpen + tests`.

### Task 12.2: Recruit page assembly

`app/(marketing)/recruit/page.tsx` — server component reads `isRecruitOpen(process.env)` and renders one of two states:

- **Open**: 모집 일정 + 지원 방법 + FAQ + CTA → `RECRUIT_FORM_URL` (external)
- **Closed**: 큰 시네마틱 메시지 "43기 모집은 마감되었습니다" + 이메일 알림 신청 폼 (defer email collection to v2, just a `mailto:` for now)

**Commit:** `feat(recruit): page with season gate`.

---

## Phase 13 — Contact Page + API

### Task 13.1: Contact page (info only first)

`app/(marketing)/contact/page.tsx` — hero + 3 big cards (Instagram, Email, 위치). 위치는 노션에 없으니 일단 "연세대학교 신촌캠퍼스" 텍스트만.

**Commit:** `feat(contact): info page`.

### Task 13.2: Contact form (frontend)

Client component with name, email, message fields. Zod validation. Submit POSTs to `/api/contact`.

**Commit:** `feat(contact): form UI + validation`.

### Task 13.3: `/api/contact` route (TDD-ish)

**Files:**
- Create `web/app/api/contact/route.ts`
- Create `web/tests/api/contact.test.ts`

Test: valid payload returns 200; invalid returns 400.

Implementation: validate with Zod, send email via Resend (if `RESEND_API_KEY` set) or log + return success in dev.

**Commit:** `feat(api): contact form endpoint + tests`.

---

## Phase 14 — Polish (errors, SEO, OG)

### Task 14.1: `not-found.tsx` + `error.tsx`

**Files:**
- Create `web/app/not-found.tsx`
- Create `web/app/error.tsx`

Cinematic 404: big wing-V + "이 페이지는 lander가 아닙니다 ↩ Home" link.

**Commit:** `feat(polish): 404 + error boundaries`.

### Task 14.2: Dynamic OG image

**Files:** Create `web/app/api/og/route.tsx`

Use Next.js `ImageResponse` with title param + wing-V mark + blue glow.

Page-level metadata uses `openGraph.images: [{ url: '/api/og?title=...' }]`.

**Commit:** `feat(polish): dynamic OG image`.

### Task 14.3: `sitemap.ts` + `robots.ts`

Standard Next 15 implementations under `app/`.

**Commit:** `feat(polish): sitemap + robots`.

### Task 14.4: Per-page metadata

Each route gets `export const metadata` with `title`, `description`. Use `generateMetadata` for dynamic pages if needed (Curriculum cohort).

**Commit:** `feat(polish): per-page metadata`.

### Task 14.5: `/api/revalidate` admin endpoint

**Files:** Create `web/app/api/revalidate/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const path = url.searchParams.get('path')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  if (!path) return NextResponse.json({ ok: false, error: 'missing path' }, { status: 400 })
  revalidatePath(path)
  return NextResponse.json({ ok: true, path })
}
```

**Commit:** `feat(api): on-demand revalidate endpoint`.

---

## Phase 15 — QA + Deploy

### Task 15.1: Build verification

```bash
cd web && npm run build
```

Expected: clean build, no TS/lint errors. Fix anything that surfaces.

**Commit:** `chore: fix build issues surfaced in QA`.

### Task 15.2: Lighthouse local run

Open built site in Chrome → Lighthouse → Mobile + Desktop runs. Target ≥90 for Performance + Accessibility + SEO.

Fix any low-hanging issues (alt tags, font-display, layout shifts).

**Commit:** as needed.

### Task 15.3: Manual QA checklist

Walk through all 8 pages on:
- Desktop 1440px Chrome
- Mobile 375px iPhone DevTools
- Tablet 768px

Verify:
- [ ] Nav scroll-blur works
- [ ] Mobile drawer opens/closes
- [ ] Hero looks cinematic
- [ ] All Notion-backed pages either render data or show graceful empty state (when token absent locally)
- [ ] No console errors
- [ ] Keyboard tab order is sensible
- [ ] Focus rings visible
- [ ] Forms validate

### Task 15.4: Vercel project + domain setup

(Manual — user does this in Vercel dashboard)

1. Create Vercel project from GitHub repo.
2. Add env vars (Production + Preview): all from `.env.local.example`.
3. Connect `yonseivery.com`:
   - Add domain → Vercel guides DNS records.
   - Configure `www.yonseivery.com` → 301 to root.
4. First Production deploy from `main`.

### Task 15.5: Merge develop → main, ship

```bash
git checkout main
git merge develop --no-ff
git push origin main
```

Wait for Vercel deploy, smoke test live URL.

**Commit final:** `chore: ship v1`.

---

## Out-of-scope (deferred to v2)

- 알럼나이 개인 상세 페이지
- 검색 기능
- 블로그/뉴스 섹션
- 이메일 뉴스레터
- 다국어 (영문)
- 회원 전용 영역

## Known blockers / inputs needed from 학회

1. **Notion Internal Integration 토큰 발급 및 각 DB에 Add Connection** (Task 7.1 진행 전까지)
2. **세션·데모데이 원본 사진 폴더** (Phase 5–9 비주얼 임팩트용)
3. **로고 정확 컬러 헥스값** (Task 1.1에서 임시값 사용 후 픽스)
4. **Alumni/Curriculum/Awards/Teams DB의 정확한 컬럼명** (Task 7.4–7.5 파서에 반영)
5. **STATS의 정확한 숫자** (알럼나이 수, 스타트업 수)
6. **Recruit 시즌 v1 출시 시 상태** (`RECRUIT_OPEN` 초기값)

---

## Execution Notes

- **Skill to follow during execution:** `superpowers:executing-plans`
- **Recommended task batching for review:** Phase 단위로 Preview URL 띄워서 학회 회장단 리뷰 권장
- **Frequent commits**: 각 task 끝 commit, Phase 끝나면 PR 머지
