# Page 02: Public Tournaments Directory

> **Route:** `/tournaments`  
> **Source File:** `app/tournaments/page.tsx`  
> **Access Level:** Public (Unauthenticated)  
> **Design Theme:** Global FPL Design System (Premier Purple `#37003C`, Light Background `#F7F7F7`, Clean White Surfaces `#FFFFFF`, Fantasy Green `#00FF87`)  

---

## 1. Page Overview

The **Tournaments Directory Page** is the central catalog of all competitions running on the platform. It provides spectators, fantasy league managers, and tournament participants with an organized, categorized view of both currently active and historically completed tournaments.

### Primary Responsibilities
- Provide a dedicated, distraction-free directory of all published tournaments.
- Clearly separate currently running tournaments (**Active**) from archived ones (**Completed**).
- Provide instant high-level metrics for every tournament (participating groups, match progress, rounds).
- Serve as the primary navigation hub into individual tournament standings and bracket pages (`/tournaments/[id]`).

### SEO & Metadata
- **Page Title:** `Tournaments — FPL Tournament`
- **Meta Description:** `Browse published fantasy football tournaments, view scores and match results.`

---

## 2. UI & Visual Architecture

### 2.1 Theme & Aesthetics
- **Background:** Light clean canvas (`bg-[#F7F7F7] text-[#1F1F1F]`).
- **Global Header:** Sticky Premier Purple header (`bg-[#37003C] text-white border-b border-[#5A0A63]`) with active route indication.
- **Surface Cards:** Clean white surfaces (`border border-[#E5E5E5] bg-white rounded-[14px] shadow-fpl-sm hover:shadow-fpl-md hover:-translate-y-0.5 hover:border-[#37003C]/30`).
- **Section Headers:**
  - Active section: Pulsing green live dot with bold uppercase badge (`● ACTIVE`) and bold `#37003C` heading.
  - Completed section: Subdued slate uppercase badge (`COMPLETED`) with neutral `#555555` heading.
- **Visual Accent:** Fantasy gradient line beneath active heading (`from-[#00D9FF] via-[#00FF87] to-[#E7FF00]`).

### 2.2 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Trophy] FPL TOURNAMENTS      [Tournaments] [Rules] ...   [View CTA]│
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE INTRO:                                                                 │
│   [Competition Directory]                                                   │
│   H1: TOURNAMENTS                                                           │
│   P: Browse active and completed FPL competitions.                          │
│   STATS: [Active: 3]  [Completed: 1]  [Total: 4]                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ACTIVE TOURNAMENTS SECTION:                                                 │
│   ● ACTIVE                                                                  │
│   Active Tournaments                                                        │
│   Follow ongoing competitions and their current progress.                   │
│   ━━━━━━━━━━━━━━━━ (Fantasy Gradient Accent Line)                           │
│                                                                             │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│   │ [ACTIVE]             2024/25 │  │ [ACTIVE]             2024/25 │        │
│   │ Champions Fantasy Cup        │  │ Premier Knockout 2024        │        │
│   │ Custom FPL knockout ...      │  │ Custom FPL knockout ...      │        │
│   │ ──────────────────────────── │  │ ──────────────────────────── │        │
│   │  GROUPS   MATCHES   ROUNDS   │  │  GROUPS   MATCHES   ROUNDS   │        │
│   │    4       6 / 12      3     │  │    8      14 / 28      5     │        │
│   │ [██████████░░░░░░░░░░░░░░░░] │  │ [██████████░░░░░░░░░░░░░░░░] │        │
│   │ ──────────────────────────── │  │ ──────────────────────────── │        │
│   │ Bench Boost ✓ Triple Cap ✓   │  │ Bench Boost ✓ Triple Cap ✓   │        │
│   │ View Tournament            → │  │ View Tournament            → │        │
│   └──────────────────────────────┘  └──────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMPLETED TOURNAMENTS SECTION:                                              │
│   COMPLETED                                                                 │
│   Completed Tournaments                                                     │
│   Browse previous competitions and their results.                           │
│                                                                             │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│   │ [COMPLETED]          2023/24 │  │                              │        │
│   │ Winter Classic 2023          │  │                              │        │
│   │ Custom FPL knockout ...      │  │                              │        │
│   │  GROUPS   MATCHES   ROUNDS   │  │                              │        │
│   │    4      12 / 12      3     │  │                              │        │
│   │ [██████████████████████████] │  │                              │        │
│   │ Bench Boost ✓ Triple Cap ✓   │  │                              │        │
│   │ View Tournament            → │  │                              │        │
│   └──────────────────────────────┘  └──────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Global FPL Footer with Platform Links and Copyright                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Directory Header Navigation
- Uses the shared `<Header />` component (`<DesktopHeader />` and `<MobileHeader />`).
- Deep purple branding `#37003C` with active underline indicator on `/tournaments`.

### 3.2 Page Intro Header
- **Eyebrow Pill:** Soft purple container `#37003C/5` with trophy icon and uppercase `COMPETITION DIRECTORY` label.
- **Title (H1):** `text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#37003C] uppercase`.
- **Subtitle:** `text-base sm:text-lg text-[#555555] font-medium leading-relaxed max-w-[650px]`.
- **Stat Summary Strip:** 3 pills derived directly from existing server query:
  - Active: `{active.length}`
  - Completed: `{finished.length}`
  - Total: `{tournaments.length}`

### 3.3 Active Section (`tournaments.length > 0`)
- Renders active tournaments in a 2-column responsive grid (`grid gap-6 sm:grid-cols-2`).
- Eyebrow badge: pulsing green dot (`animate-fpl-pulse-dot`) + `ACTIVE`.
- Season notation formatted as a standard football season: `2024/25`.
- If `active.length === 0` but `finished.length > 0`, renders a clean dedicated section message rather than hiding the directory.

### 3.4 Completed Section (`finished.length > 0`)
- Renders historical tournaments with `status === "FINISHED"`.
- Uses `variant="completed"` on `<TournamentCard />`.
- Spaced generously (`mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-[#EAEAEA]`).

### 3.5 `TournamentCard` Component Specification
- **Card Container:** Clickable Next.js `<Link href="/tournaments/[id]">` wrapper styled with `group` utilities and visible focus rings.
- **Top Accent Line:** Subtle gradient line on top border (active: neon gradient, completed: subtle brand purple).
- **Header:** Status badge on left (`ACTIVE` / `COMPLETED`) and season notation on right (`2024/25`).
- **Title & Subtitle:** Bold title with line-clamping and category descriptor.
- **Metric Row:** 3 distinct metric boxes:
  - Groups: `{groups.length}`
  - Matches: `{completedMatches} / {totalMatches}`
  - Rounds: `{rounds.length}`
- **Match Progress Bar:** Full-width `<ProgressBar />` with ARIA progress semantics and brand color gradient.
- **Chip Rules:** Responsive badges for `Bench Boost` (`BB`) and `Triple Captain` (`TC`).
- **CTA:** `View Tournament →` in `#37003C` with hover translation.

---

## 4. Technical Specifications & Data Flow

### 4.1 Server-Side Database Query
```typescript
const tournaments = await prisma.tournament.findMany({
  where: {
    status: { in: ["PUBLISHED", "FINISHED"] },
  },
  include: {
    groups: true,
    rounds: {
      include: { matches: true },
      orderBy: { roundNumber: "asc" },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### 4.2 Match Progress Calculation
```typescript
const totalMatches = tournament.rounds.reduce((acc, r) => acc + r.matches.length, 0);
const completedMatches = tournament.rounds.reduce(
  (acc, r) =>
    acc +
    r.matches.filter(
      (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
    ).length,
  0
);
```

### 4.3 Security & Access Rules
- **Draft Isolation:** Tournaments with `status: "DRAFT"` are strictly filtered out in the database query. Unauthorized users cannot view unverified or unpublished tournament setups.

---

## 5. Responsive Behavior

| Screen Size | Behavior |
| :--- | :--- |
| **Mobile (< 640px)** | Single-column cards. Header collapses to hamburger menu. Stat strip wraps neatly. Chip rule labels collapse to abbreviations (`BB`, `TC`). |
| **Tablet (640px - 1024px)** | 2-column grid (`sm:grid-cols-2`). Cards display side-by-side with equal heights. Full chip labels shown. |
| **Desktop (> 1024px)** | 2-column grid within global container (`max-w-7xl`). Subtle hover elevation and arrow transition active on pointer devices. |

---

## 6. Edge Cases & Empty States

### Zero Published Tournaments
If no tournaments have been published yet (`tournaments.length === 0`), the page presents a centered empty state card with trophy icon and a return to home button:
```tsx
<div className="rounded-[16px] border border-[#E5E5E5] bg-white p-10 sm:p-14 text-center shadow-fpl-sm max-w-lg mx-auto mt-4">
  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/10 text-[#37003C] mb-4">
    <Trophy className="h-7 w-7 text-[#37003C]" />
  </div>
  <h2 className="text-xl font-black text-[#37003C] uppercase tracking-tight">
    No Tournaments Yet
  </h2>
  <p className="mt-2 text-sm text-[#777777] max-w-sm mx-auto leading-relaxed">
    There are no published tournaments available at the moment. Check back later for upcoming competitions.
  </p>
  <div className="mt-6">
    <Button asChild variant="primary" size="default" className="font-extrabold">
      <Link href="/">Return to Home</Link>
    </Button>
  </div>
</div>
```

