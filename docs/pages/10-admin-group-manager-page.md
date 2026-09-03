# Page 10: Admin Group & FPL League Manager

> **Route:** `/admin/tournaments/[id]/groups`  
> **Source File:** `app/admin/tournaments/[id]/groups/page.tsx`  
> **Component File:** `components/group-manager.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Clean Light Administrative Theme (`bg-gray-100`, cards `bg-white`)  

---

## 1. Page Overview

The **Admin Group & League Manager Page** is the team roster orchestration hub. In the FPL Tournament architecture, every participating **Group / Team** corresponds directly to an official **Fantasy Premier League Classic League**.

This page empowers organizers to:
1. Fetch and browse FPL Classic Leagues across **all registered tournament co-admins**.
2. Filter leagues by specific organizer or search query.
3. Select and import leagues into the tournament as official competing teams with an immutable member snapshot.
4. Customize team branding with the **Team Logo Picker** (Premier League clubs, European giants, custom presets).
5. Rename teams with friendly aliases.
6. Inspect imported squad rosters and verify that tournament admins are properly tagged with the **Strict Admin Exclusion** flag.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [Trophy] Fantasy Leagues Admin     admin@test.com  [Logout]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Champions Fantasy Cup / Groups        [-> Schedule] │
│ H1: Manage Groups                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT CONTEXT BANNER:                                                  │
│   Season 2024 · Organizers: [👑 John Doe #123] [🛡️ Jane Smith #456] [DRAFT]│
├─────────────────────────────────────────────────────────────────────────────┤
│ GROUP MANAGER TOOLBAR:                                                      │
│   Participating Groups (4)               [+ Import Group from FPL League]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IMPORT DRAWER (Collapsible):                                                │
│   Select Admin: [ALL] [👑 John Doe] [🛡️ Jane Smith]                         │
│   Search Leagues: [🔍 Search league name...                               ] │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ Arsenal Supporters League                                             │ │
│   │ Owner: John Doe · 10 Members          [Choose Logo]  [Import as Team] │ │
│   ├───────────────────────────────────────────────────────────────────────┤ │
│   │ Red Devils Global League                                              │ │
│   │ Owner: Jane Smith · 12 Members        [Choose Logo]  [Import as Team] │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ IMPORTED GROUPS LIST:                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Logo] London Gunners                       10 Active Players   [Delete]│ │
│ │ FPL League ID: #987654      [Change Logo]  [Rename Team]                │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ MEMBERS SNAPSHOT TABLE:                                                 │ │
│ │ Name               | FPL Team Name     | FPL ID  | Role     | Actions   │ │
│ │ • Alex Morgan      | Highbury Heroes   | #112233 | Player   | [👁️ Squad]│ │
│ │ • David Miller     | North Bank FC     | #445566 | Player   | [👁️ Squad]│ │
│ │ • John Doe (Admin) | Gunners XI        | #123456 | ⚠️ EXCL.  | [👁️ Squad]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Workflows

### 3.1 Tournament Context Card
- Displays Season number, Status badge, and organizer pills.
- Each organizer is badged with crown (`👑`) or shield (`🛡️`), name, and FPL ID (`#123456`).

### 3.2 FPL League Import Panel (`showImport`)
Clicking `Import Group from FPL League` expands the multi-admin league discovery drawer:
1. **Multi-Admin Filter Pills:**
   - Organizers can filter leagues: `ALL`, `Primary Admin`, or any `Co-Admin`.
   - Solves the FPL account constraint by letting co-admins bring their own private leagues into the competition.
2. **Instant Search Input:**
   - Real-time text filter filtering league names as the admin types.
3. **League Discovery Row:**
   - Shows League Name, Admin Owner name, and Member Count.
   - **Choose Logo Trigger:** Launches `<TeamLogoPicker />` to pre-assign a club crest before importing.
   - **Import as Team Button:** Calls `importLeagueAsGroupAction(tournamentId, leagueId, adminFplId, logo)`. Displays animated loading spinner while fetching the roster.

### 3.3 Imported Group Card & Actions
Each imported team renders as an elevated card:
- **Header:**
  - Team Crest (or generated 2-letter monogram).
  - Team Name.
  - FPL Classic League ID.
  - Active member count (excluding admins).
- **Group Action Buttons:**
  - **Change Logo:** Opens `<TeamLogoPicker />` to update the crest in real-time.
  - **Rename Team:** Replaces the team name with an inline text input (`Input`) with `Save` and `Cancel` buttons.
  - **Delete Group:** Destructive action guarded by an `AlertDialog` confirmation prompt.

### 3.4 Members Snapshot Table
An expandable table displaying the exact roster captured from the official FPL API:
- **Columns:**
  1. `Manager Name`: Full name of the fantasy player.
  2. `FPL Team Name`: Manager's team name on the official FPL game.
  3. `FPL Entry ID`: Clickable link to the manager's official FPL profile (`https://fantasy.premierleague.com/entry/{fplId}/history`).
  4. `Status / Role`: Regular players receive a standard label; tournament admins receive a yellow alert badge: `Admin (Excluded)` with a `Shield` icon.
  5. `Actions`: `View Squad` button (`Eye` icon), which opens `<FantasyTeamModal />` to display the manager's live tactical pitch!

---

## 4. Technical Logic & Server Actions

### 4.1 Multi-Admin League Discovery (`getAdminLeaguesForTournamentAction`)
Fetches all private classic leagues for every administrator linked to the tournament:
```typescript
export async function getAdminLeaguesForTournamentAction(tournamentId: string) {
  // Queries all admins for the tournament
  // Queries official FPL API endpoint: https://fantasy.premierleague.com/api/entry/{fplId}/
  // Extracts classic leagues where league.league_type === 'x' (private)
  // Deduplicates across admins
}
```

### 4.2 Group Import & Admin Exclusion Snapshot (`importLeagueAsGroupAction`)
```typescript
export async function importLeagueAsGroupAction(
  tournamentId: string,
  fplLeagueId: number,
  adminFplId: number,
  logo?: string | null
) {
  // 1. Fetches league standings from FPL API:
  //    https://fantasy.premierleague.com/api/leagues-classic/{leagueId}/standings/
  // 2. Creates `Group` record with assigned logo.
  // 3. For each member in standings:
  //    Checks if member.entry matches ANY admin FPL ID for this tournament.
  //    Sets member.isAdmin = true if match found, false otherwise.
  // 4. Stores snapshot in Prisma `GroupMember` table.
}
```

---

## 5. Responsive Behavior

- **Mobile (< 768px):** Import drawer stacks filters vertically. Group cards display compact headers with wrap-around buttons. Members table supports horizontal scroll.
- **Desktop (>= 768px):** Full-width tables with crisp alignment, inline logo previews, and flush action buttons.

---

## 6. Edge Cases & Resilience

1. **Admin is a Member of the League:**
   - Automatically flagged as `isAdmin: true`. Their score is never added to team match totals.
2. **Duplicate Group Import:**
   - Attempting to import an FPL league already present in the tournament produces: `"This FPL league has already been imported into this tournament."`.
3. **FPL API Rate Limits or Downtime:**
   - Wrapped in robust error handlers returning descriptive error banners without crashing the application.
