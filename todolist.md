# Fantasy Leagues MVP — Todo List

Source: `Fantasy Leagues.md`  
Goal: deliver the full MVP workflow from admin setup to public match results.

## Phase 1 — Project Initialization
- [ ] Initialize Next.js project with TypeScript and Tailwind CSS
- [ ] Set up base UI components structure (`components/ui`)
- [ ] Configure Prisma in the project
- [ ] Configure SQLite for local development
- [ ] Create `.env.example` with required variables
- [ ] Create baseline folder structure (`app`, `components`, `lib`, `prisma`, `types`)
- [ ] Create/update `README` with local setup and run steps
- [ ] Verify app starts successfully with `npm run dev`

## Phase 2 — Database
- [ ] Implement Prisma models: `Tournament`, `Group`, `GroupMember`, `Round`, `Match`, `MatchMemberScore`
- [ ] Define all required relations and constraints
- [ ] Create and run Prisma migrations
- [ ] Implement a shared Prisma client (`lib/db.ts`)
- [ ] Create development seed data
- [ ] Verify seed flow and relational queries work

## Phase 3 — Admin Authentication
- [ ] Create admin login route/page (`/admin/login`)
- [ ] Create protected admin dashboard route (`/admin`)
- [ ] Implement login action for single admin account
- [ ] Implement logout action
- [ ] Add session handling and admin route guard
- [ ] Ensure public routes remain accessible without auth
- [ ] Verify unauthenticated users are blocked from admin pages

## Phase 4 — FPL Integration
- [ ] Create FPL service module (`lib/fpl.ts`)
- [ ] Implement `getManager(entryId)`
- [ ] Implement `getManagerLeagues(entryId)`
- [ ] Implement `getLeague(leagueId)`
- [ ] Implement `getLeagueMembers(leagueId)`
- [ ] Add failure handling for invalid IDs and API downtime
- [ ] Build admin UI for Entry ID verification and league display
- [ ] Add minimal caching/persistence to avoid repeated FPL calls

## Phase 5 — Tournament Creation
- [ ] Create admin flow to create tournaments
- [ ] Implement edit tournament flow
- [ ] Implement delete tournament flow
- [ ] Support fields: `name`, `season`, `adminFplId`, `status`
- [ ] Verify admin FPL ID before saving
- [ ] Persist tournaments and list them in dashboard

## Phase 6 — Group Import
- [ ] Build group selection UI from available FPL leagues
- [ ] Validate admin is a member of selected league before import
- [ ] Import league members into tournament group members
- [ ] Mark and persist the admin member identity
- [ ] Allow tournament group renaming
- [ ] Preserve imported membership snapshot for consistency

## Phase 7 — Schedule Builder
- [ ] Implement round creation for a tournament
- [ ] Assign one gameweek per round
- [ ] Implement match creation inside rounds
- [ ] Support group-vs-group matches
- [ ] Support winner-reference participants for future rounds
- [ ] Add schedule validation to reject invalid references/configurations

## Phase 8 — Scoring Engine
- [ ] Create scoring service module (`lib/scoring.ts`)
- [ ] Implement `calculateGroupScore()`
- [ ] Implement `calculateMatchScore()`
- [ ] Implement `determineMatchResult()` (winner/draw)
- [ ] Implement per-member score breakdown persistence
- [ ] Enforce admin exclusion rule in every score calculation
- [ ] Implement recalculation logic for non-final matches
- [ ] Implement finalized-result preservation behavior
- [ ] Validate with provided Real Madrid vs Napoli draw scenario

## Phase 9 — Public Tournament Experience
- [ ] Build homepage (`/`) with tournament entry points
- [ ] Build tournaments listing page (`/tournaments`)
- [ ] Build public tournament details page (`/tournaments/[id]`)
- [ ] Build public match details page (`/matches/[id]`)
- [ ] Display rounds, matches, scores, and result statuses
- [ ] Display bracket progression for published tournaments
- [ ] Show clear match score breakdown per member
- [ ] Hide draft/unpublished tournaments from public pages

## Phase 10 — Publishing & Finalization
- [ ] Implement publish tournament action
- [ ] Implement unpublish tournament action
- [ ] Implement finalize match action
- [ ] Prevent draft tournaments from public visibility
- [ ] Preserve finalized snapshots against future FPL changes
- [ ] Validate lifecycle transitions: `DRAFT` → `PUBLISHED` → `FINISHED`

## Phase 11 — UI/UX Polish
- [ ] Improve responsive layout (mobile-first)
- [ ] Add loading states for async operations
- [ ] Add empty states for no-data screens
- [ ] Add explicit error states/messages
- [ ] Refine spacing, typography, and visual hierarchy
- [ ] Polish match cards and bracket readability
- [ ] Improve admin flow usability and clarity

## Phase 12 — Production Deployment
- [ ] Prepare production environment variables
- [ ] Configure production database target (Turso)
- [ ] Configure secure authentication secrets
- [ ] Configure production domain
- [ ] Deploy application (GitHub → Vercel)
- [ ] Validate production app end-to-end workflow

## Cross-Cutting API & Quality Tasks
- [ ] Implement public API routes for tournaments, rounds, matches, and details
- [ ] Implement admin API routes for tournament management and publishing
- [ ] Implement FPL admin API routes for verification/import operations
- [ ] Add consistent input validation for all admin actions
- [ ] Add secure authorization checks on all admin-only endpoints
- [ ] Add robust error messages for known scenarios (invalid FPL ID, API unavailable, missing GW, invalid match)
- [ ] Verify full Definition of Done workflow from admin login to public result display
