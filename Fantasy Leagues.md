
# FPL Tournament MVP — Project Context & Specification

## 1. Project Overview

### Project Name

FPL Tournament

### Project Type

Mobile-first web application / PWA.

### Purpose

The application is designed to manage and publicly display custom tournaments between groups of Fantasy Premier League (FPL) managers.

Each tournament group is represented by a **Classic League on the official Fantasy Premier League website**.

The tournament organizer has an FPL account called the **Admin FPL account**. The Admin is a member of every participating FPL league and exists only to allow the organizer to access/manage all groups.

The Admin's FPL points must NEVER be included in tournament scores.

The application automatically retrieves the participating groups and their FPL Gameweek points, calculates each group's score, determines match results, and displays the tournament schedule and results publicly.

---

# 2. MVP Goal

The MVP should provide one simple workflow:

1. The application owner logs into the admin panel.
2. The owner creates a tournament.
3. The owner enters the Admin's FPL Entry ID.
4. The system verifies the Admin.
5. The system retrieves the FPL leagues associated with that Admin.
6. The owner selects the leagues/groups participating in the tournament.
7. The owner configures the complete tournament schedule.
8. Each round is associated with a specific FPL Gameweek.
9. The application retrieves FPL points for the group members.
10. The Admin is automatically excluded from the calculation.
11. The application calculates every match result.
12. The public website displays the tournament, rounds, matches, scores, and results.

The MVP should be intentionally simple.

---

# 3. MVP Scope

## Included

- Single application administrator
- Admin authentication
- Tournament creation
- Tournament editing
- Tournament deletion
- FPL Admin Entry ID configuration
- FPL Admin verification
- Retrieval of Admin's FPL Classic Leagues
- Selection of participating FPL leagues
- Group/member verification
- Tournament round creation
- Gameweek assignment to rounds
- Match scheduling
- Automatic FPL score retrieval
- Automatic Admin exclusion
- Automatic group score calculation
- Automatic match result calculation
- Draw detection
- Winner detection
- Tournament bracket / schedule display
- Public tournament pages
- Public match results
- Match score breakdown
- Basic result refresh/recalculation
- Tournament publishing
- Tournament status
- Responsive/mobile-first UI

## NOT included in MVP

Do NOT implement these unless explicitly requested later:

- User registration
- Participant accounts
- Participant dashboards
- Multiple tournament administrators
- User invitations
- Notifications
- Email system
- Chat
- Social features
- Payments
- Subscriptions
- Advanced FPL statistics
- Player price predictions
- Effective ownership
- Captain analysis
- Fantasy team analysis
- Live bonus calculation
- Advanced live scoring
- Complex tournament formats
- Round-robin tournaments
- Group stages
- Automatic tournament generation
- Mobile native applications
- Chrome extension
- Redis
- Separate NestJS backend
- Microservices
- Complex event-driven architecture

The MVP should remain small and reliable.

---

# 4. User Roles

There are only two roles.

## 4.1 Application Administrator

There is only ONE administrator in the MVP.

The administrator is the owner/operator of the application.

The administrator can:

- Log in
- Create tournaments
- Edit tournaments
- Delete tournaments
- Configure FPL integration
- Select groups
- Configure rounds
- Configure matches
- Publish tournaments
- Recalculate results

## 4.2 Public Visitor

A visitor does not need an account.

Visitors can:

- View published tournaments
- Open a tournament
- View participating groups
- View rounds
- View matches
- View scores
- View results
- View match details
- View tournament progression

---

# 5. Important Terminology

## FPL Entry ID

The unique ID of a Fantasy Premier League manager/team.

Example:

```text
1234567
````

This identifies the Admin or another FPL manager.

## Admin FPL ID

The FPL Entry ID configured for the tournament administrator.

Example:

```
1234567
```

The Admin can belong to all tournament groups.

The Admin's points must always be excluded from tournament scoring.

## FPL Classic League

A Classic League on the official Fantasy Premier League website.

In this application, an FPL Classic League represents a tournament group.

Example:

```
Real Madrid
Napoli
Barcelona
Liverpool
```

## Tournament Group

An FPL Classic League selected for a tournament.

## Gameweek

The FPL Gameweek used to calculate a tournament round.

Example:

```
Round 1 → Gameweek 5
Round 2 → Gameweek 6
Final   → Gameweek 7
```

## Match

A competition between two tournament groups.

Example:

```
Real Madrid vs Napoli
```

---

# 6. Core Business Rule

This is the most important rule in the entire application.

For every match:

```
Group Score =
Sum of Gameweek points of all group members
EXCEPT the Admin
```

Example:

```
Real Madrid

Ali       50
Mohamed   50
Admin     40
Zaid      30
Baha      30
```

Admin is excluded:

```
50 + 50 + 30 + 30 = 160
```

Therefore:

```
Real Madrid = 160
```

Another group:

```
Napoli

Othman    80
Said      50
Admin     40
Omar      20
Samir     10
```

Admin is excluded:

```
80 + 50 + 20 + 10 = 160
```

Result:

```
Real Madrid 160 - 160 Napoli
```

Result:

```
DRAW
```

---

# 7. Admin Exclusion Rule

The Admin must be identified using the FPL Entry ID.

Example:

```
Tournament Admin FPL ID:
1234567
```

A group contains:

```
Ali       111111
Mohamed   222222
Admin     1234567
Zaid      333333
Baha      444444
```

The calculation must exclude:

```
1234567
```

The calculation must NOT depend only on the manager's displayed name.

Correct:

```
member.fplEntryId !== tournament.adminFplId
```

Incorrect:

```
member.name !== "Admin"
```

This prevents problems if the Admin's FPL team name changes.

---

# 8. Match Result Rules

For each match:

```
homeScore > awayScore
```

Result:

```
HOME_WIN
```

If:

```
awayScore > homeScore
```

Result:

```
AWAY_WIN
```

If:

```
homeScore === awayScore
```

Result:

```
DRAW
```

For the MVP, a draw remains a draw.

Do not invent penalty shootouts, tie-breakers, extra Gameweeks, etc.

---

# 9. Tournament Format

The MVP focuses on a manually configured tournament schedule.

The administrator decides:

- Number of rounds
- Round names
- Gameweek for each round
- Matches
- Match participants

The application should support knockout-style progression.

Example:

```
Round 1

Match 1:
Real Madrid vs Napoli

Match 2:
Barcelona vs Liverpool


Round 2

Match 3:
Winner Match 1 vs Winner Match 2


Final

Winner Match 3 vs Winner Match 4
```

The administrator should configure the structure.

The application determines future participants automatically from previous match winners.

---

# 10. Tournament Lifecycle

A tournament has three main states.

## DRAFT

The tournament is being configured.

Only the administrator can access it.

## PUBLISHED

The tournament is visible publicly.

Visitors can access it.

## FINISHED

The tournament is completed.

The tournament remains publicly accessible.

Historical results should remain available.

---

# 11. Public User Flow

## Home

Visitor opens the website.

The homepage displays published tournaments.

Example:

```
FPL TOURNAMENTS

2026 FPL Champions League

8 Groups
Currently active

[ View Tournament ]


2026 FPL Cup

Finished

[ View Tournament ]
```

---

# 12. Public Tournament Page

The main public tournament page should display:

- Tournament name
- Season
- Current round
- Tournament status
- Participating groups
- Rounds
- Matches
- Scores
- Winners
- Bracket/progression

Example:

```
FPL CHAMPIONS LEAGUE

2026/27

ROUND 1
Gameweek 5

Real Madrid    160 - 160    Napoli
                         DRAW

Barcelona      172 - 143    Liverpool
                         BARCELONA


ROUND 2
Gameweek 6

Real Madrid       VS       Barcelona
```

---

# 13. Public Match Details

Clicking a match opens the match details page.

Example:

```
ROUND 1 · GAMEWEEK 5

REAL MADRID

160

VS

160

NAPOLI

DRAW
```

Then show the calculation breakdown.

## Real Madrid

```
Ali                 50
Mohamed             50
Zaid                30
Baha                30
-----------------------
TOTAL              160
```

## Napoli

```
Othman              80
Said                50
Omar                20
Samir               10
-----------------------
TOTAL              160
```

Then explicitly show:

```
ADMIN

Admin                40

Excluded from tournament score
```

The Admin should be visually separated from the included members.

---

# 14. Admin Flow

## Admin Login

The administrator opens:

```
/admin/login
```

The page contains:

```
Admin Login

Email
[________________]

Password
[________________]

[ Login ]
```

There is no public registration.

There is only one administrator.

---

# 15. Admin Dashboard

After login:

```
ADMIN DASHBOARD

Tournaments

--------------------------------

FPL Champions League
8 groups
3 rounds
PUBLISHED

[ Manage ]

--------------------------------

FPL Cup
8 groups
3 rounds
DRAFT

[ Manage ]

--------------------------------

[ + Create Tournament ]
```

---

# 16. Create Tournament Flow

## Step 1 — Basic Information

Fields:

```
Tournament Name
Season
Admin FPL Entry ID
```

Example:

```
Tournament Name:
FPL Champions League

Season:
2026/27

Admin FPL Entry ID:
1234567
```

Button:

```
[ Verify Admin ]
```

---

# 17. Admin Verification

The system calls the FPL manager endpoint.

If valid:

```
✓ FPL Admin verified

Manager:
Ahmed Ali

FPL Team:
My Team

Entry ID:
1234567
```

If invalid:

```
Unable to find an FPL manager with this ID.
Please verify the Entry ID.
```

The tournament cannot continue until the Admin ID is valid.

---

# 18. Select Groups

After Admin verification, retrieve the Admin's available Classic Leagues.

Display:

```
SELECT TOURNAMENT GROUPS

☐ Real Madrid
   5 members

☐ Napoli
   5 members

☐ Barcelona
   5 members

☐ Liverpool
   5 members
```

The administrator selects the leagues participating in the tournament.

---

# 19. Group Verification

When a group is selected, verify:

1. The league exists.
2. The Admin belongs to the league.
3. The league members can be retrieved.
4. The member list is available.

Display:

```
Real Madrid

✓ League found
✓ Admin is a member
✓ 5 members retrieved

Members:

Ali
Mohamed
Admin
Zaid
Baha
```

The Admin should be clearly marked:

```
Admin
EXCLUDED FROM SCORING
```

---

# 20. Group Configuration

The administrator can optionally rename the tournament group.

Example:

FPL League name:

```
Real Madrid FC Official
```

Tournament display name:

```
Real Madrid
```

The original FPL league ID must still be stored.

---

# 21. Tournament Schedule Configuration

After groups are selected, the administrator configures all rounds.

Example:

```
TOURNAMENT SCHEDULE

ROUND 1
Gameweek 5

Real Madrid
VS
Napoli

Barcelona
VS
Liverpool


ROUND 2
Gameweek 6

Winner Match 1
VS
Winner Match 2


FINAL
Gameweek 7

Winner Match 3
VS
Winner Match 4
```

The administrator can:

- Add rounds
- Remove rounds
- Rename rounds
- Set Gameweek
- Add matches
- Edit matches
- Delete matches

---

# 22. Match Configuration

For an initial match:

```
Match 1

Home:
[ Real Madrid ]

Away:
[ Napoli ]
```

For a future knockout match:

```
Match 3

Home:
[ Winner of Match 1 ]

Away:
[ Winner of Match 2 ]
```

The system should automatically replace the winner references once the previous matches are completed.

---

# 23. Schedule Validation

Before publishing a tournament, validate:

- At least one group exists.
- Each group has an FPL league ID.
- Admin belongs to every group.
- Each round has a Gameweek.
- Each match has two valid participants.
- A match cannot contain the same group on both sides.
- A group should not appear twice in the same round unless explicitly allowed.
- Future matches can reference previous match winners.
- There are no broken references.
- All required groups exist.

If validation fails:

```
Cannot publish tournament.

3 problems found:

• Match 3 has no away participant.
• Admin is not a member of Barcelona.
• Round 2 has no Gameweek assigned.
```

---

# 24. Publishing

Before publishing:

```
[ Publish Tournament ]
```

Show confirmation:

```
Publish tournament?

After publishing, the tournament will become
visible to all visitors.

[ Cancel ]
[ Publish ]
```

---

# 25. FPL API Integration

The application should use the official Fantasy Premier League API.

The application should create a dedicated FPL service.

Do not put FPL API calls directly into UI components.

Recommended architecture:

```
Next.js Page
     ↓
Server Route / Server Action
     ↓
FPL Service
     ↓
FPL API
```

---

# 26. FPL Endpoints

The application will primarily need the following FPL endpoints.

## Manager

```
GET /api/entry/{entryId}/
```

Purpose:

- Verify Admin
- Retrieve manager information
- Retrieve Classic League information

---

## Classic League Standings

```
GET /api/leagues-classic/{leagueId}/standings/
```

Purpose:

- Retrieve league members
- Retrieve FPL Entry IDs
- Retrieve member standings/points

Large leagues may require pagination.

---

## Manager History

```
GET /api/entry/{entryId}/history/
```

Purpose:

- Retrieve historical Gameweek information
- Useful for completed Gameweeks

---

## Manager Gameweek Picks

```
GET /api/entry/{entryId}/event/{gameweek}/picks/
```

Purpose:

- Retrieve manager's Gameweek squad
- Useful if exact Gameweek calculation is required

---

## Live Gameweek

```
GET /api/event/{gameweek}/live/
```

Purpose:

- Retrieve current Gameweek player statistics and points

---

## Bootstrap

```
GET /api/bootstrap-static/
```

Purpose:

- Retrieve general FPL data
- Determine Gameweek information
- Determine current Gameweek status
- Retrieve players and teams

---

# 27. FPL Data Strategy

The application should separate:

## External FPL data

Data retrieved from FPL.

## Internal tournament data

Data stored by our application.

Do not duplicate the entire FPL database.

Only store the FPL information necessary for the tournament.

---

# 28. Required Internal FPL Data

Store:

```
FPL Entry ID
Manager name
FPL team name
FPL league ID
Last synchronization timestamp
```

Group membership should be stored as a snapshot/reference so tournament history remains stable.

---

# 29. Score Calculation

Create a dedicated scoring service.

Example:

```
calculateMatchScore(matchId, gameweek)
```

Process:

```
1. Load match.
2. Load home group.
3. Load away group.
4. Load group members.
5. Retrieve Gameweek points.
6. Identify Admin using tournament.adminFplId.
7. Exclude Admin.
8. Sum remaining members.
9. Compare scores.
10. Determine result.
11. Save result.
12. Return result.
```

---

# 30. Calculation Pseudocode

```
function calculateGroupScore(group, adminFplId, gameweek):

    members = getGroupMembers(group)

    total = 0

    for member in members:

        if member.fplEntryId == adminFplId:
            continue

        points = getGameweekPoints(
            member.fplEntryId,
            gameweek
        )

        total += points

    return total
```

Then:

```
homeScore =
    calculateGroupScore(
        homeGroup,
        tournament.adminFplId,
        round.gameweek
    )

awayScore =
    calculateGroupScore(
        awayGroup,
        tournament.adminFplId,
        round.gameweek
    )
```

Determine result:

```
if homeScore > awayScore:
    result = HOME_WIN

else if awayScore > homeScore:
    result = AWAY_WIN

else:
    result = DRAW
```

---

# 31. Score Snapshot

The system should store the calculation result.

Do not only store:

```
160 - 160
```

Also store the individual members used in the calculation.

Example:

```
Real Madrid

Ali       50    INCLUDED
Mohamed   50    INCLUDED
Admin     40    EXCLUDED
Zaid      30    INCLUDED
Baha      30    INCLUDED
```

This allows users to understand how the result was calculated.

---

# 32. Result Status

For MVP, use:

```
PENDING
CALCULATED
FINAL
```

## PENDING

The match has not been calculated.

## CALCULATED

The application has retrieved the FPL data and calculated the score.

## FINAL

The administrator has confirmed/finalized the result.

Do not build complicated live scoring logic in the first version.

---

# 33. Recalculation

The administrator can manually recalculate a match.

Example:

```
[ Recalculate Result ]
```

The system retrieves the latest available FPL data and updates the calculation.

Before finalization, recalculation is allowed.

After finalization, the administrator should explicitly confirm if they want to recalculate.

---

# 34. Automatic Winner Progression

For knockout matches:

```
Match 1:
Real Madrid 160
Napoli 145

Winner = Real Madrid
```

If Match 3 is:

```
Winner Match 1
VS
Winner Match 2
```

then the application resolves the reference:

```
Real Madrid
VS
Winner Match 2
```

Once both previous matches have winners:

```
Real Madrid
VS
Barcelona
```

The public page should display the resolved participants.

---

# 35. Database

Use Prisma ORM.

Development database:

```
SQLite
```

Production database:

```
Turso
```

Turso should be used as the hosted SQLite-compatible database for Vercel production deployment.

---

# 36. Database Schema

## Tournament

```
Tournament
--------------------------------
id
name
season
adminFplId
status
createdAt
updatedAt
```

---

## Group

```
Group
--------------------------------
id
tournamentId
name
fplLeagueId
createdAt
updatedAt
```

---

## GroupMember

```
GroupMember
--------------------------------
id
groupId
fplEntryId
displayName
isAdmin
createdAt
updatedAt
```

`isAdmin` is useful for display, but score calculation must always compare:

```
member.fplEntryId
```

with:

```
tournament.adminFplId
```

---

## Round

```
Round
--------------------------------
id
tournamentId
name
roundNumber
gameweek
createdAt
updatedAt
```

---

## Match

```
Match
--------------------------------
id
roundId

homeGroupId
awayGroupId

homeSourceMatchId
awaySourceMatchId

homeScore
awayScore

winnerGroupId

result
status

calculatedAt
finalizedAt

createdAt
updatedAt
```

The source match fields are used for knockout references.

---

## MatchMemberScore

```
MatchMemberScore
--------------------------------
id
matchId
groupId
fplEntryId
displayName
points
included
createdAt
```

This stores the score breakdown used for the calculation.

---

# 37. Relationships

```
Tournament
    │
    ├── Groups
    │      │
    │      └── GroupMembers
    │
    └── Rounds
           │
           └── Matches
                  │
                  ├── Home Group
                  ├── Away Group
                  │
                  └── MatchMemberScores
```

---

# 38. API Routes

The MVP does not need a huge API.

## Public

```
GET /api/tournaments
```

Returns published tournaments.

```
GET /api/tournaments/:id
```

Returns public tournament details.

```
GET /api/tournaments/:id/rounds
```

Returns rounds and matches.

```
GET /api/matches/:id
```

Returns match details and score breakdown.

---

# 39. Admin API

```
POST /api/admin/tournaments
```

Create tournament.

```
GET /api/admin/tournaments
```

List all tournaments.

```
GET /api/admin/tournaments/:id
```

Get tournament management data.

```
PATCH /api/admin/tournaments/:id
```

Update tournament.

```
DELETE /api/admin/tournaments/:id
```

Delete tournament.

---

# 40. FPL Admin API

```
GET /api/admin/fpl/manager/:entryId
```

Verify/retrieve FPL manager.

```
GET /api/admin/fpl/manager/:entryId/leagues
```

Retrieve manager's leagues.

```
GET /api/admin/fpl/league/:leagueId
```

Retrieve league members.

---

# 41. Group API

```
POST /api/admin/tournaments/:id/groups
```

Add/import group.

```
PATCH /api/admin/groups/:id
```

Edit group.

```
DELETE /api/admin/groups/:id
```

Remove group.

---

# 42. Round API

```
POST /api/admin/tournaments/:id/rounds
```

Create round.

```
PATCH /api/admin/rounds/:id
```

Edit round.

```
DELETE /api/admin/rounds/:id
```

Delete round.

---

# 43. Match API

```
POST /api/admin/rounds/:id/matches
```

Create match.

```
PATCH /api/admin/matches/:id
```

Edit match.

```
DELETE /api/admin/matches/:id
```

Delete match.

```
POST /api/admin/matches/:id/recalculate
```

Recalculate match.

```
POST /api/admin/matches/:id/finalize
```

Finalize result.

---

# 44. Publishing API

```
POST /api/admin/tournaments/:id/publish
```

Publish tournament.

```
POST /api/admin/tournaments/:id/unpublish
```

Return tournament to draft.

---

# 45. Frontend Routes

## Public

```
/
```

Homepage.

```
/tournaments
```

Published tournament list.

```
/tournaments/[id]
```

Tournament page.

```
/matches/[id]
```

Match details.

---

## Admin

```
/admin/login
```

Admin login.

```
/admin
```

Admin dashboard.

```
/admin/tournaments/new
```

Create tournament.

```
/admin/tournaments/[id]
```

Tournament management.

```
/admin/tournaments/[id]/groups
```

Group configuration.

```
/admin/tournaments/[id]/schedule
```

Schedule configuration.

---

# 46. UI/UX Requirements

The application should be:

- Mobile-first
- Responsive
- Clean
- Modern
- Simple
- Fast
- Easy to understand
- Football/FPL-inspired without copying the official FPL UI

Avoid excessive dashboards and unnecessary information.

The public user should immediately understand:

```
Tournament
↓
Current Round
↓
Matches
↓
Scores
↓
Winner
```

---

# 47. Public Homepage

The homepage should prioritize active tournaments.

Suggested structure:

```
Header

FPL TOURNAMENTS

Short description

Active tournaments

Tournament cards

Finished tournaments

Footer
```

Tournament card:

```
FPL Champions League
2026/27

8 Groups
Round 2

[ View Tournament ]
```

---

# 48. Tournament Page Layout

Suggested:

```
Tournament Header
        ↓
Tournament Status
        ↓
Current Round
        ↓
Current Matches
        ↓
All Rounds
        ↓
Tournament Bracket
```

The most important content should appear first.

---

# 49. Match Card

Example:

```
┌─────────────────────────────┐
│ Round 1 · GW5               │
│                             │
│ Real Madrid    160          │
│ Napoli         160          │
│                             │
│ DRAW                        │
│                             │
│ View details →              │
└─────────────────────────────┘
```

For an ongoing/unresolved match:

```
Real Madrid
VS
Napoli

Result pending
```

---

# 50. Bracket

For knockout tournaments, show a simple bracket.

Example:

```
QUARTER FINALS

Real Madrid ─────┐
                 ├── Real Madrid ─────┐
Napoli ──────────┘                    │
                                      ├── FINAL
Barcelona ───────┐                    │
                 ├── Barcelona ───────┘
Liverpool ───────┘
```

The bracket should be responsive.

On mobile, it can become a vertical list.

---

# 51. Admin Schedule UI

The schedule editor should make it easy to understand.

Example:

```
ROUND 1
Gameweek 5

Match 1
[ Real Madrid ] VS [ Napoli ]

Match 2
[ Barcelona ] VS [ Liverpool ]

+ Add Match


ROUND 2
Gameweek 6

Match 3
[ Winner Match 1 ] VS [ Winner Match 2 ]

+ Add Match


+ Add Round
```

---

# 52. Error Handling

The application should display understandable errors.

Examples:

## Invalid FPL ID

```
This FPL Entry ID could not be found.
```

## FPL API unavailable

```
FPL data is temporarily unavailable.
Please try again later.
```

## Admin not in league

```
The configured Admin is not a member of this FPL league.
```

## Missing Gameweek

```
Please assign a Gameweek to this round.
```

## Invalid match

```
A match must have two different groups.
```

## No score available

```
FPL points are not currently available for this Gameweek.
```

---

# 53. Security

The application has only one administrator.

Admin routes must be protected.

Public users must never have access to:

```
/admin/*
```

or admin API mutations.

Only authenticated admin requests may:

- Create
- Edit
- Delete
- Publish
- Recalculate
- Finalize

Never expose admin credentials in client-side code.

Never expose database credentials.

Never expose private environment variables to the browser.

FPL API requests should preferably be made server-side.

---

# 54. Environment Variables

Example:

```
DATABASE_URL="..."
ADMIN_EMAIL="..."
ADMIN_PASSWORD_HASH="..."
NEXTAUTH_SECRET="..."
```

Use secure production secrets.

Do not commit `.env` files.

Provide:

```
.env.example
```

with placeholders.

---

# 55. Authentication

For the MVP, authentication can be extremely simple.

There is one admin account.

Recommended:

- Secure session-based authentication
- Password stored as a secure hash
- HTTP-only cookie
- Protected admin routes

Do not build registration.

Do not build password reset in MVP unless needed.

---

# 56. Next.js Architecture

Use a single Next.js application.

Recommended stack:

```
Next.js
React
TypeScript
Tailwind CSS
Prisma
SQLite
Turso
Vercel
```

Do NOT create a separate backend.

Next.js Route Handlers / Server Actions should provide the backend functionality.

---

# 57. Suggested Project Structure

```
src/

├── app/
│   ├── page.tsx
│   │
│   ├── tournaments/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── matches/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── admin/
│   │   ├── login/
│   │   ├── page.tsx
│   │   └── tournaments/
│   │       ├── new/
│   │       └── [id]/
│   │
│   └── api/
│       ├── tournaments/
│       ├── matches/
│       └── admin/
│
├── components/
│   ├── ui/
│   ├── tournament/
│   ├── match/
│   └── admin/
│
├── lib/
│   ├── db.ts
│   ├── fpl.ts
│   ├── scoring.ts
│   ├── tournament.ts
│   ├── auth.ts
│   └── validation.ts
│
├── prisma/
│   └── schema.prisma
│
└── types/
```

---

# 58. Database Access

Create a single database client.

Example conceptual architecture:

```
lib/db.ts
       ↓
Prisma
       ↓
Turso / SQLite
```

Do not create a new database connection for every request unnecessarily.

---

# 59. FPL Service Architecture

Create:

```
lib/fpl.ts
```

It should contain functions such as:

```
getManager(entryId)

getManagerLeagues(entryId)

getLeague(leagueId)

getLeagueMembers(leagueId)

getGameweekData(gameweek)

getManagerGameweekData(entryId, gameweek)
```

The rest of the application should use these functions rather than constructing FPL API URLs everywhere.

---

# 60. Scoring Service

Create:

```
lib/scoring.ts
```

Functions:

```
calculateGroupScore()

calculateMatchScore()

getMatchBreakdown()

determineMatchResult()
```

Keep all tournament scoring rules in this module.

---

# 61. Tournament Service

Create:

```
lib/tournament.ts
```

Responsibilities:

```
createTournament()

addGroup()

createRound()

createMatch()

resolveMatchParticipants()

getTournamentBracket()

publishTournament()

finalizeMatch()
```

---

# 62. Caching

The MVP does not need Redis.

However, FPL data should not be fetched unnecessarily.

At minimum:

- Cache or persist FPL league information.
- Cache manager information.
- Cache recently retrieved Gameweek data where appropriate.
- Avoid repeated API calls for the same request.

A simple database-based cache or Next.js/server caching can be used initially.

Do not add Redis unless actual traffic requires it.

---

# 63. FPL API Failure Strategy

If FPL is unavailable:

```
Do not destroy existing results.
```

Keep the last successfully calculated result.

Show:

```
Last updated:
21:32

FPL data temporarily unavailable.
```

The system should fail gracefully.

---

# 64. Data Consistency

Tournament group membership should be stored when the group is imported.

Do not automatically change tournament membership just because the FPL league later changes.

Example:

Tournament created:

```
Real Madrid

Ali
Mohamed
Admin
Zaid
Baha
```

Later someone joins the FPL league.

That person should not automatically become part of an already configured tournament unless the administrator explicitly synchronizes/updates the group.

This protects tournament integrity.

---

# 65. Historical Results

Once a match has been finalized, preserve its score breakdown.

Example:

```
Match Result

Real Madrid 160
Napoli 160

Calculated:
September 15, 2026

Finalized:
September 16, 2026
```

The public result should remain available even if later FPL data changes.

---

# 66. MVP Implementation Phases

The coding AI should implement the project in phases.

Do NOT attempt to build the entire application in one step.

---

## Phase 1 — Project Initialization

Tasks:

- Create Next.js project
- TypeScript
- Tailwind CSS
- Basic UI component setup
- Configure Prisma
- Configure SQLite
- Create `.env.example`
- Create project structure
- Create README
- Verify local development

Acceptance criteria:

```
npm run dev
```

works successfully.

---

# Phase 2 — Database

Implement Prisma schema:

```
Tournament
Group
GroupMember
Round
Match
MatchMemberScore
```

Create migrations.

Create seed data for development.

Acceptance criteria:

- Database works locally.
- Prisma client works.
- Relations work.
- Seed data can be loaded.

---

# Phase 3 — Admin Authentication

Implement:

```
/admin/login
/admin
```

Features:

- Login
- Logout
- Protected admin routes
- Secure session
- Single admin account

Acceptance criteria:

- Unauthenticated users cannot access admin pages.
- Public pages remain accessible.
- Admin can log in/out.

---

# Phase 4 — FPL Integration

Implement:

```
getManager()
getManagerLeagues()
getLeague()
getLeagueMembers()
```

Build Admin UI:

```
Enter FPL Entry ID
↓
Verify
↓
Display manager
↓
Display leagues
```

Acceptance criteria:

- Valid Admin ID works.
- Invalid ID displays an error.
- FPL leagues can be displayed.
- League members can be retrieved.

---

# Phase 5 — Tournament Creation

Implement:

```
Create tournament
Edit tournament
Delete tournament
```

Fields:

```
name
season
adminFplId
status
```

Acceptance criteria:

- Admin can create tournament.
- Admin ID is verified.
- Tournament is saved.
- Tournament appears in dashboard.

---

# Phase 6 — Group Import

Implement:

```
Select FPL league
↓
Verify Admin membership
↓
Retrieve members
↓
Create tournament group
```

Acceptance criteria:

- Groups can be imported.
- Admin membership is validated.
- Members are stored.
- Admin is clearly identified.
- Group can be renamed.

---

# Phase 7 — Schedule Builder

Implement:

```
Create round
Set Gameweek
Create match
Select groups
Create winner references
```

Acceptance criteria:

- Multiple rounds can be created.
- Each round has a Gameweek.
- Matches can be created.
- Future matches can reference previous winners.
- Invalid schedules are rejected.

---

# Phase 8 — Scoring Engine

Implement:

```
calculateGroupScore()
calculateMatchScore()
determineResult()
```

Test using:

```
Real Madrid:
50
50
40 Admin
30
30

Napoli:
80
50
40 Admin
20
10
```

Expected:

```
Real Madrid = 160
Napoli = 160

Result = DRAW
```

Acceptance criteria:

- Admin is excluded.
- Scores are correct.
- Draws are correctly detected.
- Winners are correctly detected.
- Individual score breakdown is stored.

---

# Phase 9 — Public Tournament

Implement:

```
/
 /tournaments
 /tournaments/[id]
 /matches/[id]
```

Features:

- Tournament cards
- Tournament overview
- Rounds
- Matches
- Scores
- Results
- Bracket
- Match breakdown

Acceptance criteria:

- Published tournaments are publicly visible.
- Draft tournaments are hidden.
- Match details are accessible.
- Score breakdown is understandable.

---

# Phase 10 — Publishing & Finalization

Implement:

```
Publish
Unpublish
Finalize match
```

Acceptance criteria:

- Draft tournaments aren't public.
- Published tournaments are public.
- Finalized results are preserved.
- Admin can manage tournament state.

---

# Phase 11 — UI/UX Polish

Improve:

- Responsive layout
- Mobile experience
- Loading states
- Empty states
- Error states
- Animations
- Typography
- Spacing
- Match cards
- Bracket
- Admin experience

Do not add new functionality during this phase unless necessary.

---

# Phase 12 — Production Deployment

Deploy:

```
GitHub
↓
Vercel
↓
Next.js
↓
Turso
```

Configure:

- Production environment variables
- Production database
- Authentication secrets
- Domain
- Error handling

Acceptance criteria:

- Production application works.
- Admin login works.
- Database persists.
- Public tournament pages work.
- FPL integration works.
- No secrets are exposed.

---

# 67. Development Rules for the Coding AI

The coding AI must follow these rules.

## Rule 1

Build incrementally.

Do not implement all features at once.

## Rule 2

After every phase:

1. Run the application.
2. Test the implemented functionality.
3. Fix errors.
4. Only then continue.

## Rule 3

Do not introduce unnecessary infrastructure.

The MVP should use:

```
Next.js
TypeScript
React
Tailwind
Prisma
SQLite/Turso
Vercel
```

Do not add:

```
NestJS
Redis
Docker
Kubernetes
Microservices
Separate backend
```

unless explicitly requested.

## Rule 4

Keep business logic separate from UI.

FPL logic belongs in:

```
lib/fpl.ts
```

Scoring belongs in:

```
lib/scoring.ts
```

Tournament logic belongs in:

```
lib/tournament.ts
```

## Rule 5

Do not hardcode tournament groups or scores.

Everything must come from the database/FPL API.

## Rule 6

Never include the Admin in tournament scoring.

Always compare:

```
member.fplEntryId
```

against:

```
tournament.adminFplId
```

## Rule 7

Do not invent FPL API behavior.

If an API endpoint behaves differently than expected, investigate and adapt the integration.

## Rule 8

Use server-side FPL API requests where possible.

Do not expose sensitive configuration.

---

# 68. Important MVP Assumptions

Unless explicitly changed, assume:

1. There is only one application administrator.
2. Visitors do not need accounts.
3. Every tournament has one Admin FPL Entry ID.
4. The Admin is a member of every tournament FPL league.
5. The Admin's points are excluded from every tournament match.
6. Each group corresponds to one FPL Classic League.
7. Each round corresponds to one FPL Gameweek.
8. Each match has two groups.
9. A higher score wins.
10. Equal scores produce a draw.
11. The administrator manually configures the tournament schedule.
12. Knockout progression can use previous match winners.
13. Published tournaments are public.
14. Draft tournaments are private.
15. Finalized results should be preserved.
16. The application is primarily a public tournament viewer with a private admin management panel.
17. No participant accounts are required.
18. No native mobile app is required.
19. No Chrome extension is required.

---

# 69. Example Complete Tournament

Tournament:

```
FPL Champions League
Season: 2026/27
Admin FPL ID: 1234567
```

Groups:

```
Real Madrid
Napoli
Barcelona
Liverpool
Milan
Arsenal
Chelsea
PSG
```

Round 1:

```
Gameweek 5

Real Madrid vs Napoli
Barcelona vs Liverpool
Milan vs Arsenal
Chelsea vs PSG
```

Round 2:

```
Gameweek 6

Winner Match 1 vs Winner Match 2
Winner Match 3 vs Winner Match 4
```

Final:

```
Gameweek 7

Winner Match 5 vs Winner Match 6
```

---

# 70. Example Match Calculation

Input:

```
Tournament Admin:
1234567
```

Real Madrid:

```
Ali       50
Mohamed   50
Admin     40
Zaid      30
Baha      30
```

Napoli:

```
Othman    80
Said      50
Admin     40
Omar      20
Samir     10
```

Calculation:

```
Real Madrid:

50 + 50 + 30 + 30
= 160
```

```
Napoli:

80 + 50 + 20 + 10
= 160
```

Result:

```
Real Madrid 160 - 160 Napoli

DRAW
```

Stored breakdown:

```
Real Madrid

Ali       50   INCLUDED
Mohamed   50   INCLUDED
Admin     40   EXCLUDED
Zaid      30   INCLUDED
Baha      30   INCLUDED


Napoli

Othman    80   INCLUDED
Said      50   INCLUDED
Admin     40   EXCLUDED
Omar      20   INCLUDED
Samir     10   INCLUDED
```

---

# 71. Definition of Done

The MVP is complete when the following workflow works from beginning to end:

```
Admin Login
    ↓
Create Tournament
    ↓
Enter Admin FPL ID
    ↓
Verify Admin
    ↓
Retrieve FPL Leagues
    ↓
Select Groups
    ↓
Verify Group Members
    ↓
Configure Rounds
    ↓
Assign Gameweeks
    ↓
Configure Matches
    ↓
Publish Tournament
    ↓
Public User Opens Tournament
    ↓
System Retrieves FPL Scores
    ↓
Admin Is Excluded
    ↓
Scores Are Calculated
    ↓
Winner/Draw Is Determined
    ↓
Public User Sees Result
    ↓
Match Breakdown Is Available
```

---

# 72. Final Product Vision

The final MVP should feel like a very simple tournament website.

The administrator does the configuration once.

Visitors simply open the website and follow the tournament.

The main value of the application is:

```
FPL LEAGUES
     ↓
AUTOMATIC SCORE CALCULATION
     ↓
ADMIN EXCLUDED
     ↓
MATCH RESULT
     ↓
TOURNAMENT PROGRESSION
     ↓
PUBLIC TOURNAMENT PAGE
```

The application should prioritize:

1. Correct FPL data
2. Correct Admin exclusion
3. Correct score calculation
4. Correct tournament progression
5. Simple administration
6. Clear public results
7. Mobile-first UX
8. Reliability

Do not add complexity until the core workflow is working correctly.

```

### Suggested filename

`PROJECT_CONTEXT.md`

You can give this file to the coding AI **before asking it to write any code**, and instruct it to start with **Phase 1 only**, then proceed phase-by-phase after testing each phase.
```