# Page 11: Admin Schedule & Fixtures Builder

> **Route:** `/admin/tournaments/[id]/schedule`  
> **Source File:** `app/admin/tournaments/[id]/schedule/page.tsx`  
> **Component File:** `components/schedule-builder.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Clean Light Administrative Theme (`bg-gray-100`, cards `bg-white`)  

---

## 1. Page Overview

The **Admin Schedule & Fixtures Builder Page** is the competition engine room. It provides tournament organizers with both automated and granular manual controls to generate tournament rounds, schedule head-to-head fixtures, assign official FPL Gameweeks, recalculate live match scores from the official Premier League API, and finalize results.

### Primary Responsibilities
- **Automated Round-Robin Generation:** Generate a mathematically balanced round-robin tournament schedule with a single click using the Berger pairing algorithm.
- **Manual Fixture Creation & Editing:** Create custom rounds, associate them with specific FPL Gameweeks (1–38), add matchups, and swap home/away pairings.
- **On-Demand FPL Score Recalculation:** Pull live points, transfer costs, and chip data from the FPL API for any individual match or bulk-recalculate the entire tournament.
- **Result Finalization & Locking:** Transition matches from `SCHEDULED` to `COMPLETED` and ultimately to `FINALIZED` to lock scores and protect historical records.
- **Schedule Validation Engine:** Verify the schedule for structural defects (e.g. teams playing twice in the same round, bye games, unassigned groups).

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [Trophy] Fantasy Leagues Admin     admin@test.com  [Logout]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Champions Cup / Schedule               [<- Groups]  │
│ H1: Tournament Schedule                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT CONTEXT:                                                         │
│   Season 2024 · 4 groups · 6 matches · [PUBLISHED]                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCHEDULE ACTIONS TOOLBAR:                                                   │
│   [⚡ Auto-Generate Round-Robin]  [+ Add Round]  [🔄 Recalculate All] [✓ Valid]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ROUND-ROBIN GENERATOR DRAWER (Collapsible):                                 │
│   Start Gameweek: [ 1 ]  (Will schedule GW1, GW2, GW3...)                   │
│   [ Generate Complete Schedule Button ]                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ROUNDS & FIXTURES CONTAINER:                                                │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ROUND 1: Gameweek 1                                  [🗑️ Delete Round]  │ │
│ │ Matches: (2)                                             [+ Add Match]  │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ MATCH 1:                                                                │ │
│ │ [ London Gunners (Home) ]  vs  [ Merseyside Reds (Away) ]               │ │
│ │ Score: 72 - 58                          Status: [FINALIZED]             │ │
│ │ [🔄 Recalculate Score]  [🔒 Finalize Match]  [👁️ View Match] [🗑️ Delete] │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ MATCH 2:                                                                │ │
│ │ [ Red Devils FC (Home) ]   vs  [ Cityzen Blues (Away) ]                 │ │
│ │ Score: 65 - 65                          Status: [FINALIZED]             │ │
│ │ [🔄 Recalculate Score]  [🔒 Finalize Match]  [👁️ View Match] [🗑️ Delete] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Workflows

### 3.1 Quick Tools Action Bar
- **Auto-Generate Round-Robin Button (`Zap` icon):** Expands the automated generator drawer.
- **Add Round Button (`Plus` icon):** Opens inline round creation inputs (Round Name and Gameweek number).
- **Recalculate All Scores (`RefreshCw` icon):** Bulk-triggers live FPL API recalculations for every match in the tournament.
- **Validate Schedule (`CheckCircle2` icon):** Runs the automated validation engine and displays a pass badge or an itemized defect checklist.

### 3.2 Automated Round-Robin Generator
- Prompts the organizer for the **Start Gameweek** (number input, 1–38).
- If existing rounds exist, displays a safety confirmation prompt: `"Auto-generating will replace all existing rounds and matches with a fresh round-robin schedule. Continue?"`.
- Applies the canonical Berger / circle rotation algorithm:
  - Even group count ($N$): produces $N - 1$ rounds, with $N / 2$ matches per round.
  - Odd group count ($N$): introduces a bye mechanism to ensure balanced scheduling.
- Reloads the page with the newly generated rounds and fixtures.

### 3.3 Manual Round & Match Management
- **Round Card Header:**
  - Round title (e.g. `Round 1 - Opening Fixtures`).
  - Gameweek indicator badge (`Gameweek {round.gameweek}`).
  - `Add Match` button (`Plus` icon) to append a new match to this round.
  - `Delete Round` button (`Trash2` icon) with cascading deletion of child matches.
- **Match Card Controls:**
  - **Home & Away Team Selectors:** Two dropdown menus populated with all imported tournament groups.
  - **Live Score Display:** Shows current calculated scores (`{homeScore} - {awayScore}`) or `Not Calculated`.
  - **Status Badge:** `SCHEDULED` (gray), `COMPLETED` (indigo), or `FINALIZED` (emerald).
  - **Recalculate Button (`RefreshCw`):** Fetches the latest live Gameweek points for members of both groups from the official FPL API, executes chip adjustments and admin exclusions, and updates the database.
  - **Finalize Button (`CheckCircle2`):** Locks the match. Finalized matches cannot be accidentally overwritten by bulk recalculation runs.
  - **Delete Match Button (`Trash2`):** Deletes the fixture pairing.
  - **Public Link (`ExternalLink`):** Direct shortcut to preview the public match scoreboard at `/matches/[id]`.

---

## 4. Technical Logic & Server Actions

### 4.1 Automated Round-Robin Generator (`generateRoundRobinScheduleAction`)
```typescript
export async function generateRoundRobinScheduleAction(
  tournamentId: string,
  startGameweek: number
) {
  // 1. Fetches all groups for the tournament.
  // 2. Deletes existing rounds and matches inside a Prisma transaction.
  // 3. Executes round-robin circle algorithm.
  // 4. Creates Round records assigned to consecutive Gameweeks (startGameweek, startGameweek + 1, ...).
  // 5. Generates Match records pairing Home and Away groups.
}
```

### 4.2 Score Recalculation Engine (`recalculateMatchAction`)
Executes the full scoring pipeline:
1. Identifies the match's Gameweek and tournament chip rules (`allowBenchBoost`, `allowTripleCaptain`).
2. Fetches the live squad picks and gross points for all members of both groups via `getManagerPicks(fplId, gameweek)`.
3. Deducts transfer penalty costs (`event_transfers_cost`).
4. Calculates active chip impact:
   - If `bboost` played and `allowBenchBoost === false`: excludes bench points.
   - If `3xc` played and `allowTripleCaptain === false`: reduces captain multiplier to 2x.
5. Strictly excludes any member flagged as a tournament admin (`isExcluded: true`).
6. Sums the remaining player scores to produce `homeScore` and `awayScore`.
7. Updates match status to `COMPLETED` and assigns `result: "HOME_WIN" | "AWAY_WIN" | "DRAW"`.

### 4.3 Schedule Validation Engine (`validateScheduleAction`)
Verifies:
- Minimum of 2 participating groups.
- No round contains duplicate teams playing twice in the same Gameweek.
- Every group has an equal number of home and away fixtures.

---

## 5. Responsive Behavior

- **Mobile (< 768px):** Action bar buttons wrap onto multiple rows. Match card pairings stack vertically (Home dropdown above Away dropdown). In-card action buttons collapse into icon-first buttons.
- **Desktop (>= 768px):** Clean side-by-side dropdown selectors with central `vs` badge, spacious action toolbars, and flush status indicators.

---

## 6. Edge Cases & Resilience

1. **Groups Count < 2:**
   - Displays a prominent amber warning alert: `"You need at least 2 groups to create matches. Import groups first."` and disables the generator.
2. **FPL API Delay / Mid-Gameweek Recalculation:**
   - Can be triggered repeatedly during a live Gameweek; scores update dynamically as bonus points and substitutions are processed on the Premier League servers.
3. **Locking Results:**
   - Once marked `FINALIZED`, the match is immune to inadvertent score drift.
