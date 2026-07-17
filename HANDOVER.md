# SaaS Nepal — Project Handover Document

> **Written:** 2026-07-15
> **Workspace:** `s:\vehicle`
> **Run dev server:** `npm run dev` ? http://localhost:3000
> **Run prod build:** `npm run build && npm run start`

---

## 1. What This Project Is

**SaaS Nepal** (previously called "EV Nepal") is a **Next.js 15 vehicle marketplace** targeting the Nepali market. It lets users:

- Browse and filter both **electric vehicles (EV)** and **petrol cars** available in Nepal with Nepal on-road pricing
- Compare up to **4 vehicles** side-by-side on a detailed spec matrix
- Calculate **monthly EMI** (down payment %, tenure, interest rate)
- Browse a **Used EV Marketplace** carousel
- View detailed **individual vehicle pages**
- Sign in / Sign up via a **Login page**

The project was originally scoped to include an AI-powered recommendation engine, a Supabase backend, news articles, charging station maps, and brand pages — but **most of those features are incomplete or stubbed out** (see Section 5 below).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State management | Zustand (`lib/store.ts`) |
| Backend / DB | Supabase (partially configured — env vars needed) |
| Auth | NextAuth v5 beta with Credentials provider + bcrypt |
| AI | Anthropic Claude SDK (`lib/claude.ts`) — not yet wired to UI |
| Forms | react-hook-form + Zod |
| Charts | Recharts (installed, not yet used) |
| UI Components | shadcn/ui (`components/ui/`) + custom inline SVG icons |
| Animations | Framer Motion (installed, not yet used) |
| E2E Testing | Puppeteer (`scripts/test-ui.js`, `scripts/run-verification.ps1`) |

---

## 3. Project Architecture

```
s:\vehicle\
+-- app/
¦   +-- page.tsx                 # Homepage — search, filters, vehicle grid, EMI modal, used car carousel
¦   +-- layout.tsx               # Root layout (title: "SaaS Nepal")
¦   +-- globals.css              # Global Tailwind styles
¦   +-- login/page.tsx           # Login + Sign Up page (glassmorphism UI)
¦   +-- compare/page.tsx         # Compare hub + side-by-side spec matrix (up to 4 vehicles)
¦   +-- vehicle/[id]/page.tsx    # Individual vehicle detail page (dynamic route)
¦   +-- results/page.tsx         # Legacy results page (orphaned — not used)
¦   +-- api/recommend/route.ts  # POST /api/recommend (rule-based, not AI yet)
¦
+-- lib/
¦   +-- vehicles-db.ts           # LOCAL mock database — all vehicle data lives here
¦   +-- types.ts                 # Shared TypeScript interfaces (Vehicle, UsedListing, FilterParams…)
¦   +-- store.ts                 # Zustand global store (compareVehicles, searchFilters, lastResults)
¦   +-- auth.ts                  # NextAuth v5 config (Credentials + Supabase users table)
¦   +-- supabase.ts              # Supabase client (anon + admin)
¦   +-- tax-engine.ts            # Nepal on-road price calculator (customs, VAT, excise duty)
¦   +-- recommend-engine.ts      # Rule-based vehicle recommender
¦   +-- claude.ts                # Anthropic Claude API wrapper (not wired to UI)
¦   +-- utils.ts                 # cn() class merger
¦
+-- components/
¦   +-- ui/                      # shadcn/ui primitives
¦   +-- vehicle-action-buttons.tsx
¦
+-- scripts/
¦   +-- test-ui.js               # Puppeteer E2E test script
¦   +-- run-verification.ps1     # PowerShell: starts prod server + runs Puppeteer
¦
+-- public/images/               # Static vehicle images (all currently missing — 404)
+-- init.sql                     # Supabase DB schema
+-- seed.mjs                     # DB seeder (not yet run against real Supabase)
+-- .env                         # Environment variables
```

---

## 4. Environment Variables

Copy `.env.sample` ? `.env` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=any-random-secret-string
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

The app runs fine WITHOUT Supabase — all vehicle data is served from the local `vehicles-db.ts`. Auth will error if Supabase is not configured.

---

## 5. What Has Been Built

### Homepage (app/page.tsx)
- Navbar: SaaS Nepal logo (cloud icon), Find an EV, Used EVs, Cars dropdown (EV / Petrol / All Cars), Compare, Tools, Sign In ? /login
- Left sidebar filters: text search, brand, model, show-discounted toggle
- Budget pills: All / Under 20L / 30L / 40L / 50L / 60L
- Active fuel filter badge (blue=EV, orange=Petrol) with dismiss link
- Sort: Top Rated / Price Low-High / Price High-Low / Highest Range
- View toggle: Detailed / Compact card layouts
- Vehicle grid with compare checkboxes (max 4), EMI button, View Details link
- Sticky "View Compare {n}" counter badge in navbar (links to /compare)
- EMI Calculator modal: down payment %, tenure, interest rate ? monthly EMI
- Used EV Marketplace horizontal carousel
- Footer with "Copyright 2026 SaaS Nepal"
- Wrapped in <Suspense> for useSearchParams (Next.js 15 requirement)

### Comparison Page (app/compare/page.tsx)
- Hub with popular comparisons + paginated all-comparisons table
- Side-by-side spec matrix for up to 4 vehicles
- Per-column remove button (id="remove-slot-{index}" for Puppeteer)
- "Change Car" dropdown per column

### Vehicle Detail Page (app/vehicle/[id]/page.tsx)
- Full spec sheet, Nepal on-road price calculation
- Key features, color options

### Login Page (app/login/page.tsx)
- Dark glassmorphism UI (navy/blue gradient + frosted glass card)
- Sign In / Create Account tab switcher
- Google + GitHub social buttons (UI only — NOT wired to OAuth)
- Email, password (show/hide), full name (signup)
- Client-side validation + error display + loading spinner
- Currently FAKE: uses setTimeout then redirects to /

### Auth Infrastructure (lib/auth.ts)
- NextAuth v5 Credentials provider
- Reads from Supabase `users` table, compares bcrypt passwords
- JWT strategy with id + role in session
- signIn page set to /login

### Local Vehicle Database (lib/vehicles-db.ts)
15 EVs: BYD Dolphin, Atto 1, Atto 2, Atto 3, Seal, Tata Tiago EV, Nexon EV, Punch EV, Citroen E-C3, KIA EV9, XPENG G6, Wuling Bingo, Seres 3, BAW E7 Pro, Avatr 11
5 Petrol: Toyota Fortuner, Honda City, Suzuki Swift, Hyundai Creta, Kia Sonet
4 Used EV listings for the marketplace carousel

### E2E Tests (scripts/test-ui.js)
Verifies: homepage load, EMI modal, checkbox compare, /compare navigation, column removal

---

## 6. Known Issues

| Issue | Severity |
|---|---|
| No real vehicle images — all show 404 | Medium |
| Login form is fake (setTimeout + redirect) — not connected to NextAuth | HIGH |
| Google/GitHub OAuth buttons not wired | High |
| Supabase DB not set up / seeded | High |
| No route protection middleware | High |
| Claude AI not connected to any UI | Medium |
| No mobile hamburger menu | Medium |
| /results page is orphaned | Low |
| TypeScript validation skipped in build | Low |

---

## 7. Prioritised Backlog

### High Priority
1. Connect login form to NextAuth — call signIn('credentials', {email, password}) from next-auth/react instead of the fake setTimeout
2. Add middleware.ts for route protection — use auth() from lib/auth.ts
3. Set up Supabase — run init.sql, seed.mjs, fill .env
4. Add vehicle images to public/images/ (filenames: byd_dolphin.png, fortuner.png, honda_city.png, etc.)

### Medium Priority
5. Wire Google + GitHub OAuth (add providers to lib/auth.ts, hook up social buttons)
6. Mobile responsive navbar with hamburger menu
7. AI Recommendation wizard UI calling POST /api/recommend
8. Migrate vehicle data from mock DB to Supabase queries

### Lower Priority
9. Favourites/wishlist feature for signed-in users
10. Charging station map page (ChargingStation type already in types.ts)
11. News/blog page (NewsArticle type already in types.ts)
12. Brand pages /brands/[slug]
13. Fix TypeScript errors (enable type checking in next.config.ts)
14. Remove orphaned /results page
15. Add more petrol/hybrid/diesel vehicles

---

## 8. Key Design Decisions

- **Offline-first data**: All vehicles in lib/vehicles-db.ts (TS array). Supabase migration planned but not done.
- **Fuel filter via URL params**: ?fuel=ev or ?fuel=petrol. CarsDropdown sets this, HomeContent reads via useSearchParams.
- **Compare state in Zustand**: compareVehicles[] is global client state (max 4). Not persisted — clears on refresh.
- **Tax engine**: lib/tax-engine.ts calculates Nepal on-road price using Nepal-specific customs/VAT/excise tiers.
- **All main pages are "use client"**: Required for Zustand. Limits SSR/SEO but keeps interactivity simple.

---

## 9. How to Run

```powershell
# Development
cd s:\vehicle
npm run dev         # http://localhost:3000

# Production
npm run build
npm run start

# Puppeteer E2E tests
powershell -ExecutionPolicy Bypass -File scripts/run-verification.ps1
# Screenshots saved to s:\vehicle\test-results\
```
