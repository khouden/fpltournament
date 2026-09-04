# Page 04: Public Match Detail & Head-to-Head Squad View

> **Route:** `/matches/[id]`  
> **Source File:** `app/matches/[id]/page.tsx`  
> **Access Level:** Public (Unauthenticated, Draft tournaments blocked via 404)  
# Page 04: Public Match Detail & Head-to-Head Squad View

> **Route:** `/matches/[id]`  
> **Source File:** `app/matches/[id]/page.tsx`  
> **Access Level:** Public (Unauthenticated, Draft tournaments blocked via 404)  
> **Design Theme:** Official FPL Light (`#F7F7F7` canvas, `#FFFFFF` surfaces, `#37003C` Deep Premier Purple, `#00FF87` Fantasy Green)  

---

## 1. Page Overview

The **Match Detail & Head-to-Head Squad View Page** provides an exhaustive, forensic breakdown of an individual head-to-head match between two FPL Classic Leagues. It delivers a broadcast-quality Match Center scoreboard, outcome points (+3 Win, +1 Draw, 0 Loss), transfer deductions, chip adjustments (such as Bench Boost exclusions or Triple Captain reductions), strict admin exclusions, and individual manager contributions with full squad inspection.

### Primary Responsibilities
- Deliver a dedicated Match Center hero card with club crests, match status badges, large Poppins score (`{homeScore} – {awayScore}`), and outcome point badges.
- Present side-by-side roster breakdowns for both competing leagues in a 2-column desktop grid.
- Itemize each manager's Gameweek points, active chips, and chip penalty adjustments with explicit reasons.
- Visually enforce the **Strict Admin Exclusion Rule**, isolating organizer points with strikethrough styling while keeping 15-player squads inspectable.
- Provide direct interactivity into each manager's 15-player tactical squad lineup via `<FantasyTeamModal />` (supporting Pitch and List views).
- Handle scheduled/unplayed matches cleanly with `VS` and an informative empty state card.

### SEO & Metadata
- **Dynamic Title:** `{Home Team} vs {Away Team} — {Tournament Name}`
- **Dynamic Description:** `Match {matchNumber}: {Home Team} vs {Away Team} in {Round Name}.`

---

## 2. UI & Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Trophy] FPL TOURNAMENTS (Global Header)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [← Back to {Tournament Name}]                                               │
│                                                                             │
│ MATCH CENTER HERO CARD:                                                     │
│   Quarter-Final · Gameweek 28                                   [FINALIZED] │
│                                                                             │
│   Barcelona   [Logo]               244 – 215             [Logo]   Liverpool │
│   [+3 PTS · WIN]                                               [0 PTS · LOSS]│
│                                                                             │
│               🏆 Barcelona WINS (+3 tournament points)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ MATCH SCORE BREAKDOWN                                                       │
│ See how each manager contributed to the final team score.                   │
│                                                                             │
│ ┌───────────────────────────────┐   ┌───────────────────────────────┐       │
│ │ 🛡️ Barcelona  [WINNER +3] 244 │   │ 🛡️ Liverpool              215 │       │
│ ├───────────────────────────────┤   ├───────────────────────────────┤       │
│ │ INCLUDED MANAGERS             │   │ INCLUDED MANAGERS             │       │
│ │ • Hamza (Hamza XI)            │   │ • Tariq (Tariq XI)            │       │
│ │   [Triple Captain]            │   │                               │       │
│ │   −12 pts (TC adjustment)     │   │                               │       │
│ │   [70 pts]            [Squad] │   │   [56 pts]            [Squad] │       │
│ │ • Youssef (Youssef FC)        │   │ • Nabil (Nabil FC)            │       │
│ │   [65 pts]            [Squad] │   │   [55 pts]            [Squad] │       │
│ │ ───────────────────────────── │   │ ───────────────────────────── │       │
│ │ TEAM TOTAL                244 │   │ TEAM TOTAL                215 │       │
│ │                               │   │                               │       │
│ │ ⚠️ ADMIN — EXCLUDED FROM SCORE │   │ ⚠️ ADMIN — EXCLUDED FROM SCORE │       │
│ │ • Admin User (Admin)          │   │ • Admin User (Admin)          │       │
│ │   [EXCLUDED] ~~40 pts~~ [Squad│   │   [EXCLUDED] ~~40 pts~~ [Squad│       │
│ └───────────────────────────────┘   └───────────────────────────────┘       │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Global FPL Tournament Footer                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Global Header & Return Navigation
- **Global Header:** Reuses the shared sticky `<Header />` with brand gradient bar, navigation links, and action button.
- **Breadcrumb Navigation:** Secondary button with `ArrowLeft` icon routing back to parent tournament: `<Link href={`/tournaments/${tournament.id}`}>`. Displays `Back to {tournament.name}` with purple hover state.

### 3.2 Match Center Hero Card
- **Round & Gameweek Indicator:** Uppercase tracking-wider label (e.g., `Round 1 · Gameweek 5`).
- **Match Status Badge:**
  - `FINALIZED`: Emerald badge (`bg-[#00FF87]/20 text-[#008744] border-[#00FF87]/40`).
  - `COMPLETED`: Deep purple badge (`bg-[#37003C]/10 text-[#37003C] border-[#37003C]/20`).
  - `SCHEDULED`: Neutral gray badge (`bg-[#F3F4F6] text-[#666666] border-[#E5E5E5]`).
- **Matchup Columns:**
  - **Home Team (Left):** Custom crest (64–88px on clean white rounded badge) or initial fallback, bold Poppins team name, outcome badge.
  - **Score Center:** High-contrast Poppins font (`text-4xl sm:text-5xl font-black text-[#37003C]`) displaying `{homeScore} – {awayScore}`. If unscored, displays `VS`.
  - **Away Team (Right):** Mirrors home team layout.
  - **Outcome Badges:**
    - Winner: `+3 PTS · WIN` (Emerald pill with `Sparkles`).
    - Draw: `+1 PT · DRAW` (Amber pill with `Handshake`).
    - Loss: `0 PTS · LOSS` (Neutral gray pill).
- **Result Announcement Banner:**
  - Winner: `🏆 {Winner Name} WINS (+3 tournament points)` with green tint.
  - Draw: `🤝 MATCH DRAW — 1 tournament point awarded to each team` with amber tint.

### 3.3 Detailed Score Breakdown (`MatchScoreBreakdown`)
Two side-by-side white cards comparing member point contributions:
- **Card Header:** Club crest, team name (highlighted with subtle green top border for winner), contributing manager count, and team total score in strong Poppins.
- **Included Managers Section:**
  - Section label: `INCLUDED MANAGERS`.
  - Manager sub-cards with `#F9F9F9` background, `#EEEEEE` border, and hover elevation.
  - Manager name & official FPL team name.
  - **Chip Badges:** Compact semantic badges (`Bench Boost`, `Triple Captain`, `Free Hit`, `Wildcard`).
  - **Chip Deductions:** Explicit reason callouts explaining point adjustments (e.g. `−16 pts (Bench players excluded)` or `−12 pts (Triple Captain adjustment)`).
  - **Points Pill:** High-contrast numeric pill (`bg-[#37003C]/5 text-[#37003C] font-bold text-sm px-2.5 py-1`).
  - **Squad Button:** Visible `[ Eye + Squad ]` button opening `<FantasyTeamModal />` for tactical squad lineup inspection.
- **Team Total Row:** Bold divider separating individual roster from official team sum.
- **Admin Exclusion Box:**
  - Amber callout container (`bg-[#FFFBEB] border-[#FDE68A]`).
  - Heading: `ADMIN — EXCLUDED FROM SCORE`.
  - Explanatory copy: `Organizer Account · This score does not affect the official team total. Admin squad remains inspectable below.`
  - Admin points shown with explicit strikethrough (`line-through opacity-60`).
  - Functional `[ Eye + Squad ]` button allowing spectators to inspect the admin's lineup.

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
| **Mobile (< 640px)** | Scoreboard stacks teams vertically above score digits with centered crests. Score breakdown cards stack in 1 column. Manager rows stack info above points pill and Squad action button. |
| **Tablet (640px – 1023px)** | Match hero displays horizontal scoreboard. Score breakdown cards adapt to available width. |
| **Desktop (>= 1024px)** | Match hero displays centered horizontal matchup with max-width container. Score breakdowns display side-by-side in a 2-column grid (`grid-cols-2`). |

---

## 6. Edge Cases & Error Handling

1. **Match Belongs to Draft Tournament:**
   - If `match.round.tournament.status === "DRAFT"`, Next.js throws `notFound()`, ensuring public users cannot inspect unpublished matches.
2. **Unplayed / Future Match:**
   - When `homeScore === null`, the hero displays `VS` and status `SCHEDULED`, and the breakdown section displays a clean light card:
     ```tsx
     <Card className="rounded-2xl border border-[#E5E5E5] bg-white p-8 sm:p-12 text-center shadow-xs space-y-3">
       <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
         <Clock className="h-6 w-6" />
       </div>
       <h3 className="text-lg font-bold text-[#1F1F1F]">Scores not calculated yet</h3>
       <p className="text-sm text-[#666666] max-w-md mx-auto">Scores will appear once Gameweek {gameweek} is complete and official FPL points are synced.</p>
     </Card>
     ```

