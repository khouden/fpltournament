# Page 03: Public Tournament Detail & Standings

> **Route:** `/tournaments/[id]`  
> **Source File:** `app/tournaments/[id]/page.tsx`  
> **Access Level:** Public (Unauthenticated, Drafts blocked via 404)  
> **Design Theme:** Dark Cosmic Glassmorphism (`slate-900 via-indigo-950 to-slate-900`)  

---

## 1. Page Overview

The **Tournament Detail & Standings Page** is the premier public dashboard for an individual tournament. It delivers a comprehensive, real-time spectator experience that unites:
1. **Live Head-to-Head League Standings:** A full football league table calculating wins (+3 PTS), draws (+1 PT), losses (0 PTS), Points For (PF), Points Against (PA), Points Difference (+/-), and recent form.
2. **Gameweek Fixtures & Results:** Interactive match cards grouped by Gameweek round, displaying live/final scores, winner highlights, and compact squad player point breakdowns.
3. **Participating Teams Directory:** An overview of all competing groups, custom club logos, and active player counts.
4. **Interactive Squad Pitch Inspection:** Instant modal trigger to inspect any player's exact 15-man fantasy lineup, chips, and captaincy multipliers.

### SEO & Metadata
- **Dynamic Title:** `{tournament.name} — League Standings & Fixtures`
- **Dynamic Description:** `View live standings, gameweek fixtures, and head-to-head match results for {tournament.name}.`

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STICKY NAVBAR: [Trophy] FPL LEAGUES                      [<- All Leagues]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT HERO:                                                            │
│   H1: Premier League Fantasy Cup 2024                                       │
│   [Season 2024] [ACTIVE LEAGUE] [Bench Boost: On] [Triple Captain: On (3x)] │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 1: LIVE LEAGUE STANDINGS TABLE                                      │
│   [Trophy] League Standings                                                 │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ # | Team / League        | MP | W | D | L | PF  | PA  | +/- | PTS|Form│ │
│   │ 1 | 🛡️ London Gunners    |  3 | 3 | 0 | 0 | 215 | 160 | +55 |  9 |WWW │ │
│   │ 2 | 🛡️ Red Devils FC     |  3 | 2 | 0 | 1 | 198 | 185 | +13 |  6 |WWL │ │
│   │ 3 | 🛡️ Cityzen Blues     |  3 | 1 | 1 | 1 | 190 | 190 |   0 |  4 |WDL │ │
│   │ 4 | 🛡️ Merseyside Reds   |  3 | 0 | 1 | 2 | 170 | 210 | -40 |  1 |DLL │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 2: FIXTURES & RESULTS BY GAMEWEEK                                   │
│   [Calendar] Fixtures & Results                      3 Gameweek Rounds      │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ Round 1 · Gameweek 1                                   [COMPLETED]    │ │
│   │ Match 1                                                               │ │
│   │   London Gunners (+3 PTS)   [ 72 - 58 ]    Merseyside Reds (0 PTS)    │ │
│   │   [Squad Points Breakdown]                 [Squad Points Breakdown]   │ │
│   │   • Manager A: 28 pts ✨                    • Manager X: 22 pts        │ │
│   │   • Manager B: 24 pts                      • Manager Y: 18 pts        │ │
│   │   • Admin (Excluded): ~~15~~               • Admin (Excluded): ~~12~~ │ │
│   │   View Match & Player Breakdown ->                                    │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 3: PARTICIPATING TEAMS                                              │
│   [Users] Participating Teams (4)                                           │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│   │ [Logo]       │ │ [Logo]       │ │ [Logo]       │ │ [Logo]       │        │
│   │ London Gunner│ │ Red Devils FC│ │ Cityzen Blues│ │ Merseyside R│        │
│   │ 10 players   │ │ 10 players   │ │ 10 players   │ │ 10 players   │        │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep Component Specifications

### 3.1 Tournament Meta Header
- **Title (H1):** `text-4xl font-black text-white tracking-tight`
- **Metadata Badges:**
  - **Season:** `Season {tournament.season}` text pill.
  - **Status Badge:** Green `ACTIVE LEAGUE` or Subdued `FINISHED`.
  - **Bench Boost Badge:** Contains `Armchair` icon, dynamically reads `Bench Boost: On` or `Bench Boost: Off`.
  - **Triple Captain Badge:** Contains `Crown` icon, dynamically reads `Triple Captain: On (3x)` or `Triple Captain: Reduced (2x)`.

### 3.2 Live League Standings Table (`LeagueTable`)
- **Container:** Dark glassmorphic card with rounded borders: `bg-black/40 border-white/10 shadow-xl backdrop-blur`.
- **Columns:**
  1. `#` (Rank): Circle badge with rank number. 1st place gets gold `bg-amber-400 text-slate-950 shadow-sm`, 2nd place gets silver `bg-slate-300`, 3rd gets bronze `bg-amber-700`.
  2. `Team / League`: Team logo (or 2-letter fallback) + Team name. Leader gets a crown icon indicator.
  3. `MP` (Matches Played)
  4. `W` (Wins: +3 League Points)
  5. `D` (Draws: +1 League Point)
  6. `L` (Losses: 0 League Points)
  7. `PF` (Points For: Total FPL Gameweek points scored across all matches)
  8. `PA` (Points Against: Total FPL points conceded)
  9. `+/-` (Points Difference: `PF - PA`, formatted in emerald green if positive, red if negative)
  10. `PTS` (Total Points: `W * 3 + D * 1`, styled in bold monospace indigo `text-indigo-300 font-extrabold`)
  11. `Form` (Last 5 matches): Micro-badges (Green `W`, Yellow `D`, Red `L`).

### 3.3 Fixtures & Gameweek Rounds
- **Round Grouping:** Every round corresponds to a specific FPL Gameweek and is wrapped in an individual card with a `Gameweek {round.gameweek}` badge.
- **Match Card Structure:**
  - **Meta Header:** Match number, Gameweek number, and status badge (`FINALIZED`, `COMPLETED`, `SCHEDULED`).
  - **Scoreboard Display:**
    - Home team on the left, Away team on the right.
    - Winner gets an emerald `+3 PTS` badge; in case of a draw, both teams receive an amber `+1 PT` badge.
    - Large center scoreboard: `{homeScore} - {awayScore}` in `font-mono text-2xl sm:text-3xl font-black text-white`.
    - Outcome banner: Displays `{Team Name} WIN` or `MATCH DRAW`.
  - **Compact Squad Player Breakdown (`MatchSquadList`):**
    - Directly visible inside the match card without needing to navigate away!
    - Lists all members of both competing leagues side-by-side.
    - Displays member name, FPL team name, active chip badges (`BB`, `3XC`), and chip deduction notes (`-X`).
    - Top scorer in each team gets a gold sparkle icon (`Sparkles`).
    - **Admin Exclusion Display:** The tournament organizer is listed with a `Shield` icon, yellow warning text, and strikethrough points (`line-through opacity-75`), visually confirming their score was not counted toward the team total.
    - **Squad Modal Trigger:** Clicking any player row opens the full `<FantasyTeamModal />` overlay for that player!

### 3.4 Participating Teams Grid
- Displays all participating FPL Classic Leagues.
- Shows team logo or generated monogram.
- Shows clean count of active non-admin fantasy players (`{count} active players`).

---

## 4. Technical Logic & Business Rules

### 4.1 Server-Side Data Query
```typescript
const tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    admins: true,
    groups: {
      include: { members: true },
      orderBy: { name: "asc" },
    },
    rounds: {
      include: {
        matches: {
          include: {
            homeGroup: true,
            awayGroup: true,
            scores: {
              include: { member: true },
              orderBy: [{ isExcluded: "asc" }, { gameweekPoints: "desc" }],
            },
          },
          orderBy: { matchNumber: "asc" },
        },
      },
      orderBy: { roundNumber: "asc" },
    },
  },
});
```

### 4.2 League Standings Calculation (`calculateLeagueStandings`)
Standings are calculated programmatically from all completed and finalized matches:
- Win = +3 PTS
- Draw = +1 PT
- Loss = 0 PTS
- Sorting hierarchy: Total Points (`PTS`) descending -> Points Difference (`+/-`) descending -> Points For (`PF`) descending -> Head-to-Head result.

### 4.3 Draft Guard
```typescript
if (!tournament || tournament.status === "DRAFT") {
  notFound();
}
```
If an unauthenticated visitor attempts to navigate to a draft tournament URL, Next.js triggers `notFound()`, rendering a 404 page to prevent leaking unpublished tournament setups.

---

## 5. Responsive Behavior

| Breakpoint | Layout Adaptations |
| :--- | :--- |
| **Mobile (< 640px)** | League table allows horizontal swipe scroll (`overflow-x-auto`). Scoreboard stacks team names above scores. Compact squad breakdown stacks home and away squads vertically. Participating teams grid switches to 2 columns. |
| **Tablet (640px - 1024px)** | Standings table displays all columns except Form. Scoreboard displays horizontal layout. Squad breakdown displays side-by-side (2 columns). |
| **Desktop (> 1024px)** | Full table display with Form pills. Participating teams grid expands to 4 columns (`lg:grid-cols-4`). Hover transitions active on match cards. |

---

## 6. Edge Cases & Resilience

1. **Uncalculated Matches (Future Gameweeks):**
   - Renders a clean "VS" banner with team logos, without breaking or displaying zero-scores before gameweeks start.
2. **Missing Group Logo:**
   - Automatically renders a stylish indigo monogram with the team's first two initials (`group.name.slice(0, 2).toUpperCase()`).
3. **Multi-Admin League Ownership:**
   - Any manager belonging to the tournament's admin list (`tournament.admins`) is excluded across every group they appear in.
