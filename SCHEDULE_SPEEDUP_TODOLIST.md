# Schedule Builder UX Speedup — Todo List & Implementation Plan

This document outlines the UX improvements and automated tools designed to eliminate manual scheduling friction in the tournament builder without requiring file imports (CSV/Excel).

---

## Current Bottlenecks Identified
- **Excessive clicks**: Creating 4 matches across 5 rounds requires >65 clicks and dropdown interactions.
- **Dropdown fatigue**: Selecting Home and Away teams requires opening `SearchableTeamSelect`, searching/scrolling, and clicking for every single slot.
- **Mental tracking**: The admin must mentally keep track of which groups have already been scheduled in the current round.
- **Repetitive fixtures**: Tournaments with home & away legs require re-creating the entire schedule manually for Leg 2.

---

## Phase 1: In-Round "Click-to-Pair" Tray & Micro-UX (Completed ✅)

### 1.1 Unassigned Teams Chip Tray
- [x] Calculate unassigned groups dynamically for each round based on groups that do not yet appear in any match in that round.
- [x] Render an "Available Groups" horizontal tray at the top of each round card.
- [x] Display groups as clickable badges/chips showing group logo and name.
- [x] Provide active selection state: clicking Group A highlights it with an active ring/glow.
- [x] Clicking Group B immediately triggers `createMatchAction` pairing `Group A vs Group B`, clears the selection, and updates the tray.
- [x] Keyboard / Click handling to deselect Group A.

### 1.2 "⚡ Auto-Pair Remaining" Button
- [x] Add an "Auto-Pair Remaining" button in the tray when 2 or more unassigned groups remain.
- [x] Server action `autoPairRemainingAction`: takes all remaining unassigned groups in the round, pairs them up, and creates matches.
- [x] If an odd number of groups remains, pair what is possible and alert the admin about the single bye group.

### 1.3 In-Match Quick Controls (Micro-UX)
- [x] Add a **Swap Home / Away (⇄)** button in the central scoreboard area between the two team pickers.
  - Clicking swaps `homeGroupId` and `awayGroupId` in 1 click via `swapMatchSidesAction`.
- [x] Add a **"Create Empty Slots"** button:
  - If a round has groups and no matches, 1 click creates all empty match slots via `fillRoundWithEmptyMatchesAction`.

---

## Phase 2: Round Duplication & Reverse Fixtures (Leg 2) (Completed ✅)

### 2.1 Reverse Fixtures Action
- [x] Create `duplicateRoundAsReverseAction(roundId, tournamentId, targetGameweek?)` in `lib/schedule-actions.ts`.
- [x] Transaction creates a new `Round` with:
  - `roundNumber = maxRoundNumber + 1`
  - `gameweek = currentRound.gameweek + 1` (or specified GW)
  - `name = "Round N (Leg 2)"`
  - Clones all matches with `homeGroupId` and `awayGroupId` swapped.

### 2.2 UI Integration
- [x] Add a "Reverse Fixtures" action button to the round header.
- [x] Add confirmation modal with target Gameweek picker.
- [x] Success message and auto-focus/expansion of the new round.

---

## Phase 3: Knockout & Cup Bracket Wizard (Zero Files Needed)

### 3.1 Knockout Generator Engine
- [ ] Implement `generateKnockoutScheduleAction(tournamentId, options)` in `lib/schedule-actions.ts`:
  - Support 4, 8, 16 groups.
  - Structure: Quarterfinals ➔ Semifinals ➔ Final (+ optional 3rd place playoff).
  - Support **Single Elimination** (1 GW per stage) and **Two-Leg Ties** (Home & Away across 2 consecutive GWs).
  - Setup winner progression references (`homeWinnerOfMatchId`, `awayWinnerOfMatchId`).

### 3.2 Knockout Wizard UI Modal
- [ ] Create `KnockoutWizardModal` accessible from the top toolbar next to "Auto-Generate Round-Robin".
- [ ] Form controls:
  - Format selector: Single Elimination vs Two-Legged Knockout.
  - Participating groups picker (select all or pick top seeded).
  - Starting Gameweek input.
  - Pairing style: Random draw vs Seeded (1 vs 8, 2 vs 7, etc.).
- [ ] Live preview diagram of the bracket before committing.
- [ ] Batch generation in a single database transaction.

---

## Phase 4: Smart Quick-Text Matchmaker (Copy/Paste Without Files)

### 4.1 Fuzzy Matcher Engine
- [ ] Build a text parser that accepts plain text lines:
  ```text
  Arsenal vs Chelsea
  Liverpool vs Man City
  Aston Villa vs Spurs
  ```
- [ ] Match lines against the tournament's existing group names using case-insensitive substring and Levenshtein distance.
- [ ] Detect conflicts (e.g. team listed twice in the same round, or unresolvable name).

### 4.2 Quick-Text Modal Component
- [ ] Add "Quick Text Matcher" button in the round action bar.
- [ ] Modal contains a multi-line textarea and a live validation table:
  - Column 1: Detected Home Team (with status indicator).
  - Column 2: Detected Away Team (with status indicator).
- [ ] One-click "Create X Fixtures" button to insert all parsed matches in a single batch.

---

## Phase 5: Multi-Round Batch Creator

### 5.1 Batch Round Action
- [ ] Implement `createBatchRoundsAction(tournamentId, { roundCount, startingGameweek, emptyMatchesPerRound })` in `lib/schedule-actions.ts`.
- [ ] Validate that `startingGameweek + roundCount - 1 <= 38`.
- [ ] Create all rounds and placeholder match cards in a single database query.

### 5.2 UI Dialog
- [ ] Add "Batch Add Rounds" button next to "Add Round".
- [ ] Small popover/modal specifying number of rounds and start GW.

---

## Status & Progress Tracker

| Feature | Phase | Status | Target Files |
| :--- | :--- | :--- | :--- |
| Unassigned Teams Chip Tray | Phase 1 | ✅ Completed | `components/schedule-builder.tsx` |
| Click-to-Pair Interaction | Phase 1 | ✅ Completed | `components/schedule-builder.tsx` |
| Auto-Pair Remaining Button | Phase 1 | ✅ Completed | `components/schedule-builder.tsx`, `lib/schedule-actions.ts` |
| Swap Home/Away (⇄) Button | Phase 1 | ✅ Completed | `components/schedule-builder.tsx`, `lib/schedule-actions.ts` |
| Duplicate Round as Reverse | Phase 2 | ✅ Completed | `components/schedule-builder.tsx`, `lib/schedule-actions.ts` |
| Knockout Bracket Wizard | Phase 3 | ⏳ Next Up | `components/schedule-builder.tsx`, `lib/schedule-actions.ts` |
| Smart Quick-Text Matchmaker | Phase 4 | ⏳ Planned | `components/quick-text-fixture-modal.tsx` |
| Multi-Round Batch Creator | Phase 5 | ⏳ Planned | `components/schedule-builder.tsx`, `lib/schedule-actions.ts` |
