# Page 08: Admin Tournament Management Hub

> **Route:** `/admin/tournaments/[id]`  
> **Source File:** `app/admin/tournaments/[id]/page.tsx`  
> **Component Files:** `components/tournament-actions.tsx`, `components/tournament-wizard-stepper.tsx`, `components/league-table.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Design System (`#37003C` Deep Premier Purple, `#00FF87` Fantasy Green, `#F7F7F7` Canvas, `#FFFFFF` Surface Cards)  

---

## 1. Page Overview

The **Admin Tournament Management Hub** is the operational command center for an individual tournament. It consolidates tournament metadata, cinematic banner branding, organizer accounts, participating FPL Classic League groups, scheduled rounds, live league standings, and quick shortcuts into every phase of tournament orchestration.

### Primary Responsibilities
- Provide an overarching operational snapshot of the tournament (status, season, organizers, chip rules).
- Render tournament banner artwork with fast-action shortcuts to modify branding.
- For draft tournaments, host the **Tournament Wizard Stepper** to guide the admin through Groups, Schedule, and Pre-flight Publication.
- Present live operational KPIs: Total Non-Admin Players, Rounds Count, Finalized Fixtures, and Completion Percentage.
- Embed a live preview of the **League Standings Table** calculated directly from completed match scores.
- Offer direct jumping-off points to group import (`/groups`), schedule builder (`/schedule`), settings editing (`/edit`), pre-flight publishing (`/publish`), and the public spectator view (`/tournaments/[id]`).

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Premier League Fantasy Cup 2024                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT BANNER CARD (if banner configured):                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Panoramic Stadium Artwork Graphic]                  [🖼️ Change Banner] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT HEADER BLOCK:                                                    │
│   H1: Premier League Fantasy Cup 2024                                       │
│   [PUBLISHED / DRAFT] [BB: Allowed] [TC: Allowed (3x)] [2 Admins]           │
│                                           [↗ View Public Page] [✏️ Edit Info]│
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-STEP WIZARD STEPPER (Displayed for Draft Tournaments):                    │
│   [1. Details (Done)] ─ [2. Groups (Done)] ─ [3. Schedule] ─ [4. Publish]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-CARD STATISTICAL SUMMARY ROW:                                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ Season & Admins  │ │ Groups & Players │ │ GW Rounds    │ │ Fixtures     ││
│ │ Season 2024      │ │ 4 groups         │ │ 3 Gameweeks  │ │ 6 / 12 (50%) ││
│ │ 👑 John Doe (#1) │ │ 40 active players│ │ Scheduled    │ │ 4 finalized  ││
│ │ 🛡️ Jane Smith (#2│ │ (excl. admins)   │ │              │ │ 2 in progress││
│ └──────────────────┘ └──────────────────┘ └──────────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ LIVE LEAGUE STANDINGS PREVIEW:                                              │
│   🏆 Live League Standings (Win: +3, Draw: +1, Loss: 0)                     │
│   [Embedded League Table: Rank, Crest, Team, MP, W, D, L, PF, PA, +/-, PTS] │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2-COLUMN MANAGEMENT HUB CARDS:                                              │
│ ┌──────────────────────────────────────┐ ┌─────────────────────────────────┐│
│ │ 👥 Participating Groups (4)          │ │ 📅 Schedule & Fixtures (12)     ││
│ │ [Manage Groups ->]                   │ │ [Manage Schedule ->]            ││
│ │ • 🛡️ London Gunners (10 players)     │ │ • Round 1 (GW 1): 2/2 finalized ││
│ │ • 🛡️ Red Devils FC (10 players)      │ │ • Round 2 (GW 2): 2/2 in prog.  ││
│ │ • 🛡️ Cityzen Blues (10 players)      │ │ • Round 3 (GW 3): 0/2 scheduled ││
│ └──────────────────────────────────────┘ └─────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM ACTION TOOLBAR:                                                      │
│   [Edit] [Groups] [Schedule] [Review & Publish] [Unpublish] [Delete]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Breadcrumb & Banner Showcase
- **Breadcrumbs:** `Dashboard` (links to `/admin`) `/` `{tournament.name}`.
- **Panoramic Banner Card:**
  - If `tournament.banner` is present, renders a responsive `h-28 sm:h-36 md:h-44` visual card with stadium artwork.
  - Includes a floating action badge (`Change Banner` with `ImageIcon`) linking directly to the edit page's banner tab.

### 3.2 Header Title & Status Badges
- **Title (H1):** `text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F] tracking-tight`.
- **Status Pills:**
  - `PUBLISHED`: Emerald pill (`bg-emerald-500/10 text-emerald-700 border-emerald-500/30`) with `CheckCircle2`.
  - `DRAFT`: Amber pill (`bg-amber-500/10 text-amber-700 border-amber-500/30`) with `FileText`.
  - `FINISHED`: Neutral gray badge with `Clock` icon.
- **Rule Badges:**
  - Bench Boost: `BB: Allowed` with `Armchair` icon, or `BB: Disabled` with `Ban`.
  - Triple Captain: `TC: Allowed (3x)` with `Crown` icon, or `TC: Reduced (2x)` with `Ban`.
  - Admins Badge: `Shield` icon with total organizer count.

### 3.3 Tournament Wizard Stepper (Draft Mode)
When the tournament is in `DRAFT` status, `<TournamentWizardStepper />` is embedded directly below the header:
- Tracks progress across 4 milestones:
  1. *Tournament Details & Banner* (`/edit`)
  2. *Add Groups & Teams* (`/groups`)
  3. *Schedule & Fixtures* (`/schedule`)
  4. *Review & Publish* (`/publish`)
- Displays live badges indicating group count, rounds count, and match count.

### 3.4 Operational KPI Metric Grid
1. **Season & Admins Card:**
   - Displays season notation (e.g. `Season 2024/25`).
   - Lists verified organizers: Primary Admin highlighted with gold crown (`👑`) and co-admins with shield (`🛡️`), showing official manager names and FPL IDs.
2. **Groups & Players Card:**
   - Displays count of imported participating groups.
   - Highlights total active non-admin players whose scores drive fixtures.
3. **Gameweek Rounds Card:**
   - Total scheduled rounds count.
   - Gameweek span (e.g. `GW 1 – GW 3`).
4. **Fixtures & Progress Card:**
   - Match completion ratio (`completedMatches / allMatches`).
   - Progress bar with percentage completion.
   - Sub-badges for `Finalized` and `In Progress` fixtures.

### 3.5 Live League Standings Preview (`LeagueTable`)
Embeds the standard `<LeagueTable />` component displaying real-time ranks, crests, MP, W, D, L, PF, PA, Points Difference, and PTS. Allows organizers to monitor tournament standings instantly without navigating to the public interface.

### 3.6 Management Navigation Cards
- **Groups Hub Card:** Quick link to `/admin/tournaments/${id}/groups` with team roster preview.
- **Schedule Hub Card:** Quick link to `/admin/tournaments/${id}/schedule` with gameweek rounds status breakdown.

### 3.7 Tournament Actions Bar (`TournamentActions`)
- **Review & Publish Button (`Rocket`):** Visible when in `DRAFT`. Links to Step 4 `/admin/tournaments/${id}/publish`.
- **Unpublish Action:** Allows switching a published competition back to draft status with confirmation.
- **Delete Action:** Destructive action guarded by `AlertDialog` safety prompt requiring explicit confirmation.

---

## 4. Technical Logic & Data Fetching

```typescript
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

const standings = await calculateLeagueStandings(tournament.id);
const allMatches = tournament.rounds.flatMap((r) => r.matches);
const completedMatches = allMatches.filter(
  (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
);
const finalizedMatches = allMatches.filter((m) => m.status === "FINALIZED");
const totalNonAdminPlayers = tournament.groups.reduce(
  (acc, g) => acc + g.members.filter((m) => !m.isAdmin).length,
  0
);
```

---

## 5. Responsive Behavior

- **Mobile (< 640px):** 4 metric cards collapse into single columns. Stepper switches to icon-and-compact label mode. Top header action buttons wrap cleanly.
- **Tablet (640px - 1024px):** Metric cards form a balanced 2x2 grid. Management hub cards display side-by-side.
- **Desktop (>= 1024px):** Metric grid expands to 4 distinct columns with high-contrast typography and subtle borders.
