# Page 08: Admin Tournament Management Hub

> **Route:** `/admin/tournaments/[id]`  
> **Source File:** `app/admin/tournaments/[id]/page.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Design System (`#37003C` Deep Premier Purple, `#00FF87` Fantasy Green, `#F7F7F7` Background, Poppins Typography)  

---

## 1. Page Overview

The **Admin Tournament Management Hub** is the central cockpit for managing an individual tournament. It aggregates all critical operational data into a single unified dashboard, including administrative metadata, participating FPL Classic League groups, scheduled rounds, live league standings, and direct shortcuts to the Groups Manager and Schedule Builder.

### Primary Responsibilities
- Provide an overarching operational snapshot of the tournament (status, season, organizers, chip configurations).
- Present key performance indicators (player counts, round counts, fixture completion rate).
- Embed a live preview of the **League Standings Table** as calculated from current results.
- Serve as the central jumping-off point to group import (`/groups`), schedule creation (`/schedule`), settings editing (`/edit`), and public viewing (`/tournaments/[id]`).

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [Trophy] Fantasy Leagues Admin     admin@test.com  [Logout]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Premier League Fantasy Cup 2024                     │
│                                                                             │
│ TOURNAMENT TITLE & CONFIGURATION BADGES:                                    │
│   H1: Premier League Fantasy Cup 2024                                       │
│   [PUBLISHED] [BB: Allowed] [TC: Allowed (3x)] [2 Admins]                   │
│                                           [View Public Page]  [Edit Info]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-CARD STATISTICAL SUMMARY ROW:                                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ Season & Admins  │ │ Groups           │ │ GW Rounds    │ │ Fixtures     ││
│ │ Season 2024      │ │ 4                │ │ 3            │ │ 6 / 12       ││
│ │ 👑 John Doe (#1) │ │ 40 total players │ │ Scheduled    │ │ 4 finalized  ││
│ │ 🛡️ Jane Smith (#2│ │                  │ │              │ │              ││
│ └──────────────────┘ └──────────────────┘ └──────────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ LIVE LEAGUE STANDINGS PREVIEW:                                              │
│   🏆 Live League Standings (Win: +3, Draw: +1, Loss: 0)                     │
│   [Embedded League Table: Rank, Team, MP, W, D, L, PF, PA, +/-, PTS, Form]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2-COLUMN MANAGEMENT HUB CARDS:                                              │
│ ┌──────────────────────────────────────┐ ┌─────────────────────────────────┐│
│ │ 👥 Participating Groups (4)          │ │ 📅 Schedule & Fixtures (12)     ││
│ │ [Manage Groups ->]                   │ │ [Manage Schedule ->]            ││
│ │ • 🛡️ London Gunners (10 players)     │ │ • Round 1 (GW 1): 2/2 completed ││
│ │ • 🛡️ Red Devils FC (10 players)      │ │ • Round 2 (GW 2): 2/2 completed ││
│ │ • 🛡️ Cityzen Blues (10 players)      │ │ • Round 3 (GW 3): 0/2 scheduled ││
│ └──────────────────────────────────────┘ └─────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM ACTION TOOLBAR:                                                      │
│   [Edit] [Groups] [Schedule] [Unpublish Tournament] [Delete Tournament]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Breadcrumb & Page Header
- **Breadcrumb Hierarchy:** `Dashboard` (links to `/admin`) `/` `{tournament.name}`.
- **Title Block:** `text-3xl font-bold text-gray-900`.
- **Status & Chip Badges:**
  - Status pill: `PUBLISHED` (green), `DRAFT` (amber), or `FINISHED` (gray).
  - Bench Boost badge: `BB: Allowed` (with `Armchair` icon) or `BB: Disabled` (with `Ban` icon).
  - Triple Captain badge: `TC: Allowed (3x)` (with `Crown` icon) or `TC: Reduced (2x)` (with `Ban` icon).
  - Admins badge: Shows total organizer count (e.g. `2 Admins`).

### 3.2 Global Header Action Buttons
- **View Public Page:** Visible if tournament is `PUBLISHED`. Opens public tournament page (`/tournaments/${id}`) in a new browser tab (`target="_blank"`) with `ExternalLink` icon.
- **Edit Info:** Outlined button routing to `/admin/tournaments/${id}/edit` with `Pencil` icon.

### 3.3 4-Card Statistical Metric Grid
1. **Season & Admins Card:**
   - Displays season number.
   - Lists verified tournament organizers: Primary Admin with gold crown (`👑`) and co-admins with shield (`🛡️`), displaying their official names and FPL IDs.
2. **Groups Card:**
   - Number of imported groups.
   - Total non-admin player count across all groups.
3. **Gameweek Rounds Card:**
   - Number of scheduled tournament rounds.
4. **Fixtures Card:**
   - Ratio of completed vs total matches (`{completedMatches} / {allMatches}`).
   - Finalized match count.

### 3.4 Live Standings Table (`LeagueTable`)
Embeds the exact same high-precision standings table used in the public interface, giving the admin instant feedback on current league rankings without having to switch tabs.

### 3.5 Management Hub Navigation Cards
1. **Participating Groups Hub Card:**
   - Header with `Users` icon and group count.
   - `Manage Groups` button linking to `/admin/tournaments/${id}/groups`.
   - List preview of participating groups with club crests and active player counts.
2. **Schedule & Fixtures Hub Card:**
   - Header with `Calendar` icon and match count.
   - `Manage Schedule` button linking to `/admin/tournaments/${id}/schedule`.
   - Round-by-round preview with match completion progress.

### 3.6 Bottom Action Bar (`TournamentActions`)
Provides quick access to primary actions: `Edit`, `Groups`, `Schedule`, `Publish`/`Unpublish`, and `Delete`.

---

## 4. Technical Logic & Server Data Loading

```typescript
const tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    admins: {
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    },
    groups: {
      include: { members: true },
      orderBy: { createdAt: "asc" },
    },
    rounds: {
      include: {
        matches: {
          include: {
            homeGroup: true,
            awayGroup: true,
          },
          orderBy: { matchNumber: "asc" },
        },
      },
      orderBy: { roundNumber: "asc" },
    },
  },
});

const standings = await calculateLeagueStandings(tournament.id);
```

---

## 5. Responsive Breakpoints

- **Mobile (< 640px):** 4 metric cards stack into 1 column. Header action buttons wrap. Hub cards stack vertically.
- **Tablet (640px - 1024px):** Metric cards form a 2x2 grid. Hub cards display side-by-side.
- **Desktop (> 1024px):** Metric cards display in 4 distinct columns (`grid-cols-4`).

---

## 6. Edge Cases & Resilience

1. **Tournament Not Found:**
   - Handled via Next.js `notFound()`, triggering standard 404 handler.
2. **No Groups or Schedule Yet:**
   - Hub cards provide helpful empty state messages with explicit CTA links prompting the admin to import groups and generate rounds.
