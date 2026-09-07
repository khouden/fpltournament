# Page 11: Admin Schedule & Fixtures Builder

> **Route:** `/admin/tournaments/[id]/schedule`  
> **Source File:** `app/admin/tournaments/[id]/schedule/page.tsx`  
> **Component Files:** `components/schedule-builder.tsx`, `components/tournament-wizard-stepper.tsx`, `components/manual-match-score-modal.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Operational Design System (`bg-[#F7F7F7]`, primary `#37003C`, accents `#00FF87` and `#E9007F`, cards `bg-white border-[#E5E5E5]`)  

---

## 1. Page Overview

The **Admin Schedule & Fixtures Builder Page** is Step 3 of the tournament setup wizard and the competition's tactical scheduling hub. It provides tournament organizers with both automated algorithmic generation and fine-grained manual controls to structure rounds, pair competing groups, assign official Premier League Gameweeks, synchronize live scores via the official FPL API, manage manual offline scoring, and finalize competition results.

### Primary Responsibilities
- **Automated Round-Robin Generation:** Generate a mathematically balanced tournament schedule with a single click using the canonical Berger rotation algorithm.
- **Manual Fixture Creation & Editing:** Create custom rounds, associate them with specific FPL Gameweeks (1–38), add individual matchups, and swap home/away pairings.
- **Round-Level & Match-Level FPL Recalculation:** Pull live points, transfer deductions, and chip data for individual matches, complete Gameweek rounds (`recalculateRoundAction`), or bulk-recalculate the entire tournament.
- **Manual Score Entry Suite (`ManualMatchScoreModal`):** Manually input match scores and individual fantasy points for manual teams or offline fixtures without requiring the FPL API.
- **Upcoming Gameweek & Live Match Handling:** Gracefully handle future gameweeks prior to kickoff and track in-progress fixtures live as points update.
- **Result Finalization & Integrity Protection:** Lock completed matches into `FINALIZED` status to prevent accidental score drift.
- **Schedule Validation Engine:** Verify structural integrity before advancing to Step 4 (Review & Publish).

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Champions Fantasy Cup / Schedule                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   [Badge: STEP 3 OF 4: SCHEDULE & FIXTURES]                                 │
│   Tournament Schedule [Calendar 📅]                                         │
│   Build rounds, pair competing teams, and calculate live FPL scores...      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-STEP WIZARD STEPPER:                                                      │
│   [1. Details (Done)] ─── [2. Groups (Done)] ─── [3. Schedule (Active)] ─── [4. Publish]│
├─────────────────────────────────────────────────────────────────────────────┤
│ SCHEDULE ACTIONS TOOLBAR:                                                   │
│   [⚡ Auto-Generate Round-Robin]  [+ Add Round]  [🔄 Recalculate All] [✓ Valid]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ROUND-ROBIN GENERATOR DRAWER (Collapsible):                                 │
│   Start Gameweek: [ 1 ]  (Will schedule consecutive rounds GW1, GW2...)     │
│   [ Generate Complete Schedule Button ]                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ROUNDS & FIXTURES CONTAINER:                                                │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ROUND 1: Gameweek 1 (2 Matches)   [🔄 Recalc Round]  [🗑️ Delete Round] │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ MATCH 1:                                                                │ │
│ │ [ London Gunners (Home) ]    vs    [ Merseyside Reds (Away) ]           │ │
│ │ Score: 72 — 58                              Status: [✓ FINALIZED]       │ │
│ │ [🔄 Recalc Score] [✏️ Manual Score] [🔒 Finalize] [👁️ View] [🗑️ Delete] │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ MATCH 2:                                                                │ │
│ │ [ Red Devils FC (Home) ]     vs    [ Cityzen Blues (Away) ]             │ │
│ │ Score: 65 — 65                              Status: [● LIVE IN PROG.]   │ │
│ │ [🔄 Recalc Score] [✏️ Manual Score] [🔒 Finalize] [👁️ View] [🗑️ Delete] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ WIZARD BOTTOM BAR:                                                          │
│   [ ← Back to Groups ]                    [ Continue to Review & Publish → ]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Workflows

### 3.1 Stepper & Wizard Progression
- **Stepper Display:** Displays Step 3 as active with live statistics pills (e.g. `4 Groups`, `3 Rounds`, `6 Matches`).
- **Bottom Navigation Bar:**
  - `← Back to Groups`: Returns to Step 2 `/admin/tournaments/${id}/groups?wizard=true`.
  - `Continue to Review & Publish →`: Advances to Step 4 `/admin/tournaments/${id}/publish` (active when schedule is valid).

### 3.2 Quick Actions Toolbar
- **Auto-Generate Round-Robin (`Zap`):** Expands the algorithmic generator drawer.
- **Add Round (`Plus`):** Opens inline inputs to configure a custom round name and Gameweek number.
- **Recalculate All (`RefreshCw`):** Dispatches bulk FPL scoring across every fixture in the tournament.
- **Validate Schedule (`CheckCircle2`):** Runs structural checks and displays an itemized pass/fail checklist.

### 3.3 Automated Round-Robin Generator
- Prompts organizer for **Start Gameweek** (1–38).
- Implements the canonical Berger rotation algorithm:
  - Even group count ($N$): produces $N - 1$ rounds with $N / 2$ matches per round.
  - Odd group count ($N$): introduces bye weeks to ensure parity.
- Prompts safety confirmation if existing fixtures are present to avoid accidental data loss.

### 3.4 Round Management & Round Recalculation
- **Round Header Strip:**
  - Displays round title (e.g. `Round 1 - Opening Matches`) and Gameweek pill (`Gameweek {round.gameweek}`).
  - **Recalculate Round Button (`RefreshCw`):** Triggers `recalculateRoundAction`, executing live FPL scoring exclusively for fixtures within this specific Gameweek without mutating other rounds.
  - **Add Match (`Plus`):** Appends a new matchup to the round.
  - **Delete Round (`Trash2`):** Deletes the round and its child fixtures with confirmation.

### 3.5 Match Fixture Card Controls
Each fixture renders a complete operational cockpit:
- **Team Selectors:** Home and Away dropdown menus listing all imported and manual groups.
- **Live Score Display:** Formatted points (`{homeScore} — {awayScore}`) or `Provisional / Scheduled`.
- **Match Status Indicators:**
  - `FINALIZED`: Emerald pill indicating locked official results.
  - `IN_PROGRESS`: Rose pulsing indicator for ongoing live Gameweek matches.
  - `COMPLETED`: Purple pill for finished matches awaiting finalization.
  - `SCHEDULED`: Sky-blue indicator with `Clock` icon for upcoming future Gameweeks.
- **Recalculate Match (`RefreshCw`):** Fetches live member picks, deducts transfer costs, applies chip rules, and strictly excludes tournament admins.
- **Manual Match Score Modal (`ManualMatchScoreModal`):**
  - Clicked via `Manual Score` button.
  - Essential for manual teams or offline competitions.
  - Allows direct numeric entry of home/away match points, team goals, and granular member points breakdown.
- **Finalize Match (`CheckCircle2`):** Locks the match. Finalized matches cannot be accidentally overridden by bulk recalculations.

---

## 4. Technical Logic & Server Actions

### 4.1 Round Recalculation Pipeline (`recalculateRoundAction`)
```typescript
export async function recalculateRoundAction(roundId: string) {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      matches: true,
      tournament: true,
    },
  });

  // Iterates over all non-finalized matches in the round
  for (const match of round.matches) {
    if (match.status === "FINALIZED") continue;
    await recalculateMatchScores(match.id, round.gameweek, round.tournament);
  }
}
```

### 4.2 Scoring Pipeline & Admin Exclusion (`recalculateMatchAction`)
Executes the comprehensive scoring rules:
1. Validates Gameweek state: if the Gameweek has not kicked off or picks are unpublished, marks match as `SCHEDULED` without throwing.
2. Queries live squad picks and gross points for all team members via `getManagerPicks(fplId, gameweek)`.
3. Deducts transfer costs (`event_transfers_cost`).
4. Evaluates active chips:
   - If `bboost` played and `allowBenchBoost === false`: excludes bench points.
   - If `3xc` played and `allowTripleCaptain === false`: caps captain multiplier at 2x.
5. Strictly excludes any tournament admin (`isExcluded: true`).
6. Sums remaining player points into `homeScore` and `awayScore`.
7. Updates status to `COMPLETED` or `IN_PROGRESS` based on official FPL fixture completion.

### 4.3 Manual Score Management (`saveManualMatchScoreAction`)
```typescript
export async function saveManualMatchScoreAction(
  matchId: string,
  homeScore: number,
  awayScore: number,
  memberScores: Array<{ memberId: string; points: number }>
) {
  // Directly updates Match and MatchScore records in Prisma
}
```

---

## 5. Responsive Behavior & Validation

- **Mobile Viewports (< 768px):** Toolbar buttons wrap onto separate rows. Fixture pairings stack home team over away team. Individual action buttons collapse to icon buttons.
- **Desktop (>= 768px):** Full horizontal layout with team crests, score pill, and flush action buttons.
- **Validation Engine (`validateScheduleAction`):**
  - Requires minimum 2 participating groups.
  - Flags teams playing multiple times within the same Gameweek.
  - Detects unassigned fixture slots before publication.
