# Page 13: Admin Review & Publish Tournament

> **Route:** `/admin/tournaments/[id]/publish`  
> **Source File:** `app/admin/tournaments/[id]/publish/page.tsx`  
> **Component Files:** `components/tournament-publish-wizard.tsx`, `components/tournament-wizard-stepper.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Operational Design System (`bg-[#F7F7F7]`, primary `#37003C`, accents `#00FF87` and `#E9007F`, cards `bg-white border-[#E5E5E5]`)  

---

## 1. Page Overview

The **Review & Publish Tournament Page** is Step 4—the culmination of the guided tournament setup wizard. It acts as the pre-flight mission control before a competition goes live to the public. It evaluates all tournament components against strict validation criteria, presents a consolidated executive preview of branding, rules, rosters, and fixtures, and provides safe execution controls to publish or unpublish the tournament.

### Primary Responsibilities
- **Automated Pre-Flight Readiness Inspection:** Automatically checks 3 critical readiness gates: Details & Rules, Groups & Rosters, and Schedule & Fixtures.
- **Itemized Issue Remediation:** Identifies structural defects (e.g. fewer than 2 groups, unassigned fixture pairings) and provides direct links to remediate them.
- **Consolidated Tournament Preview:** Showcases stadium banner artwork, chip rules, participating clubs with crests, and complete round-by-round gameweek fixtures.
- **Guarded Launch Controls:** Protects public publication behind an `AlertDialog` confirmation prompt.
- **Post-Launch Public Transition:** Celebrates live publication with immediate shortcuts to the public spectator page (`/tournaments/[id]`).
- **Unpublish Capability:** Allows organizers to revert a live tournament back to draft mode if emergency schedule adjustments are needed.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Champions Fantasy Cup / Review & Publish            │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   Review & Publish Tournament [Rocket 🚀]           [↗ View Public Page]    │
│   Step 4 of 4: Inspect pre-flight readiness checks, verify configuration... │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-STEP WIZARD STEPPER:                                                      │
│   [1. Details (Done)] ─── [2. Groups (Done)] ─── [3. Schedule (Done)] ─── [4. Publish (Active)]│
├─────────────────────────────────────────────────────────────────────────────┤
│ CELEBRATION BANNER (Visible if Published):                                  │
│   🎉 Tournament is Officially Published!                                    │
│   Your competition is now live and publicly accessible. [Open Public Page] │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRE-FLIGHT READINESS CHECKS (3 Cards):                                      │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐│
│ │ Check 01 · Details   │  │ Check 02 · Groups    │  │ Check 03 · Schedule  ││
│ │ [✓ Verified]         │  │ [✓ Verified]         │  │ [✓ Verified]         ││
│ │ Champions Cup 2024   │  │ 4 Groups Configured  │  │ 3 Rounds · 6 Matches ││
│ │ BB: On · TC: 3x      │  │ 40 total players     │  │ All pairings assigned││
│ │ [✏️ Edit Details]    │  │ [👥 Manage Groups]   │  │ [📅 Build Schedule]  ││
│ └──────────────────────┘  └──────────────────────┘  └──────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ VALIDATION ISSUES ALERT (Conditional):                                      │
│   ⚠️ Action Required Before Publishing:                                     │
│   • Tournament must have at least 2 groups before publishing.                │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT IDENTITY & BANNER SUMMARY CARD:                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Panoramic Stadium Artwork Graphic]                                     │ │
│ │ Champions Fantasy Cup 2024 · Season 2024/25 · Status: [DRAFT]           │ │
│ │ Organizers: 👑 John Doe (#123456)  🛡️ Jane Smith (#789012)              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ PARTICIPATING TEAMS PREVIEW (Grid of Crest Cards):                          │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│   │ [Crest]      │ │ [Crest]      │ │ [Crest]      │ │ [Crest]      │        │
│   │ London Gunner│ │ Red Devils FC│ │ Cityzen Blues│ │ Merseyside R│        │
│   │ 10 players   │ │ 10 players   │ │ 10 players   │ │ 10 players   │        │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMPLETE FIXTURE SCHEDULE PREVIEW:                                          │
│   Round 1 (GW 1): London Gunners vs Merseyside Reds · Red Devils vs Blues   │
│   Round 2 (GW 2): London Gunners vs Cityzen Blues · Merseyside vs Red Devils│
├─────────────────────────────────────────────────────────────────────────────┤
│ LAUNCH BAR (Sticky / Bottom):                                               │
│   [ ← Back to Schedule ]              [ 🚀 Publish Tournament & Go Live ]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Workflows

### 3.1 Pre-Flight Readiness Checklist
Three dedicated evaluation cards inspecting the integrity of the tournament setup:
1. **Check 01: Details & Rules:**
   - Evaluates tournament name, season, primary administrator verification, and chip settings.
   - Status badge: `Verified` (emerald) or `Action Required` (amber).
   - Direct shortcut button: `Edit Details` (`/admin/tournaments/${id}/edit`).
2. **Check 02: Groups & Rosters:**
   - Verifies that at least 2 groups have been imported or manually created.
   - Confirms total member count and verifies that tournament admins are properly tagged with the non-scoring exclusion flag.
   - Direct shortcut button: `Manage Groups` (`/admin/tournaments/${id}/groups`).
3. **Check 03: Schedule & Fixtures:**
   - Verifies that rounds exist and all matches have both Home and Away groups assigned.
   - Validates that no teams are double-booked in the same Gameweek round.
   - Direct shortcut button: `Build Schedule` (`/admin/tournaments/${id}/schedule`).

### 3.2 Pre-Flight Issues Alert (`validationIssues`)
If structural defects are detected by `validateScheduleAction`:
- Renders an amber alert box detailing each specific defect:
  - *"Tournament must have at least 2 groups before publishing."*
  - *"Round {roundNumber} has an unassigned match slot."*
  - *"Team {name} is scheduled more than once in Round {roundNumber}."*
- Disables the Publish CTA until all issues are remediated.

### 3.3 Executive Configuration Summaries
- **Identity & Banner Container:**
  - If a banner was chosen in Step 1, renders the panoramic visual preview.
  - Summarizes competition title, season, active chip rules, and organizer committee with FPL IDs.
- **Participating Groups Grid:**
  - Visual gallery of competing clubs showing official team crests, team aliases, and active player counts.
- **Fixture Schedule Accordion:**
  - Full round-by-round preview displaying Gameweek numbers, home/away pairings, and match numbers.

### 3.4 Launch Action & Unpublish Controls
- **Publish & Go Live Button:**
  - Bold Premier Purple button (`bg-[#37003C] hover:bg-[#5A0A63] text-white`) with `Rocket` and `Sparkles` icons.
  - Disabled if `!isValid` or if `loading`.
  - Launches an `AlertDialog`:
    > *"Are you ready to publish this tournament? Publishing will make this competition public and visible on the tournaments directory."*
  - On confirm, executes `publishTournamentWithValidationAction`.
- **Celebration Banner:**
  - Appears immediately upon publication.
  - Provides a 1-click button to open the public spectator page in a new browser tab (`/tournaments/${id}`).
- **Unpublish Button (`EyeOff`):**
  - Visible when `status === "PUBLISHED"`.
  - Prompts confirmation to revert status back to `DRAFT`.
  - Useful if an organizer needs to alter groups or regenerate the schedule.

---

## 4. Technical Logic & Server Actions

### 4.1 Server Data Loading
```typescript
// app/admin/tournaments/[id]/publish/page.tsx
const tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    admins: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
    groups: { include: { members: true }, orderBy: { createdAt: "asc" } },
    rounds: {
      include: {
        matches: {
          include: { homeGroup: true, awayGroup: true },
          orderBy: { matchNumber: "asc" },
        },
      },
      orderBy: { roundNumber: "asc" },
    },
  },
});

const validationResult = await validateScheduleAction(tournament.id);
```

### 4.2 Validated Publish Action (`publishTournamentWithValidationAction`)
```typescript
export async function publishTournamentWithValidationAction(tournamentId: string) {
  // 1. Run strict schedule validation checks
  const validation = await validateScheduleAction(tournamentId);
  if (!validation.isValid) {
    return { success: false, issues: validation.issues };
  }

  // 2. Transition tournament status to PUBLISHED
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "PUBLISHED" },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");

  return { success: true };
}
```

---

## 5. Responsive Behavior & Safety Guarantees

- **Mobile Viewports (< 768px):** 3 readiness check cards stack vertically. Banner card scales cleanly. Bottom bar provides stacked action buttons.
- **Desktop (>= 768px):** 3-column readiness grid with top-line verification badges.
- **Safety Guarantees:**
  - A tournament cannot be published without passing all structural validation rules.
  - Public pages (`/tournaments/[id]`) return a 404 response for any tournament still in `DRAFT` status, ensuring incomplete drafts remain completely hidden from public visitors.
