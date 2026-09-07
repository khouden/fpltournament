# Page 10: Admin Group & FPL League Manager

> **Route:** `/admin/tournaments/[id]/groups`  
> **Source File:** `app/admin/tournaments/[id]/groups/page.tsx`  
> **Component Files:** `components/group-manager.tsx`, `components/tournament-wizard-stepper.tsx`, `components/team-logo-picker.tsx`, `components/add-manual-team-modal.tsx`, `components/manual-player-modal.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Operational Design System (`bg-[#F7F7F7]`, primary `#37003C`, accents `#00FF87` and `#E9007F`, cards `bg-white border-[#E5E5E5]`)  

---

## 1. Page Overview

The **Admin Group & League Manager Page** is Step 2 of the tournament setup wizard and the competition's roster orchestration engine. It empowers organizers to build and curate participating teams using two distinct workflows:
1. **FPL Classic League Import:** Automatically discover and import official Fantasy Premier League Classic Leagues across all tournament co-admins, capturing an immutable member roster snapshot.
2. **Manual Team & Player Creation:** Create standalone teams and custom player rosters completely offline without requiring an active FPL Classic League.

### Primary Responsibilities
- Discover and browse private FPL Classic Leagues across **all registered co-admins**.
- Search, filter by administrator, and import leagues as official participating teams.
- Create manual teams with custom rosters via `AddManualTeamModal` and `ManualPlayerModal`.
- Customize club branding with the **Team Logo Picker** (Premier League, European leagues, and custom badges).
- Enforce the **Strict Admin Exclusion Rule** across imported and manual rosters.
- Protect against FPL API deadline downtime with automated status detection (`/api/fpl/status`).
- Prevent schedule corruption with the **Delete Schedule Cascade** safety dialog.
- Provide guided navigation to Step 3 (Schedule & Fixtures) via `<TournamentWizardStepper />`.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Champions Fantasy Cup / Groups                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   [Badge: STEP 2 OF 4: TEAMS & GROUPS]                                      │
│   Manage Groups & Teams [Users 👥]                                          │
│   Import FPL Classic Leagues or create custom manual teams...               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-STEP WIZARD STEPPER:                                                      │
│   [1. Details (Done)] ─── [2. Groups (Active)] ─── [3. Schedule] ─── [4. Publish]│
├─────────────────────────────────────────────────────────────────────────────┤
│ FPL DEADLINE DOWNTIME ALERT (Conditional):                                  │
│   ⚠️ FPL API Gameweek Deadline in Progress: Game updates are underway.       │
│      League imports may experience temporary delays or unstable data.       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ACTION TOOLBAR:                                                             │
│   Participating Groups (4)     [+ Create Manual Team]  [📥 Import from FPL] │
├─────────────────────────────────────────────────────────────────────────────┤
│ FPL IMPORT DRAWER (Collapsible):                                            │
│   Filter by Admin: [ALL] [👑 John Doe] [🛡️ Jane Smith]                      │
│   Search Leagues: [🔍 Search league name...                               ] │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ Arsenal Supporters League                                             │ │
│   │ Owner: John Doe · 10 Members          [Choose Crest]  [Import as Team]│ │
│   ├───────────────────────────────────────────────────────────────────────┤ │
│   │ Red Devils Global League                                              │ │
│   │ Owner: Jane Smith · 12 Members        [Choose Crest]  [Import as Team]│ │
│   └───────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ PARTICIPATING TEAMS CONTAINER:                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Crest] London Gunners                  [FPL League]  10 Active Players │ │
│ │ FPL League ID: #987654      [Change Crest]  [Rename Team]  [🗑️ Remove]   │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ ROSTER SNAPSHOT TABLE:                                                  │ │
│ │ Manager Name       | FPL Team Name     | FPL ID  | Role     | Actions   │ │
│ │ • Alex Morgan      | Highbury Heroes   | #112233 | Player   | [👁️ Squad]│ │
│ │ • David Miller     | North Bank FC     | #445566 | Player   | [👁️ Squad]│ │
│ │ • John Doe (Admin) | Gunners XI        | #123456 | 🛡️ EXCL.  | [👁️ Squad]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Crest] Local All-Stars                 [Manual Team] 8 Active Players  │ │
│ │ Manager: Local Coordinator  [Change Crest]  [+ Add Player] [🗑️ Remove]   │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ • Sam Taylor       | Striker           | Manual  | Player   | [✏️ Edit]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ WIZARD BOTTOM BAR:                                                          │
│   [ ← Back to Details ]                       [ Continue to Schedule → ]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Workflows

### 3.1 Breadcrumbs & Stepper Navigation
- **Breadcrumb Trail:** `Dashboard` > `{tournament.name}` > `Groups`.
- **Wizard Stepper (`TournamentWizardStepper`):** Displays Step 2 as active.
- **Bottom Navigation Bar:**
  - `← Back to Details`: Returns to `/admin/tournaments/${id}/edit`.
  - `Continue to Schedule →`: Advances to Step 3 `/admin/tournaments/${id}/schedule?wizard=true` (enabled once at least 2 groups are present).

### 3.2 FPL Deadline & Downtime Protection Engine
- Queries `/api/fpl/status` and `lib/fpl-deadline.ts`.
- Fantasy Premier League takes its API offline or serves unstable data during gameweek deadlines (from 90 minutes before kickoff until games update).
- When a deadline is active:
  - Displays a high-visibility amber warning banner with live status details.
  - Warns organizers that FPL league import data may be provisional or unavailable.
  - Gracefully handles 503 Service Unavailable responses from FPL without crashing.

### 3.3 FPL Classic League Import Suite
Clicking `Import from FPL` expands the multi-admin league discovery drawer:
1. **Multi-Admin Filter Tabs:**
   - Filters leagues by organizer: `ALL`, `Primary Admin`, or specific `Co-Admin`.
   - Aggregates leagues from multiple accounts, allowing large competitions without hitting the FPL 30-league limit.
2. **Instant Search Filter:** Real-time text search across league names.
3. **League Discovery Row:**
   - Displays League Name, Owner Name, and Member Count.
   - **Choose Crest:** Opens `<TeamLogoPicker />` to pre-assign branding.
   - **Import as Team:** Calls `importLeagueAsGroupAction`. Fetches full roster and tags admin entries as excluded.

### 3.4 Manual Team & Player Creation Suite
Organizers can manage competitions without FPL leagues:
1. **Add Manual Team Modal (`AddManualTeamModal`):**
   - Opened via `+ Create Manual Team`.
   - Inputs: Team Name, Manager Name, Team Crest (via `TeamLogoPicker`).
   - Creates a native `Group` record marked as manual (`fplLeagueId: null`).
2. **Manual Player Modal (`ManualPlayerModal`):**
   - Opened via `+ Add Player` on any manual team card.
   - Inputs: Player Full Name, Fantasy Team Alias (optional), Admin Exclusion switch.
   - Creates/edits records in the `GroupMember` table.

### 3.5 Team Management & Crest Customization
Each participating team renders in an elevated card:
- **Badge Indicator:** `FPL League` (purple) or `Manual Team` (indigo).
- **Branding:** Club Crest or generated 2-letter monogram.
- **Actions:**
  - **Change Crest:** Opens `<TeamLogoPicker />` with European clubs and search.
  - **Rename Team:** Replaces title with inline text input for instant renaming.
  - **Remove Team:** Guarded by deletion dialogs.

### 3.6 Delete Schedule Cascade Safety Alert (`deleteGroupWithScheduleAction`)
- When an admin attempts to remove a group that is already scheduled in tournament fixtures:
  - System intercepts the action and displays an `AlertDialog` warning:
    > *"This group is currently included in existing matches. Removing this group will invalidate and delete the current fixture schedule. Would you like to remove the group and reset the schedule?"*
  - Admin must explicitly confirm `Delete Group & Reset Schedule` or `Cancel`.

---

## 4. Technical Logic & Server Actions

### 4.1 FPL League Import Action (`importLeagueAsGroupAction`)
```typescript
export async function importLeagueAsGroupAction(
  tournamentId: string,
  fplLeagueId: number,
  adminFplId: number,
  logo?: string | null
) {
  // 1. Fetch standings from FPL API: /api/leagues-classic/{leagueId}/standings/
  // 2. Fetch tournament admin FPL IDs to apply exclusion rule
  // 3. Create Group record with assigned logo
  // 4. Create GroupMember records:
  //    isAdmin = adminFplIds.includes(member.entry)
  // 5. Revalidate cache
}
```

### 4.2 Manual Team Creation (`createManualGroupAction`)
```typescript
export async function createManualGroupAction(
  tournamentId: string,
  data: { name: string; managerName?: string; logo?: string | null }
) {
  return await prisma.group.create({
    data: {
      tournamentId,
      name: data.name,
      logo: data.logo,
    },
  });
}
```

### 4.3 Safe Group Deletion (`deleteGroupWithScheduleAction`)
```typescript
export async function deleteGroupWithScheduleAction(
  groupId: string,
  deleteSchedule: boolean
) {
  if (deleteSchedule) {
    // Delete all matches and rounds associated with the tournament
    await prisma.match.deleteMany({ where: { round: { tournamentId } } });
    await prisma.round.deleteMany({ where: { tournamentId } });
  }
  return await prisma.group.delete({ where: { id: groupId } });
}
```

---

## 5. Responsive Behavior & Validation

- **Mobile Viewports (< 768px):** Import drawer stacks admin filters horizontally with scroll. Group cards display action buttons in responsive toolbars. Roster snapshot table supports horizontal swipe.
- **Desktop (>= 768px):** Full grid display with side-by-side league cards and expanded roster tables.
- **Validation Rules:**
  - Prevents importing duplicate FPL Classic Leagues into the same tournament.
  - Validates minimum team count (at least 2 groups required to build fixtures).
  - Flags admins automatically with non-scoring status (`isAdmin: true`).
