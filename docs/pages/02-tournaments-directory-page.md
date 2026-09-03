# Page 02: Public Tournaments Directory

> **Route:** `/tournaments`  
> **Source File:** `app/tournaments/page.tsx`  
> **Access Level:** Public (Unauthenticated)  
> **Design Theme:** Dark Indigo Mesh (`slate-900 via-indigo-950 to-slate-900`)  

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
- **Background Gradient:** `bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white`.
- **Top Bar:** Translucent dark bar (`border-b border-white/10 bg-black/20 backdrop-blur`) with direct return navigation to `/`.
- **Glass Cards:** Cards use `border-white/10 bg-white/5 backdrop-blur`, glowing with an indigo border on hover (`hover:border-indigo-500/50 hover:bg-white/10`).
- **Section Headers:**
  - Active section: Crisp emerald uppercase text (`text-lg font-semibold text-emerald-400 uppercase tracking-wider`).
  - Completed section: Subdued slate uppercase text (`text-lg font-semibold text-gray-400 uppercase tracking-wider`).

### 2.2 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Trophy] FPL Tournament                               [<- Home]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   H1: Tournaments                                                           │
│   P: Browse active and completed tournaments                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ACTIVE TOURNAMENTS SECTION:                                                 │
│   ACTIVE                                                                    │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│   │ Champions Fantasy Cup        │  │ Premier Knockout 2024        │        │
│   │ Season 2024/2025             │  │ Season 2024/2025             │        │
│   │ [ACTIVE] Badge               │  │ [ACTIVE] Badge               │        │
│   │ 4 Groups • 6/12 Matches      │  │ 8 Groups • 14/28 Matches     │        │
│   │ 3 Rounds                     │  │ 5 Rounds                     │        │
│   │ View Tournament ->           │  │ View Tournament ->           │        │
│   └──────────────────────────────┘  └──────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMPLETED TOURNAMENTS SECTION:                                              │
│   COMPLETED                                                                 │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│   │ Winter Classic 2023          │  │ Summer Cup 2023              │        │
│   │ Season 2023/2024             │  │ Season 2023/2024             │        │
│   │ [FINISHED] Badge             │  │ [FINISHED] Badge             │        │
│   │ 4 Groups • 12/12 Matches     │  │ 4 Groups • 12/12 Matches     │        │
│   │ View Tournament ->           │  │ View Tournament ->           │        │
│   └──────────────────────────────┘  └──────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Directory Header Navigation
- **Branding:** Left-aligned `Trophy` icon in `indigo-400` with bold text `FPL Tournament` linking back to the home page (`/`).
- **Back Button:** Ghost button on the right containing `ArrowLeft` and label `Home`, allowing visitors to return to `/` with a single click.

### 3.2 Page Heading Block
- **Title (H1):** `text-4xl font-bold text-white`
- **Subtitle:** `text-lg text-indigo-300` explaining the directory purpose.

### 3.3 Active Section (`active.length > 0`)
- Renders only when one or more tournaments are in `PUBLISHED` status.
- Card grid displays active competitions with distinct green `ACTIVE` status pills (`variant="success"`).
- Season notation formatted as a standard football season: `Season {tournament.season}/{tournament.season + 1}`.

### 3.4 Completed Section (`finished.length > 0`)
- Renders historical tournaments with `status === "FINISHED"`.
- Features secondary slate badges (`variant="secondary"`).

### 3.5 `TournamentCard` Component Specification
- **Card Container:** Clickable Next.js `<Link href="/tournaments/[id]">` wrapper styled with Tailwind `group` utilities.
- **Title:** `text-xl font-bold text-white group-hover:text-indigo-300 transition`.
- **Season Label:** `text-sm text-gray-400`.
- **Status Badge:**
  - `ACTIVE`: Emerald badge with bold uppercase text.
  - `FINISHED`: Muted secondary badge.
- **Metric Row:** Flex row showing:
  - `{groups.length} Groups`
  - `{completedMatches}/{totalMatches} Matches`
  - `{rounds.length} Rounds`
- **CTA Indicator:** Inline footer link `View Tournament` with `ArrowRight` icon.

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
| **Mobile (< 640px)** | Single-column cards. Header padding compacts to `px-4`. Typography scales appropriately for mobile screens. |
| **Tablet (640px - 1024px)** | 2-column grid (`sm:grid-cols-2`). Cards display side-by-side with equal heights. |
| **Desktop (> 1024px)** | Centered layout within `max-w-5xl`. Hover border animations and icon translation active on pointer devices. |

---

## 6. Edge Cases & Empty States

### Zero Published Tournaments
If no tournaments have been published yet (`tournaments.length === 0`), the page presents a friendly centered empty state:
```tsx
<div className="mt-16 text-center">
  <p className="text-xl text-gray-400">No tournaments published yet</p>
  <p className="mt-2 text-gray-500">Check back later!</p>
</div>
```
