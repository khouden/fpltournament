# FPL Tournament Platform — Complete User Stories Specification

> **Project:** FPL Tournament (Fantasy Leagues)  
> **Type:** Mobile-First Full-Stack Web Application (Next.js, TypeScript, Prisma, Tailwind CSS, SQLite/Turso)  
> **Version:** 2.0 (MVP + Configurable Chips + Head-to-Head League System + Multi-Admin + Team Logos + Fantasy Squad Pitch)  
> **Last Updated:** September 2026  
> **Status:** Implemented & Verified  

---

## 1. Document Overview

This document provides a comprehensive, structured catalog of all **User Stories** across the FPL Tournament platform. Each story follows Agile industry best practices with standardized formatting:

- **Story ID & Title**
- **User Persona & Goal Statement** (`As a... I want to... So that...`)
- **Priority** (MoSCoW: Must Have, Should Have, Could Have)
- **Acceptance Criteria** (Structured in Gherkin `Given / When / Then` or explicit testable checklists)
- **Business Rules & Technical Edge Cases**
- **Associated Routes & Components**

---

## 2. User Personas

| Persona | Role Description | Permissions & Access |
| :--- | :--- | :--- |
| **👑 Platform Owner (Super Admin)** | The primary operator of the FPL Tournament platform. Logs into the administrative portal to manage tournaments, configure FPL accounts, and control publication. | Full read/write access to `/admin/*`, credentials authenticated via password, can create/edit/delete any tournament. |
| **🛡️ Tournament Co-Admin** | An FPL manager added to a tournament to aggregate leagues they belong to, enabling multi-league tournaments without needing the Primary Admin to join every league. | Verified by FPL ID. Leagues imported under their identity; their points are strictly excluded from group scores. |
| **⚽ League Participant / Manager** | A Fantasy Premier League manager who is a member of an imported FPL Classic League (tournament group). | No platform account needed. Their public FPL Gameweek points and team roster are fetched and displayed in tournament match cards. |
| **👀 Public Visitor / Spectator** | Football fans, league competitors, and spectators following tournament progress, fixtures, standings, and squad breakdowns. | Public read-only access to `/`, `/tournaments`, `/tournaments/[id]`, and `/matches/[id]`. Cannot view drafts or access admin routes. |

---

## 3. Epics & Story Traceability Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EPIC MAP OVERVIEW                                    │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ EPIC 1: Authentication & Sec.  │ US-AUTH-01 to US-AUTH-03 (Admin access, guards)       │
│ EPIC 2: FPL API Integration    │ US-FPL-01 to US-FPL-04 (Manager, leagues, caching)     │
│ EPIC 3: Tournament Lifecycle   │ US-TOURN-01 to US-TOURN-05 (CRUD, chips, publish)     │
│ EPIC 4: Multi-Admin Management │ US-ADMIN-01 to US-ADMIN-04 (Co-admins, exclusion)     │
│ EPIC 5: Group & Team Mgmt      │ US-GRP-01 to US-GRP-06 (Leagues, logos, snapshots)    │
│ EPIC 6: Schedule & Bracket     │ US-SCHED-01 to US-SCHED-05 (Rounds, GW, progression)   │
│ EPIC 7: Scoring & Engine       │ US-SCORE-01 to US-SCORE-08 (Sums, rules, chips, locks)│
│ EPIC 8: H2H League & Standings │ US-LEAG-01 to US-LEAG-05 (Table, PTS, tiebreakers)    │
│ EPIC 9: Public Experience      │ US-PUB-01 to US-PUB-06 (Home, tournament, matches)    │
│ EPIC 10: Squad Pitch Roster    │ US-ROST-01 to US-ROST-05 (Visual pitch, chips, bench) │
│ EPIC 11: Admin Tournament Hub  │ US-OPER-01 to US-OPER-04 (Dashboard, recalculate)     │
│ EPIC 12: API Integration Layer │ US-API-01 to US-API-04 (Public & Admin REST endpoints)│
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## EPIC 1: Authentication & Access Control

### US-AUTH-01: Admin Login & Session Management
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As a* Platform Administrator,  
  > *I want to* authenticate using a secure password on the `/admin/login` page,  
  > *So that* only authorized personnel can access tournament creation, management, and scoring tools.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Given an unauthenticated administrator on `/admin/login`, when they submit the correct `ADMIN_PASSWORD`, then an encrypted/signed HTTP-only session cookie (`admin_session`) is set with a 7-day expiration and they are redirected to `/admin`.
  - **AC-2:** Given an invalid password attempt, an explicit error message ("Invalid password") is displayed and no session cookie is created.
  - **AC-3:** If an already-authenticated admin navigates to `/admin/login`, they are immediately redirected to `/admin`.
- **Technical & Security Notes:** Handled in `middleware.ts`, `lib/session.ts`, and `app/admin/login/page.tsx`. Session cookie is `httpOnly`, `sameSite: "lax"`, and secured in production.

---

### US-AUTH-02: Protected Route Guarding & Public Isolation
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Platform Owner,  
  > *I want* all `/admin/*` pages and `/api/admin/*` endpoints strictly protected,  
  > *So that* unauthenticated visitors cannot tamper with tournament data or view unpublished drafts.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** When an unauthenticated visitor attempts to access any route under `/admin/*` (e.g. `/admin/tournaments/new`), they are intercepted by Next.js middleware and redirected to `/admin/login`.
  - **AC-2:** When an unauthenticated client requests any `/api/admin/*` endpoint via HTTP GET/POST/PUT/DELETE, the server immediately returns HTTP 401 Unauthorized (`{ "error": "Unauthorized" }`).
  - **AC-3:** All public routes (`/`, `/tournaments/*`, `/matches/*`, `/api/tournaments/*`, `/api/matches/*`) remain fully accessible without requiring any authentication.
- **Technical Notes:** Implemented at edge in `middleware.ts`.

---

### US-AUTH-03: Admin Logout
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As a* logged-in Administrator,  
  > *I want to* click a "Sign Out" button in the admin navigation header,  
  > *So that* my active session cookie is revoked and I am redirected to the public homepage or login screen.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Clicking "Sign Out" invokes the logout server action (`logoutAction`), clears the `admin_session` cookie immediately, and redirects to `/admin/login`.
  - **AC-2:** Subsequent navigation back to `/admin` forces a new login.

---

## EPIC 2: FPL API Integration & Verification

### US-FPL-01: Verify Manager by FPL Entry ID
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* enter an FPL Entry ID (e.g., `1234567`) and verify it against the official FPL API,  
  > *So that* I can confirm the manager's real name and team name before assigning them as a tournament admin.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Given a valid FPL Entry ID in `fpl-verifier.tsx`, clicking "Verify Admin" queries `GET /api/admin/fpl/manager/:id`.
  - **AC-2:** Upon success, a verified badge displays the Manager's Full Name (e.g. "Ahmed Ali") and FPL Team Name (e.g. "Admin FC").
  - **AC-3:** Given an invalid or non-existent Entry ID, an alert is rendered: `"Unable to find an FPL manager with this ID. Please verify the Entry ID."` The form prevents submission until verified.
- **Technical Notes:** `lib/fpl.ts` queries `https://fantasy.premierleague.com/api/entry/{id}/`. Supports mock fallbacks in local offline mode.

---

### US-FPL-02: Discover Manager Classic Leagues
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* automatically retrieve all Classic Leagues that a verified FPL manager belongs to,  
  > *So that* I can select which leagues will compete as tournament groups without manual data entry.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** When the admin accesses group selection, the system retrieves the manager's leagues via `GET /api/admin/fpl/manager/:id/leagues`.
  - **AC-2:** The UI filters for `classic` leagues and displays each league's name, ID, and member count. Broad public global leagues (Overall, country, favorite club) are excluded or distinguished from private mini-leagues.
  - **AC-3:** If the FPL API fails or times out, a clean error alert appears with a retry action.

---

### US-FPL-03: Retrieve League Members & Roster Snapshot
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want* the system to query the FPL league standings endpoint and capture each member's details,  
  > *So that* the full roster (member name, team name, and entry ID) is preserved inside the database.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Calling `getLeagueMembers(leagueId)` queries `https://fantasy.premierleague.com/api/leagues-classic/{leagueId}/standings/`.
  - **AC-2:** Each member record in the group snapshot includes: `fplName`, `fplTeamName`, `fplId`, and `isAdmin` flag.
  - **AC-3:** The system handles multi-page league standings if a league has more than 50 members.

---

### US-FPL-04: Resiliency, In-Memory Caching & Offline Fallback
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* System Operator,  
  > *I want* FPL API responses cached and shielded with fallbacks,  
  > *So that* rate limits are respected and the application remains fast and operational even during FPL server maintenance.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** Static FPL bootstrap data (`bootstrap-static`) and player metadata are cached in memory with a TTL (e.g. 5 minutes).
  - **AC-2:** Mock data stubs exist for known test managers (`1234567`, `111111`, `222222`) and leagues (`100001` - Real Madrid, `100002` - Napoli) allowing end-to-end testing without external network access.
  - **AC-3:** All external HTTP requests include reasonable timeouts (10 seconds) with structured error propagation.

---

## EPIC 3: Tournament Lifecycle & Configuration

### US-TOURN-01: Create a Tournament
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* fill out the tournament creation form with a Name, Season Year, Primary Admin FPL ID, and chip settings,  
  > *So that* a new tournament is initialized in `DRAFT` status ready for group import.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Form is accessible at `/admin/tournaments/new`.
  - **AC-2:** Validation requires:
    - Tournament Name (min 3 chars)
    - Season (e.g. 2025 or 2026)
    - Valid Primary Admin FPL ID (must pass FPL verification)
  - **AC-3:** Submitting creates a `Tournament` record with `status: "DRAFT"` and an associated `TournamentAdmin` record with `isPrimary: true`.
  - **AC-4:** On success, redirects the admin to the Tournament Management Hub (`/admin/tournaments/[id]`).

---

### US-TOURN-02: Configurable Chip Rules (Bench Boost & Triple Captain)
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* independently toggle whether **Bench Boost** and **Triple Captain** chips count towards tournament match scores,  
  > *So that* our league can customize scoring rules (e.g., pure starting 11 play vs all-chips-allowed).
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** The tournament form features two distinct toggle buttons:
    - 💺 **Enable / Disable Bench Boost** (`allowBenchBoost`: boolean, default `true`)
    - 👑 **Enable / Disable Triple Captain** (`allowTripleCaptain`: boolean, default `true`)
  - **AC-2:** Clear helper text explains the rules:
    - Bench Boost disabled: `bboost` chip will exclude bench points from the group total.
    - Triple Captain disabled: `3xc` chip reduces captain points from 3x to 2x (deducts 1x base points).
    - Free Hit & Wildcard chips always count normally.
  - **AC-3:** These settings are stored on the `Tournament` model and displayed as visual badges across the tournament card, match cards, and standings.

---

### US-TOURN-03: Edit Tournament Configuration
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* update tournament metadata (Name, Season, Chip toggles) via `/admin/tournaments/[id]/edit`,  
  > *So that* I can correct typographical errors or adjust rules before publishing.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Navigating to `/admin/tournaments/[id]/edit` pre-populates all existing tournament fields.
  - **AC-2:** Updating name, season, or chip toggles updates the database and triggers cache revalidation via `safeRevalidatePath`.
  - **AC-3:** If matches have already been scored and chip rules change, a notification prompts the admin to recalculate match scores.

---

### US-TOURN-04: Delete Tournament with Cascade Cleanup
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* delete a test or abandoned tournament with a confirmation modal,  
  > *So that* all associated groups, members, rounds, matches, scores, and admin links are cleanly purged from the database.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** A "Delete Tournament" action is available with a confirmation dialog warning that this action is irreversible.
  - **AC-2:** Executing deletion removes the tournament and leverages Prisma `onDelete: Cascade` to wipe all associated `TournamentAdmin`, `Group`, `GroupMember`, `Round`, `Match`, and `MatchMemberScore` records.
  - **AC-3:** The admin is redirected back to the `/admin` dashboard with a success toast notification.

---

### US-TOURN-05: Tournament Publication Workflow (DRAFT ➔ PUBLISHED ➔ FINISHED)
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* publish a draft tournament or unpublish an active tournament,  
  > *So that* public visitors only see completed, verified schedules and standings.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** In `/admin/tournaments/[id]`, clicking "Publish Tournament" changes `status` from `DRAFT` to `PUBLISHED` via `POST /api/admin/tournaments/:id/publish`.
  - **AC-2:** When published, the tournament immediately becomes visible on the public homepage (`/`) and tournaments catalog (`/tournaments`).
  - **AC-3:** Clicking "Unpublish" reverts `status` to `DRAFT`. The public page `/tournaments/[id]` immediately returns HTTP 404 for visitors.
  - **AC-4:** When all matches across all rounds are finalized, status can transition to `FINISHED`.

---

## EPIC 4: Multi-Admin Support

### US-ADMIN-01: Add and Verify Co-Admins
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* add one or more Co-Admins by FPL ID to a tournament,  
  > *So that* their joined FPL leagues become available to import into the same tournament.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** The tournament form and management hub support adding multiple Co-Admins.
  - **AC-2:** Each added Co-Admin is verified via FPL API to resolve their manager name and team name.
  - **AC-3:** The primary admin is marked with `isPrimary: true`, while co-admins are stored with `isPrimary: false` in `TournamentAdmin`.
  - **AC-4:** Duplicate admin FPL IDs for the same tournament are rejected.

---

### US-ADMIN-02: Unified Multi-Admin League Discovery
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want* the Group Import screen to aggregate leagues from ALL configured tournament admins,  
  > *So that* I can import leagues from Admin A and leagues from Admin B into one unified tournament.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Calling `getAdminLeaguesForTournamentAction(tournamentId)` iterates over all `TournamentAdmin` entries for that tournament.
  - **AC-2:** The returned league catalog labels each league with the corresponding admin who provides access (e.g. `Imported via: Ahmed Ali (Primary)` vs `Imported via: Ali Mansour (Co-Admin)`).
  - **AC-3:** Filtering and grouping allow selecting leagues across any or all tournament admins.

---

### US-ADMIN-03: Global Multi-Admin Exclusion Across All Groups
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Tournament Organizer,  
  > *I want* EVERY tournament admin's FPL ID automatically excluded from scoring in ANY participating group,  
  > *So that* organizers who participate in one or multiple leagues never artificially skew group point totals.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** When calculating scores for any group, `calculateGroupScore` gathers all `adminFplId` values registered under the tournament's `TournamentAdmin` records.
  - **AC-2:** Any group member whose `fplId` matches any tournament admin is automatically flagged `isExcluded: true`.
  - **AC-3:** Their points are deducted from the group total and their breakdown shows an "Admin Excluded" pill.

---

### US-ADMIN-04: Remove Co-Admin
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* remove a Co-Admin from a tournament,  
  > *So that* organizers who are no longer managing the tournament are revoked.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** In the tournament admin list, a "Remove" button is visible on non-primary co-admins.
  - **AC-2:** The Primary Admin cannot be deleted (button disabled or hidden).
  - **AC-3:** Removing a co-admin preserves existing groups that were already imported, but warns if subsequent recalculations will treat their FPL ID differently.

---

## EPIC 5: Group & Team Management

### US-GRP-01: Import FPL Classic Leagues as Tournament Groups
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* select an FPL Classic League from the available list and click "Import as Group",  
  > *So that* the league and all its current members are saved into the tournament database.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Group Import is available at `/admin/tournaments/[id]/groups`.
  - **AC-2:** The system validates that an admin is a confirmed member of the selected league before importing.
  - **AC-3:** The league's members are imported into `GroupMember` with their `fplName`, `fplTeamName`, and `fplId`.
  - **AC-4:** The newly created group appears in the Tournament Groups list with its member count.

---

### US-GRP-02: Automatic Admin Member Flagging
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want* the system to detect if the Admin is listed among the members of an imported league,  
  > *So that* the Admin member is permanently flagged `isAdmin: true` on import.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** During group import, any member whose `fplId` matches any `TournamentAdmin` for that tournament is saved with `isAdmin: true`.
  - **AC-2:** In the Group Members list, the Admin is highlighted with a distinct shield badge: `🛡️ Admin (Excluded from scoring)`.

---

### US-GRP-03: Team Logo Picker & Club Branding
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* assign a high-resolution football club logo to each tournament group using a logo picker,  
  > *So that* groups represent real clubs (e.g. Real Madrid, Arsenal, Napoli) with professional visual branding.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** In `group-manager.tsx`, each group card features an interactive team logo preview and "Choose Logo" button.
  - **AC-2:** Clicking opens the `TeamLogoPicker` modal, featuring:
    - Search bar filtering clubs by name (e.g. "Arsenal", "Madrid", "Bayern")
    - Categorized club list with real logo thumbnails
    - Clear selection option to remove a logo
  - **AC-3:** Selecting a logo updates `group.logo` in the database.
  - **AC-4:** The selected logo renders across the admin hub, public bracket, match cards, squad views, and league standings.

---

### US-GRP-04: Rename Tournament Group
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* customize or shorten the display name of a tournament group,  
  > *So that* lengthy or casual FPL league names (e.g. "Official Madridistas Abu Dhabi 2026") are displayed cleanly (e.g. "Real Madrid").
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** Admin can click "Edit Name", input a custom name, and save via `updateGroupAction`.
  - **AC-2:** The original `fplLeagueId` remains intact for external FPL tracking.
  - **AC-3:** The updated name propagates across all rounds, fixtures, and standings immediately.

---

### US-GRP-05: Delete Tournament Group
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* delete an imported group if added by mistake,  
  > *So that* the tournament group lineup remains accurate.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Clicking "Delete Group" displays a confirmation prompt.
  - **AC-2:** If the group is already assigned to active matches in the schedule, the system displays a clear error preventing deletion until match assignments are cleared.
  - **AC-3:** Deleting an unassigned group removes the `Group` and cascades deletion of its `GroupMember` records.

---

### US-GRP-06: Roster Snapshot Freezing
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Tournament Organizer,  
  > *I want* group rosters frozen upon import,  
  > *So that* any managers joining or leaving the FPL mini-league mid-season do not corrupt historical or ongoing tournament matches.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Match scoring only queries the Gameweek points of the frozen `GroupMember` list saved in the database.
  - **AC-2:** Subsequent external FPL league changes do not automatically modify existing tournament group rosters.

---

## EPIC 6: Tournament Schedule & Knockout Bracket Builder

### US-SCHED-01: Round Creation & Gameweek Assignment
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* create tournament rounds and assign each round an FPL Gameweek (GW 1 to 38),  
  > *So that* every fixture in that round automatically pulls points from the designated Gameweek.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** In `/admin/tournaments/[id]/schedule`, clicking "Add Round" opens round configuration.
  - **AC-2:** Fields include:
    - Round Name (e.g. "Round 1", "Quarter-Finals", "Semi-Finals", "Final")
    - Gameweek number (validated integer between 1 and 38)
  - **AC-3:** The system enforces unique round numbers per tournament.

---

### US-SCHED-02: Schedule Direct Group-vs-Group Fixtures
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* pair two imported groups together in a round fixture,  
  > *So that* they compete against each other in a Home vs Away match.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Inside a round card, clicking "Add Match" allows selecting a Home Group and an Away Group from dropdowns.
  - **AC-2:** The system prevents selecting the same group for both Home and Away in the same match.
  - **AC-3:** A match record is created with `status: "SCHEDULED"`, `matchNumber`, `homeGroupId`, and `awayGroupId`.

---

### US-SCHED-03: Knockout Progression & Winner-of-Match Progression
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* schedule subsequent rounds where participants are defined as "Winner of Match X",  
  > *So that* tournament knockout brackets automatically advance victorious groups as earlier rounds conclude.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** In round match builder, participant slots can be configured as either a Direct Group or a "Winner of Match [N]" reference.
  - **AC-2:** The database stores `homeWinnerOfMatchId` and/or `awayWinnerOfMatchId`.
  - **AC-3:** The UI displays a placeholder badge (e.g. `🏆 Winner of Match 1`) until the prerequisite match is completed and finalized.
  - **AC-4:** When the referenced match is finalized, the winning group ID is automatically populated into the downstream match slot.

---

### US-SCHED-04: Edit & Delete Fixtures
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* edit match pairings or remove an unplayed match,  
  > *So that* scheduling mistakes can be rectified before games begin.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Admin can switch groups or winner references for any `SCHEDULED` match.
  - **AC-2:** Admin can delete an individual match or an entire round.
  - **AC-3:** Deleting a match referenced by a downstream match clears the downstream reference and warns the admin.

---

### US-SCHED-05: Schedule Validation & Cycle Prevention
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want* the schedule builder to validate all fixture configurations,  
  > *So that* circular match dependencies or invalid gameweek chronologies are impossible.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** A match cannot reference a downstream match or itself as its winner prerequisite.
  - **AC-2:** Warning alerts appear if later knockout rounds are assigned to earlier Gameweeks than prior rounds.

---

## EPIC 7: Scoring Engine & Business Logic

### US-SCORE-01: Automated Gameweek Group Score Summation
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Platform User,  
  > *I want* each group's total match score to be the exact sum of all valid members' net Gameweek points,  
  > *So that* the group total accurately reflects their team performance.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** For a match in Gameweek $G$, each member's Gameweek score is retrieved from FPL.
  - **AC-2:** `Group Score = Sum(member.adjustedNetPoints)` for all members where `isExcluded == false`.
  - **AC-3:** Member scores and chip details are recorded in `MatchMemberScore`.

---

### US-SCORE-02: Strict Admin Exclusion Rule Enforcement
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Tournament Organizer,  
  > *I want* all Admin members strictly excluded from group score summation in EVERY calculation,  
  > *So that* the admin's personal FPL team never contributes to or affects tournament outcomes.
- **Priority:** Must Have (P1) — **CORE BUSINESS RULE**
- **Acceptance Criteria:**
  - **AC-1:** If a group member has `isAdmin == true` or matches any `TournamentAdmin.fplId`, their `MatchMemberScore.isExcluded` is set to `true`.
  - **AC-2:** The admin's points are NEVER added to `totalScore`, even if their score is the highest in the group.
  - **AC-3:** Example verification (Real Madrid vs Napoli GW5):
    - Real Madrid: Ali (50) + Mohamed (50) + Zaid (30) + Baha (30) + Admin (40, excluded) = **160 PTS**.
    - Napoli: Othman (80) + Said (50) + Omar (20) + Samir (10) + Admin (40, excluded) = **160 PTS**.
    - Match Result: **DRAW (160 - 160)**.

---

### US-SCORE-03: Configurable Bench Boost Deduction Logic
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Tournament Organizer,  
  > *I want* the scoring engine to deduct bench points if the tournament has disabled the Bench Boost chip,  
  > *So that* managers playing Bench Boost only have their starting 11 points count.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Given a tournament with `allowBenchBoost = false`:
    - When a manager activates the `bboost` chip in that Gameweek,
    - The engine retrieves `points_on_bench` from FPL picks.
    - `adjustedNetPoints = rawPoints - points_on_bench`.
    - `chipDeduction = points_on_bench`.
  - **AC-2:** Given a tournament with `allowBenchBoost = true`:
    - Bench points count fully; `chipDeduction = 0`.
  - **AC-3:** The deduction is saved in `MatchMemberScore.chipDeduction` and clearly itemized on the scorecard.

---

### US-SCORE-04: Configurable Triple Captain Deduction Logic
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Tournament Organizer,  
  > *I want* the scoring engine to reduce Triple Captain to standard Double Captain if Triple Captain is disabled,  
  > *So that* overpowered 3x captain multipliers do not distort tournament balance when disabled.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Given a tournament with `allowTripleCaptain = false`:
    - When a manager activates the `3xc` chip in that Gameweek,
    - The engine identifies the captain pick and retrieves their base Gameweek points.
    - `adjustedNetPoints = rawPoints - captainBasePoints` (reducing 3x to 2x).
    - `chipDeduction = captainBasePoints`.
  - **AC-2:** Given a tournament with `allowTripleCaptain = true`:
    - The 3x multiplier is retained in full; `chipDeduction = 0`.
  - **AC-3:** The deduction is stored in `MatchMemberScore.chipDeduction` and displayed as a chip adjustment.

---

### US-SCORE-05: Match Result & Draw Determination
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Platform User,  
  > *I want* the match result automatically determined from the final group scores,  
  > *So that* winners and draws are unambiguously recorded.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** If `homeScore > awayScore`, `result = "HOME_WIN"`, `winnerId = homeGroupId`.
  - **AC-2:** If `awayScore > homeScore`, `result = "AWAY_WIN"`, `winnerId = awayGroupId`.
  - **AC-3:** If `homeScore == awayScore`, `result = "DRAW"`, `winnerId = null`.
  - **AC-4:** The match card displays the corresponding winner badge or yellow "DRAW" pill.

---

### US-SCORE-06: On-Demand Score Recalculation
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* click "Recalculate Scores" on an in-progress match or round,  
  > *So that* live FPL substitutions, bonus points, or corrections are pulled into the tournament.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Clicking "Recalculate" calls `calculateMatchScore(matchId, forceRecalculate = true)`.
  - **AC-2:** All member Gameweek scores are re-fetched from the FPL API and recalculated against current tournament rules.
  - **AC-3:** Match status updates to `COMPLETED` (or remains `IN_PROGRESS` if the Gameweek is currently active).

---

### US-SCORE-07: Match Finalization & Immutable Snapshotting
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* finalize a match once the Gameweek is officially closed by the Premier League,  
  > *So that* scores are permanently locked and protected against any future external FPL alterations.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** In `/admin/tournaments/[id]`, clicking "Finalize" marks `match.status = "FINALIZED"` and `MatchMemberScore.isFinal = true`.
  - **AC-2:** Finalized matches are frozen; standard recalculation requests skip finalized matches unless an admin explicitly overrides with a force flag.
  - **AC-3:** Finalized badge (`🔒 FINAL`) appears on the match card.

---

### US-SCORE-08: Automatic Winner Advancement in Knockout Brackets
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Platform User,  
  > *I want* finalizing a match to automatically assign the winning group to downstream dependent matches,  
  > *So that* tournament knockout brackets advance automatically without manual administrative reassignment.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** When Match $M$ is finalized with a winning group $W$, the engine checks for matches where `homeWinnerOfMatchId == M.id` or `awayWinnerOfMatchId == M.id`.
  - **AC-2:** If found, the corresponding slot (`homeGroupId` or `awayGroupId`) is updated to $W$.
  - **AC-3:** The downstream match card updates from "Winner of Match M" to the actual group name and logo.

---

## EPIC 8: Head-to-Head Points League & Standings System

### US-LEAG-01: Points-Based Allocation Model (Win = +3, Draw = +1, Loss = 0)
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Tournament Participant or Visitor,  
  > *I want* completed matches to award league table points based on traditional football rules,  
  > *So that* teams build up standings points across the season.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** For every completed match:
    - Winner is awarded **+3 League Points**.
    - Both teams receive **+1 League Point** each in a Draw.
    - Loser receives **0 League Points**.
  - **AC-2:** Cumulative metrics are calculated for each group:
    - Matches Played (`MP`)
    - Won (`W`), Drawn (`D`), Lost (`L`)
    - Total Points For (`PF` = sum of group match scores)
    - Total Points Against (`PA` = sum of opponent match scores)
    - Points Difference (`+/-` or `pointsDiff` = `PF - PA`)
    - Total League Points (`PTS` = `(W * 3) + (D * 1)`)

---

### US-LEAG-02: Multi-Tiered Tiebreaker Hierarchy
- **Role:** 👑 Platform Owner / 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* league standings sorted with unambiguous, official tiebreaker rules,  
  > *So that* rank positions are always objective and fair.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** The standings table orders groups strictly using the following hierarchy:
    1. Total League Points (`PTS`) descending
    2. Points Difference (`+/-`) descending
    3. Points For (`PF`) descending
    4. Group Name alphabetically ascending
  - **AC-2:** Automated tests in `test-scoring.ts` confirm all tiebreaker edge cases pass.

---

### US-LEAG-03: Responsive Interactive League Standings Table
- **Role:** 👀 Public Visitor / 👑 Platform Owner
- **Story:**  
  > *As a* Visitor,  
  > *I want to* view a live League Standings Table on the tournament page,  
  > *So that* I can quickly assess the leader, playoff spots, and overall performance.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** `LeagueTable` component renders table headers: `Rank`, `Team`, `MP`, `W`, `D`, `L`, `PF`, `PA`, `+/-`, `PTS`, `Form`.
  - **AC-2:** Each team row displays their rank number, club logo image (or fallback badge), and clickable group name.
  - **AC-3:** Mobile layout cleanly compresses or horizontally scrolls non-critical columns (`PA`, `+/-`) while keeping `Team`, `PTS`, and `Rank` fixed and prominent.

---

### US-LEAG-04: Recent Match Form Guide Pills
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Football Fan,  
  > *I want to* see each team's recent match results displayed as colored form pills (W/D/L),  
  > *So that* I can instantly see which teams are in winning form.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** In the standings table, the `Form` column renders up to the last 5 completed matches in chronological order.
  - **AC-2:** Results are styled as micro-badges:
    - 🟩 **W** (Green badge for Win)
    - 🟨 **D** (Yellow badge for Draw)
    - 🟥 **L** (Red/Neutral badge for Loss)

---

### US-LEAG-05: Gameweek Fixtures with Points Accrual Tags
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* fixture cards to display which team earned +3 PTS or if both earned +1 PT,  
  > *So that* match outcomes tie directly to the league standings.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** In public match cards and match detail headers:
    - Winning side displays `+3 PTS` in a green accent badge.
    - If drawn, both sides display `+1 PT` in an amber accent badge.
    - Losing side displays `0 PTS` or muted styling.

---

## EPIC 9: Public Visitor Experience & Hub

### US-PUB-01: Public Homepage & Active Tournaments Catalog
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Public Visitor,  
  > *I want to* visit the application homepage (`/`) and browse all active and finished tournaments,  
  > *So that* I can select a tournament to follow.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Homepage displays a modern hero header, quick platform highlights, and a card list of all `PUBLISHED` and `FINISHED` tournaments.
  - **AC-2:** Each tournament card displays: Name, Season, Number of Groups, Current Round/Gameweek, and Chip Rule badges.
  - **AC-3:** Clicking "View Tournament" navigates to `/tournaments/[id]`.

---

### US-PUB-02: Public Tournament Details Hub
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want to* open a tournament and explore its Live Standings, Rounds, and Fixture Brackets,  
  > *So that* I have a complete hub for that competition.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Accessible at `/tournaments/[id]`.
  - **AC-2:** Displays tournament title, season, and chip rules banner.
  - **AC-3:** Features tabbed or stacked sections:
    - **Standings Tab:** The full interactive Head-to-Head `LeagueTable`.
    - **Fixtures & Results Tab:** All rounds and match cards grouped by Gameweek.
  - **AC-4:** Clicking any match card opens `/matches/[id]`.

---

### US-PUB-03: Shielding Draft & Unpublished Tournaments
- **Role:** 👀 Public Visitor / 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want* draft tournaments hidden from public listings and URLs,  
  > *So that* visitors never see incomplete or test setups.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Tournaments with `status: "DRAFT"` are excluded from `GET /api/tournaments` and the public homepage query.
  - **AC-2:** Attempting to navigate directly to `/tournaments/[draftId]` as a public user triggers Next.js `notFound()` (404 Page).

---

### US-PUB-04: Comparative Match Scorecard
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want to* view a detailed scorecard on `/matches/[id]` showing team scores and side-by-side member contributions,  
  > *So that* I can analyze how each fantasy manager performed.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Accessible at `/matches/[id]`.
  - **AC-2:** Displays match header: Home Team Logo & Name, Score, Result Badge (+3 PTS / +1 PT), Away Team Logo & Name, and Gameweek.
  - **AC-3:** Squad rosters for Home and Away groups are displayed side-by-side.
  - **AC-4:** Each member row includes: Member Name, FPL Team Name, Active Chip (if used), Points Deductions (if any), and Net Counted Points.

---

### US-PUB-05: Explicit Excluded Admin Display
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* the Admin member visually separated and clearly labeled as excluded on match scorecards,  
  > *So that* there is 100% transparency that the admin's score was not added to the team total.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Any member with `isExcluded == true` is rendered in a separate "Tournament Admin" card or muted container below the active squad.
  - **AC-2:** A prominent badge states: `🛡️ Excluded from tournament score`.
  - **AC-3:** The math breakdown explicitly verifies that the total score equals the sum of included members only.

---

### US-PUB-06: Active Tournament Chip Rules Badges
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* clear visual indicators on tournament and match pages informing me whether Bench Boost and Triple Captain are active,  
  > *So that* I understand why chip deductions or captain reductions occurred.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** Tournament and match headers render chip badges:
    - 💺 `Bench Boost: Allowed` (Green) or `Bench Boost: Disabled` (Muted)
    - 👑 `Triple Captain: Allowed` (Green) or `Triple Captain: 2x Only` (Muted)
  - **AC-2:** Hovering or viewing badges provides a tooltip explaining the deduction rule.

---

## EPIC 10: Interactive Fantasy Team Roster & Squad Pitch

### US-ROST-01: Visual Football Pitch Roster View
- **Role:** 👀 Public Visitor / 👑 Platform Owner
- **Story:**  
  > *As a* Visitor or Manager,  
  > *I want to* click on any manager's row in a match scorecard to open their full FPL squad formation on a visual football pitch,  
  > *So that* I can see exactly which Premier League players they started, their real-time points, and their captain.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** In `match-squad-client.tsx`, clicking on a manager row opens the `FantasyTeamModal`.
  - **AC-2:** The modal displays an authentic green football pitch background with tactical pitch line markings.
  - **AC-3:** The starting XI are arranged in their actual tactical formation (e.g. 1-3-5-2, 1-4-4-2, 1-4-3-3):
    - Row 1: Goalkeeper (`GKP`)
    - Row 2: Defenders (`DEF`)
    - Row 3: Midfielders (`MID`)
    - Row 4: Forwards (`FWD`)

---

### US-ROST-02: Clear Separation of Starting XI and Substitutes Bench
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* the 4 substitutes clearly separated onto a bench panel below the pitch,  
  > *So that* starting players and bench players are immediately distinguishable.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Players 1 to 11 appear on the tactical pitch grid.
  - **AC-2:** Players 12 to 15 are displayed in an "Armchair / Substitutes Bench" row beneath the pitch:
    - Backup Goalkeeper
    - Sub 1, Sub 2, Sub 3 in priority order
  - **AC-3:** If Bench Boost is active or allowed, bench points are labeled as contributing; if disabled, they are grayed out.

---

### US-ROST-03: Captain (C) and Vice-Captain (V) Multiplier Badges
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* the Captain and Vice-Captain clearly badged on the pitch,  
  > *So that* I know whose points were doubled or tripled.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** The designated Captain displays a gold **(C)** crown badge.
  - **AC-2:** The Vice-Captain displays a silver **(V)** shield badge.
  - **AC-3:** If Triple Captain is played and allowed, the badge displays `3x (C)`. If Triple Captain is disabled by tournament rules, the badge displays `2x (C)` alongside an explanatory note.

---

### US-ROST-04: Player Card Gameweek Points & Chip Adjustment Banner
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want* each player card on the pitch to show their club, position, and individual Gameweek points,  
  > *So that* I can see exactly which players earned the manager their score.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Each player jersey/card shows: Player Name (e.g. "Haaland", "Salah", "Palmer"), Real Club short code (e.g. `MCI`, `LIV`, `CHE`), Position, and Gameweek Points.
  - **AC-2:** If the manager played an active chip that Gameweek (Wildcard, Free Hit, Bench Boost, Triple Captain), a glowing chip banner appears across the top of the modal.
  - **AC-3:** If any chip point deductions were applied, a banner itemizes the deduction: `"Triple Captain disabled: -12 pts deducted (captain reduced from 3x to 2x)"`.

---

### US-ROST-05: Pitch vs List View Toggle & External FPL Link
- **Role:** 👀 Public Visitor
- **Story:**  
  > *As a* Visitor,  
  > *I want to* toggle between Pitch View and List View, and have a direct link to the manager's official FPL profile,  
  > *So that* I can inspect the roster in my preferred layout and verify on the official Premier League website.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** A view toggle button allows switching between "Pitch View" (visual formation) and "List View" (tabular player stats).
  - **AC-2:** An "Official FPL Profile" button opens `https://fantasy.premierleague.com/entry/{fplId}/event/{gameweek}` in a new tab.
  - **AC-3:** Pressing the `Escape` key or clicking the close button dismisses the modal.

---

## EPIC 11: Admin Tournament Operations Hub

### US-OPER-01: Central Tournament Management Dashboard
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want a* comprehensive tournament management hub at `/admin/tournaments/[id]`,  
  > *So that* I have a single control panel to oversee groups, rounds, fixtures, live standings, and publication.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** The page renders:
    - Tournament status banner with quick publish/unpublish toggle
    - Quick navigation pills: `Groups Manager`, `Schedule Builder`, `Edit Settings`
    - Live League Standings preview
    - Rounds and Fixtures control accordion
  - **AC-2:** Fixtures display their current status (`SCHEDULED`, `COMPLETED`, `FINALIZED`).

---

### US-OPER-02: One-Click Gameweek Fixture Recalculate
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* click "Recalculate" on any match card in the Admin Hub,  
  > *So that* updated points from the FPL API are instantly pulled and persisted.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Each match card in the admin view includes a "Recalculate" button.
  - **AC-2:** Clicking calls `POST /api/admin/matches/:id/recalculate`.
  - **AC-3:** The match card updates its scores, result, and status without requiring a full page refresh.

---

### US-OPER-03: One-Click Match Finalization
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* click "Finalize" on a completed match,  
  > *So that* the match result is locked and any downstream knockout match receives the winner automatically.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** Non-finalized matches feature a "Finalize" button.
  - **AC-2:** Clicking calls `POST /api/admin/matches/:id/finalize`.
  - **AC-3:** Status updates to `FINALIZED`, scores are frozen, and downstream dependencies are resolved.

---

### US-OPER-04: Batch Tournament Recalculation
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrator,  
  > *I want to* click "Recalculate Entire Tournament",  
  > *So that* all rounds and fixtures are recalculated in chronological order.
- **Priority:** Should Have (P2)
- **Acceptance Criteria:**
  - **AC-1:** Admin Hub includes a "Recalculate All" button.
  - **AC-2:** Executes `recalculateTournamentScores(tournamentId)` sequentially through each round.
  - **AC-3:** Returns a summary of updated matches and refreshed standings.

---

## EPIC 12: API & Integration Surface

### US-API-01: Public Tournament REST Endpoints
- **Role:** 👀 Public Visitor / Third-Party Integration
- **Story:**  
  > *As an* API Consumer,  
  > *I want to* fetch public tournament information via JSON REST endpoints,  
  > *So that* external widgets or clients can consume tournament data.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** `GET /api/tournaments`: Returns array of published tournaments (`{ id, name, season, status, groupsCount }`).
  - **AC-2:** `GET /api/tournaments/:id`: Returns tournament metadata, groups, rounds, and matches. Draft tournaments return HTTP 404.
  - **AC-3:** `GET /api/matches/:id`: Returns match scores, member breakdowns, and excluded admin details.

---

### US-API-02: Public League Standings REST Endpoint
- **Role:** 👀 Public Visitor / Third-Party Integration
- **Story:**  
  > *As an* API Consumer,  
  > *I want to* fetch the live Head-to-Head standings for a tournament via REST API,  
  > *So that* client applications can render standings tables without recalculating business rules.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** `GET /api/tournaments/:id/standings`: Returns `{ standings: GroupStanding[] }`.
  - **AC-2:** Each item in `standings` contains: `rank`, `groupId`, `groupName`, `logo`, `played`, `won`, `drawn`, `lost`, `pointsFor`, `pointsAgainst`, `pointsDiff`, `leaguePoints`, and `form`.
  - **AC-3:** Results are ordered according to the official tiebreaker hierarchy.

---

### US-API-03: Protected Admin Tournament REST Endpoints
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrative Client,  
  > *I want* REST endpoints to create, update, delete, publish, and finalize tournaments,  
  > *So that* admin operations can be performed via authenticated API calls.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** `POST /api/admin/tournaments`: Creates tournament with admins and chip settings.
  - **AC-2:** `PATCH /api/admin/tournaments/:id`: Updates tournament settings.
  - **AC-3:** `DELETE /api/admin/tournaments/:id`: Cascades deletion of tournament.
  - **AC-4:** `POST /api/admin/tournaments/:id/publish` & `POST /api/admin/tournaments/:id/unpublish`: Toggles public visibility.
  - **AC-5:** All endpoints require an active `admin_session` cookie; unauthenticated requests return 401.

---

### US-API-04: Protected Admin FPL Proxy Endpoints
- **Role:** 👑 Platform Owner
- **Story:**  
  > *As an* Administrative Client,  
  > *I want* secure API proxies to verify managers and discover leagues,  
  > *So that* frontend admin components can query FPL data safely.
- **Priority:** Must Have (P1)
- **Acceptance Criteria:**
  - **AC-1:** `GET /api/admin/fpl/manager/:id`: Returns verified manager name and team.
  - **AC-2:** `GET /api/admin/fpl/manager/:id/leagues`: Returns manager's joined classic leagues.
  - **AC-3:** `GET /api/admin/fpl/league/:id`: Returns league metadata and current standings members.
  - **AC-4:** All endpoints enforce admin authorization.

---

## 4. Non-Functional Requirements & Cross-Cutting Constraints

| Category | Requirement & Acceptance Standard |
| :--- | :--- |
| **Mobile-First Responsiveness** | All screens (homepage, tournament hub, match details, standings, and pitch modal) must be optimized for mobile viewports (375px+), tablets, and desktops. |
| **Performance & Caching** | External FPL static bootstrap data must be cached in memory. Finalized match scores are immutable and cached indefinitely. |
| **Data Integrity** | Cascade constraints ensure that deleting a tournament cleanly removes all associated rounds, matches, groups, and scores without leaving orphaned records. |
| **Security & Privacy** | Session cookies must be `httpOnly`, `sameSite: "lax"`, and use secure HTTPS in production. No participant passwords or sensitive personal data are collected or stored. |
| **Testing Coverage** | Automated test suites (`test-scoring.ts`, `test-api-routes.ts`, `test-multi-admin.ts`) must pass 100% of assertion tests across all scoring, tiebreaker, and multi-admin scenarios. |
