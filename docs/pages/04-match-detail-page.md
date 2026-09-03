# Page 04: Public Match Detail & Head-to-Head Squad View

> **Route:** `/matches/[id]`  
> **Source File:** `app/matches/[id]/page.tsx`  
> **Access Level:** Public (Unauthenticated, Draft tournaments blocked via 404)  
> **Design Theme:** Dark Cosmic Glassmorphism (`slate-900 via-indigo-950 to-slate-900`)  

---

## 1. Page Overview

The **Match Detail & Head-to-Head Squad View Page** provides an exhaustive, forensic breakdown of an individual head-to-head match between two FPL Classic Leagues. It shows the live or final match scoreboard, outcome points, transfer deductions, chip adjustments (such as Bench Boost exclusions or Triple Captain reductions), strict admin exclusions, and individual manager contributions.

### Primary Responsibilities
- Deliver a dedicated match scoreboard with club crests, match status, and league points awarded (+3, +1, 0).
- Present side-by-side roster breakdowns for both competing leagues.
- Itemize each manager's Gameweek points, active chips, and chip penalty adjustments.
- Visually demonstrate compliance with the **Strict Admin Exclusion Rule**, showing admin points struck through and isolated.
- Provide direct interactivity into each manager's 15-player tactical squad lineup via `<FantasyTeamModal />`.

### SEO & Metadata
- **Dynamic Title:** `{Home Team} vs {Away Team} — {Tournament Name}`
- **Dynamic Description:** `Match {matchNumber}: {Home Team} vs {Away Team} in {Round Name}.`

---

## 2. UI & Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Trophy] FPL Tournament                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [<- Back to {Tournament Name}]                                              │
│                                                                             │
│ MATCH SCOREBOARD HERO CARD:                                                 │
│   Round 1 · Gameweek 1                                                      │
│                                                                             │
│   [Logo] London Gunners (+3 PTS)   [ 182 - 145 ]   (+0 PTS) Merseyside [Logo]│
│                                                                             │
│   🏆 London Gunners WINS (+3 PTS)                                           │
│   [FINALIZED] Status Badge                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ SIDE-BY-SIDE DETAILED SCORE BREAKDOWNS:                                     │
│                                                                             │
│ ┌───────────────────────────────┐   ┌───────────────────────────────┐       │
│ │ 🛡️ London Gunners        182  │   │ 🛡️ Merseyside Reds       145  │       │
│ ├───────────────────────────────┤   ├───────────────────────────────┤       │
│ │ INCLUDED MEMBERS:             │   │ INCLUDED MEMBERS:             │       │
│ │ • Manager 1 (Team A)   [Squad]│   │ • Manager 4 (Team D)   [Squad]│       │
│ │   [TC] (-12 pts)        64 pts│   │   Normal Captain        48 pts│       │
│ │ • Manager 2 (Team B)    58 pts│   │ • Manager 5 (Team E)    51 pts│       │
│ │ • Manager 3 (Team C)    60 pts│   │ • Manager 6 (Team F)    46 pts│       │
│ │ ───────────────────────────── │   │ ───────────────────────────── │       │
│ │ TOTAL:                    182 │   │ TOTAL:                    145 │       │
│ │                               │   │                               │       │
│ │ ⚠️ ADMIN — EXCLUDED FROM SCORE │   │ ⚠️ ADMIN — EXCLUDED FROM SCORE │       │
│ │ • Admin User (Admin)   ~~42~~ │   │ • Admin User (Admin)   ~~42~~ │       │
│ └───────────────────────────────┘   └───────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Return Navigation
- Ghost button with `ArrowLeft` icon routing back to parent tournament: `<Link href={`/tournaments/${tournament.id}`}>`.
- Text displays the tournament's full name, reinforcing navigational breadcrumb context.

### 3.2 Match Scoreboard Hero Card
- **Round & Gameweek Indicator:** `text-sm text-gray-400` (e.g. `Quarter-Final · Gameweek 28`).
- **Matchup Columns:**
  - **Home Team (Left):** Name, custom club logo (or initial badge), outcome badge:
    - Win: Emerald badge with `Sparkles` icon: `+3 PTS (Win)`.
    - Draw: Amber badge with `Handshake` icon: `+1 PT (Draw)`.
    - Loss: Subdued gray label: `0 PTS (Loss)`.
  - **Score Center:** Prominent scoreboard box:
    - Completed/Live: `font-mono text-3xl sm:text-4xl font-bold text-white tracking-wider` displaying `{homeScore} - {awayScore}`.
    - Not Scored Yet: Clean `VS` label in muted gray.
  - **Away Team (Right):** Mirrors the home team structure with right-aligned layout.
- **Result Announcement Banner:**
  - `Trophy` icon with green text: `{Winner Name} WINS (+3 PTS)`.
  - `Handshake` icon with yellow text: `MATCH DRAW (1 PT each)`.
- **Status Badge:** Pill showing `FINALIZED`, `COMPLETED`, or `SCHEDULED`.

### 3.3 Detailed Score Breakdown (`MatchScoreBreakdown`)
Two side-by-side cards comparing the exact member point contributions:
- **Card Header:** Club crest, team name (highlighted in emerald if winner), total team score in large monospace numbers.
- **Included Members List:**
  - Manager name and official FPL team name.
  - **Chip Badges:** Yellow warning badge displaying `Bench Boost`, `Triple Captain`, `Free Hit`, or `Wildcard`.
  - **Chip Deductions:** Red/Amber callout explaining point deductions:
    - E.g. `(-16 pts bench excluded)` when Bench Boost is disabled by tournament rules.
    - E.g. `(-12 pts chip adjustment)` when Triple Captain is reduced from 3x to standard 2x captaincy.
  - **Interactive Squad View Button:** Eye icon with label `Squad`. Hovering displays an interactive glow; clicking opens `<FantasyTeamModal />` with the manager's live pitch view.
  - **Gameweek Points Pill:** High-contrast badge with the manager's net counted points.
- **Team Total Row:** Bold divider separating the individual roster from the official team sum.
- **Admin Exclusion Box:**
  - Highlighted yellow callout container (`bg-yellow-500/10 border-yellow-500/20`).
  - Heading: `Admin — Excluded from Score`.
  - Displays the tournament organizer's manager name with italic styling.
  - Admin's gameweek points are explicitly shown with a strikethrough line (`line-through opacity-75`).
  - Includes an Eye icon allowing spectators to inspect the admin's squad while proving their score had zero impact on the match outcome.

---

## 4. Technical Logic & Business Calculations

### 4.1 Server-Side Data Query
```typescript
const match = await prisma.match.findUnique({
  where: { id },
  include: {
    round: {
      include: {
        tournament: true,
      },
    },
    homeGroup: {
      include: { members: true },
    },
    awayGroup: {
      include: { members: true },
    },
    scores: {
      include: { member: true },
    },
  },
});
```

### 4.2 Score Sorting & Separation
Scores are partitioned into **Included** and **Excluded (Admin)** sets:
```typescript
const homeScores = match.scores
  .filter((s) => s.member.groupId === match.homeGroupId)
  .sort((a, b) => {
    if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
    return b.gameweekPoints - a.gameweekPoints;
  });
```

### 4.3 Chip Deduction Formulas
- **Bench Boost Exclusion (when `allowBenchBoost: false`):**
  $$\text{Deduction} = \sum_{\text{bench players}} \text{player points}$$
- **Triple Captain Reduction (when `allowTripleCaptain: false`):**
  $$\text{Deduction} = \text{Captain Points} \times 1 \quad (\text{reducing 3x to 2x})$$
- **Net Team Score:**
  $$\text{Team Score} = \sum_{m \in \text{non-admin}} (\text{Gross FPL Points}_m - \text{Transfer Cost}_m - \text{Chip Deduction}_m)$$

---

## 5. Responsive Behavior

| Screen Size | Layout Adaptations |
| :--- | :--- |
| **Mobile (< 640px)** | Scoreboard stacks team names above the score digits. Detailed score breakdowns stack vertically (Home team breakdown followed by Away team breakdown). |
| **Tablet & Desktop (>= 768px)** | Scoreboard displays horizontal layout. Score breakdowns display side-by-side in a 2-column grid (`grid-cols-2`). |

---

## 6. Edge Cases & Error Handling

1. **Match Belongs to Draft Tournament:**
   - If `match.round.tournament.status === "DRAFT"`, Next.js throws `notFound()`, ensuring public users cannot inspect unpublished matches.
2. **Unplayed / Future Match:**
   - When `homeScore === null`, the page shows an empty state card:
     ```tsx
     <Card className="mt-8 border-white/10 bg-white/5 p-8 text-center text-white backdrop-blur">
       <p className="text-gray-400">Scores have not been calculated yet.</p>
       <p className="mt-2 text-sm text-gray-500">Scores will appear once the Gameweek is complete.</p>
     </Card>
     ```
