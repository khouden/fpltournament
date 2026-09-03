# Page 01: Home / Landing Page

> **Route:** `/`  
> **Source File:** `app/page.tsx`  
> **Layout File:** `app/layout.tsx`  
> **Access Level:** Public (Unauthenticated)  
> **Design Theme:** Dark Cosmic Glassmorphism (`slate-950 via-indigo-950 to-slate-900`)  

---

## 1. Page Overview

The **Home / Landing Page** serves as the public front door to the FPL Tournament platform. It introduces the application's unique value proposition—custom head-to-head knockout and league tournaments between Fantasy Premier League (FPL) Classic Leagues with automated points calculation, strict admin exclusion, and configurable chip rules.

### Target Personas
- **👀 Public Visitors & Spectators:** Want to quickly discover active competitions, view tournament progress, and access live matches.
- **⚽ Participating Fantasy Managers:** Looking for their league's tournament standings, upcoming gameweek matchups, and squad points.
- **👑 Tournament Organizers (Admins):** Navigating through the public experience to inspect how published tournaments appear to their community.

### SEO & Metadata
- **Page Title:** `FPL Tournaments — Custom Fantasy Premier League Knockout Tournaments`
- **Meta Description:** `Follow custom knockout tournaments between FPL Classic Leagues with automatic score calculation and admin exclusion.`

---

## 2. UI & Visual Architecture

### 2.1 Visual Atmosphere & Design Tokens
- **Background:** Deep cosmic midnight gradient with subtle indigo glow: `bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white`.
- **Card Surfaces:** Semi-transparent glassmorphic panels: `border-white/10 bg-white/5 backdrop-blur shadow-lg`.
- **Hover Micro-interactions:** Glowing border shifts: `hover:border-indigo-500/50 hover:bg-white/10 transition duration-200`.
- **Color Accents:**
  - `Emerald (#10B981)`: Live pulsing indicator, active tournament badges, positive status indicators.
  - `Indigo (#6366F1 / #818CF8)`: Brand primary, CTA buttons, hero badges, borders.
  - `Amber (#F59E0B)`: Triple captain badges, scoring rule highlights.
  - `Rose (#F43F5E)`: Disabled chip indicators.

### 2.2 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STICKY NAVBAR: [Trophy] FPL TOURNAMENTS             [All Tournaments Button]│
├─────────────────────────────────────────────────────────────────────────────┤
│ HERO SECTION:                                                               │
│   [Badge: Fantasy Premier League Tournament Engine]                         │
│   H1: Custom Knockout Tournaments for FPL Leagues                           │
│   P: Automated Gameweek score calculations, strict Admin points exclusion...│
│   [CTA Button: Browse Tournaments ->]                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ACTIVE TOURNAMENTS SECTION:                                                 │
│   (● Live Pulse) Active Tournaments                         [X Live Badge]  │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│   │ Tournament Card 1            │  │ Tournament Card 2            │        │
│   │ • Season 2024                │  │ • Season 2024                │        │
│   │ • Status: ACTIVE             │  │ • Status: ACTIVE             │        │
│   │ • BB: [✓] | TC: [✓]          │  │ • BB: [✓] | TC: [✗]          │        │
│   │ • 4 Groups • 12/24 Matches   │  │ • 8 Groups • 4/56 Matches    │        │
│   │ View Tournament ->           │  │ View Tournament ->           │        │
│   └──────────────────────────────┘  └──────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMPLETED TOURNAMENTS SECTION (Conditional):                                │
│   Completed Tournaments                                [X Completed Badge]  │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│   │ Finished Tournament Card     │  │ Finished Tournament Card     │        │
│   └──────────────────────────────┘  └──────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│ HOW FPL TOURNAMENT SCORING WORKS (Explainer Card):                          │
│   [1. Group Score]            [2. Admin Exclusion]     [3. Chips & Progress]│
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: FPL Tournament MVP · Powered by Fantasy Premier League API data     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Breakdown

### 3.1 Sticky Glass Navbar
- **Positioning:** Sticky at top of viewport (`sticky top-0 z-50`), blurred translucent backing (`border-b border-white/10 bg-black/30 backdrop-blur`).
- **Brand Element:** Clickable logo linking to `/`, featuring `Trophy` icon in `indigo-400` with uppercase bold typography: `FPL TOURNAMENTS`.
- **Navigation Action:** Button linking directly to `/tournaments` with ghost styling (`text-gray-300 hover:text-white hover:bg-white/10`).

### 3.2 Hero Banner
- **Eyebrow Badge:** Pill-shaped badge featuring `Trophy` icon: `Fantasy Premier League Tournament Engine` with `bg-indigo-500/20 text-indigo-300 border-indigo-500/30`.
- **Primary Heading (H1):** Responsive display title (`text-4xl sm:text-6xl font-black tracking-tight text-white`).
- **Lead Subtitle:** Contextual copy explaining core automation features (`Automated Gameweek score calculations, strict Admin points exclusion, and live knockout progression tracking.`).
- **Hero CTA:** Prominent indigo button with `ArrowRight` icon and glow shadow (`shadow-lg shadow-indigo-500/25`), routing visitors to `/tournaments`.

### 3.3 Active Tournaments Showcase
- **Header with Live Pulsing Dot:** Displays an animated green dot (`h-3 w-3 rounded-full bg-emerald-500 animate-pulse`), section heading `Active Tournaments`, and an active count badge (`X Live`).
- **Tournament Cards Grid:** 2-column responsive grid (`grid gap-4 sm:grid-cols-2`).
- **Individual `TournamentCard` Structure:**
  - **Tournament Title:** High-contrast white text, transitions to `indigo-300` on card hover.
  - **Season Indicator:** Subtitle displaying `Season {tournament.season}`.
  - **Status Badge:** Green `ACTIVE` badge (`variant="success"`).
  - **Chip Configuration Pill:** Monospace indicators showing active rules:
    - `BB:` Green checkmark `Check` if Bench Boost allowed, Red `X` if disabled.
    - `TC:` Green checkmark `Check` if Triple Captain 3x allowed, Red `X` if reduced to 2x.
  - **Metric Counters:** Footer row with metadata counts:
    - `{groups.length} Groups`
    - `{completedMatches}/{totalMatches} Matches`
    - `{rounds.length} Rounds`
  - **Action Link:** Inline text `View Tournament` paired with `ArrowRight` icon that translates horizontally on hover.

### 3.4 Completed Tournaments Section
- Only renders if finished tournaments exist (`finished.length > 0`).
- Features a subdued gray badge (`{finished.length} Completed`) and historical cards linking to finalized tournament brackets and standings tables.

### 3.5 Scoring Rules Overview Card
A 3-column educational card (`grid gap-6 sm:grid-cols-3`) providing instant clarity on tournament mechanics:
1. **1. Group Score:** Explains that each group represents an FPL Classic League, and group score equals the sum of all members' Gameweek points.
2. **2. Admin Exclusion:** Explains that the organizer joins every league to manage data, but their points are strictly excluded from all scores.
3. **3. Chips & Progression:** Details how Bench Boost and Triple Captain rules operate, and how head-to-head match results dictate standings and progression.

### 3.6 Footer
- Minimalist centered footer with subtle border (`border-t border-white/10 py-8 text-center text-xs text-gray-500`).
- Text: `FPL Tournament MVP · Powered by Fantasy Premier League API data`.

---

## 4. Technical Specifications & Data Flow

### 4.1 Server-Side Data Query (Prisma)
This page executes as a React Server Component (RSC), fetching data directly on the server without client-side waterfalls:

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

### 4.2 Status Filtering
- `active = tournaments.filter((t) => t.status === "PUBLISHED")`
- `finished = tournaments.filter((t) => t.status === "FINISHED")`
- Tournaments in `DRAFT` status are strictly filtered out from the database query and are never visible to the public.

### 4.3 Match Completion Computation
For each tournament card, match completion is calculated on the fly:
```typescript
const totalMatches = tournament.rounds.reduce((acc, r) => acc + r.matches.length, 0);
const completedMatches = tournament.rounds.reduce(
  (acc, r) => acc + r.matches.filter((m) => m.status === "COMPLETED" || m.status === "FINALIZED").length,
  0
);
```

---

## 5. Responsive Breakpoints & Mobile Adaptations

| Screen Width | Layout & Adaptations |
| :--- | :--- |
| **Mobile (< 640px)** | Single-column tournament card layout. Hero heading drops to `text-4xl`. Rules card stacks vertically into 3 single rows. Sticky header maintains compact padding. |
| **Tablet (640px - 1024px)** | 2-column grid for active/completed tournament cards. Hero heading expands to `text-6xl`. Scoring rules card splits into 3 columns. |
| **Desktop (> 1024px)** | Maximum container constraint `max-w-5xl` centered with generous vertical spacing (`py-16 sm:py-24`). Hover micro-animations on cards and links fully enabled. |

---

## 6. Edge Cases & Empty States

1. **Zero Active Tournaments:**
   - When no tournaments have `status === "PUBLISHED"`, an empty state card renders:
     ```tsx
     <Card className="border-white/10 bg-white/5 p-8 text-center backdrop-blur">
       <p className="text-gray-400">No active tournaments published at the moment.</p>
       <p className="mt-2 text-xs text-gray-500">Check back soon for upcoming tournaments and fixtures!</p>
     </Card>
     ```
2. **Zero Completed Tournaments:**
   - The entire `Completed Tournaments` section is conditionally omitted from the DOM to keep the page clean and clutter-free.
3. **Database Unavailability:**
   - Handled gracefully via Next.js standard error boundary, preventing partial or broken hydration.
