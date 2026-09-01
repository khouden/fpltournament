# Fantasy Leagues MVP — Todo List

Source: `Fantasy Leagues.md`  
Goal: deliver the full MVP workflow from admin setup to public match results.

## Phase 1 — Project Initialization
- [x] Initialize Next.js project with TypeScript and Tailwind CSS
- [x] Set up base UI components structure (`components/ui`)
- [x] Configure Prisma in the project
- [x] Configure SQLite for local development
- [x] Create `.env.example` with required variables
- [x] Create baseline folder structure (`app`, `components`, `lib`, `prisma`, `types`)
- [x] Create/update `README` with local setup and run steps
- [x] Verify app starts successfully with `npm run dev`

## Phase 2 — Database
- [x] Implement Prisma models: `Tournament`, `Group`, `GroupMember`, `Round`, `Match`, `MatchMemberScore`
- [x] Define all required relations and constraints
- [x] Create and run Prisma migrations
- [x] Implement a shared Prisma client (`lib/db.ts`)
- [x] Create development seed data
- [x] Verify seed flow and relational queries work

## Phase 3 — Admin Authentication
- [x] Create admin login route/page (`/admin/login`)
- [x] Create protected admin dashboard route (`/admin`)
- [x] Implement login action for single admin account
- [x] Implement logout action
- [x] Add session handling and admin route guard
- [x] Ensure public routes remain accessible without auth
- [x] Verify unauthenticated users are blocked from admin pages

## Phase 4 — FPL Integration
- [x] Create FPL service module (`lib/fpl.ts`)
- [x] Implement `getManager(entryId)`
- [x] Implement `getManagerLeagues(entryId)`
- [x] Implement `getLeague(leagueId)`
- [x] Implement `getLeagueMembers(leagueId)`
- [x] Add failure handling for invalid IDs and API downtime
- [x] Build admin UI for Entry ID verification and league display
- [x] Add minimal caching/persistence to avoid repeated FPL calls

## Phase 5 — Tournament Creation
- [x] Create admin flow to create tournaments
- [x] Implement edit tournament flow
- [x] Implement delete tournament flow
- [x] Support fields: `name`, `season`, `adminFplId`, `status`
- [x] Verify admin FPL ID before saving
- [x] Persist tournaments and list them in dashboard

## Phase 6 — Group Import
- [x] Build group selection UI from available FPL leagues
- [x] Validate admin is a member of selected league before import
- [x] Import league members into tournament group members
- [x] Mark and persist the admin member identity
- [x] Allow tournament group renaming
- [x] Preserve imported membership snapshot for consistency

## Phase 7 — Schedule Builder
- [x] Implement round creation for a tournament
- [x] Assign one gameweek per round
- [x] Implement match creation inside rounds
- [x] Support group-vs-group matches
- [x] Support winner-reference participants for future rounds
- [x] Add schedule validation to reject invalid references/configurations

## Phase 8 — Scoring Engine
- [x] Create scoring service module (`lib/scoring.ts`)
- [x] Implement `calculateGroupScore()`
- [x] Implement `calculateMatchScore()`
- [x] Implement `determineMatchResult()` (winner/draw)
- [x] Implement per-member score breakdown persistence
- [x] Enforce admin exclusion rule in every score calculation
- [x] Implement recalculation logic for non-final matches
- [x] Implement finalized-result preservation behavior
- [x] Validate with provided Real Madrid vs Napoli draw scenario

## Phase 9 — Public Tournament Experience
- [x] Build homepage (`/`) with tournament entry points
- [x] Build tournaments listing page (`/tournaments`)
- [x] Build public tournament details page (`/tournaments/[id]`)
- [x] Build public match details page (`/matches/[id]`)
- [x] Display rounds, matches, scores, and result statuses
- [x] Display bracket progression for published tournaments
- [x] Show clear match score breakdown per member
- [x] Hide draft/unpublished tournaments from public pages

## Phase 10 — Publishing & Finalization
- [x] Implement publish tournament action
- [x] Implement unpublish tournament action
- [x] Implement finalize match action
- [x] Prevent draft tournaments from public visibility
- [x] Preserve finalized snapshots against future FPL changes
- [x] Validate lifecycle transitions: `DRAFT` → `PUBLISHED` → `FINISHED`

## Phase 11 — UI/UX Polish
- [x] Improve responsive layout (mobile-first)
- [x] Add loading states for async operations
- [x] Add empty states for no-data screens
- [x] Add explicit error states/messages
- [x] Refine spacing, typography, and visual hierarchy
- [x] Polish match cards and bracket readability
- [x] Improve admin flow usability and clarity

## Phase 12 — Production Deployment
- [x] Prepare production environment variables
- [ ] Configure production database target (Turso / Neon / Supabase)
- [ ] Configure secure authentication secrets
- [ ] Configure production domain
- [ ] Deploy application (GitHub → Vercel)
- [x] Validate end-to-end workflow (verified in test suite & browser)

## Cross-Cutting API & Quality Tasks
- [x] Implement public API routes for tournaments, rounds, matches, and details
- [x] Implement admin API routes for tournament management and publishing
- [x] Implement FPL admin API routes for verification/import operations
- [x] Add consistent input validation for all admin actions
- [x] Add secure authorization checks on all admin-only endpoints
- [x] Add robust error messages for known scenarios (invalid FPL ID, API unavailable, missing GW, invalid match)
- [x] Verify full Definition of Done workflow from admin login to public result display

