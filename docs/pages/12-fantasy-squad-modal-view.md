# Page 12: Fantasy Squad Pitch & Team Logo Overlays

> **Components:** `components/fantasy-team-modal.tsx` & `components/team-logo-picker.tsx`  
> **Type:** Interactive Full-Screen Modal Dialogs  
> **Access Level:** Universal (Public Spectators, Participants, and Admins)  
> **Design Theme:** Immersive Pitch Emerald & Glassmorphic Stadium Dark  

---

## 1. Component Overview

While rendered as accessible modal dialogs rather than standalone URL routes, the **Fantasy Team Squad Modal** and **Team Logo Picker** are two of the most technically sophisticated and visually arresting views in the entire application.

- **`<FantasyTeamModal />`:** A full-featured tactical football pitch experience displaying a manager's 15-player FPL squad for any specific Gameweek. It illustrates starting formations (e.g. 3-4-3, 4-3-3, 5-3-2), live player points, captaincy multipliers, auto-substitutions, bench status, and chip penalties.
- **`<TeamLogoPicker />`:** An interactive club crest selector allowing organizers to search, filter by league (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), and auto-match team names to official football badges.

---

## 2. UI & Visual Architecture

### 2.1 The Pitch Surface (`FantasyTeamModal`)
- **Pitch Container:** Deep stadium gradient: `bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950`.
- **Field Markings:** Authentic white pitch lines:
  - Center half-way line and center circle (`border-white/20`).
  - Penalty area boxes (`border-white/15`).
  - Goal area arcs.
- **Player Cards:** Translucent badges (`bg-black/60 border border-white/15 backdrop-blur-sm rounded-lg`) featuring player club shirts, player names, position pills, captaincy crowns, and point badges.

### 2.2 Wireframe Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MODAL HEADER:                                                               │
│   [Club Crest] Highbury Heroes (Alex Morgan)            [↗ View on FPL] [X]│
│   Gameweek 28 · London Gunners · Total Squad Points: 78                     │
│   [⚡ Triple Captain: Active (+12 pts)]                                      │
│   TABS: [ ⚽ Pitch View ]   [ 📋 List View ]                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ PITCH VIEW CANVAS:                                                          │
│                                                                             │
│                            [ 🧤 Raya (ARS) 6pts ]                           │
│                                                                             │
│      [ Saliba 6 ]     [ Gabriel 8 ]     [ White 5 ]     [ Gvardiol 7 ]      │
│                                                                             │
│        [ Saka (C) 24pts 👑 ]     [ Palmer 12 ]     [ Foden 8 ]              │
│                                                                             │
│                 [ Haaland 14 ]         [ Watkins 8 ]                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ BENCH RESERVE BAR:                                                          │
│   BENCH: (Excluded from match score per tournament rules)                   │
│   [ 🧤 Turner 0 ]    [ 🛡️ Konsa 2 ]    [ 👟 Gordon 3 ]   [ ⚽ Muniz 2 ]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep Component Specifications

### 3.1 Modal Header & Meta Controls
- **Club Crest:** Displays the participating group's logo or fallback shield (`Shield` icon).
- **Manager & Team Identifier:** Prominent display of the fantasy team name and manager's real name.
- **External FPL Link:** Clickable `ExternalLink` icon pointing directly to the official Premier League website: `https://fantasy.premierleague.com/entry/{fplId}/event/{gameweek}`.
- **Active Chip Callout:**
  - Displays chip badge: `Triple Captain`, `Bench Boost`, `Free Hit`, or `Wildcard`.
  - Explains chip point adjustments (e.g. whether Triple Captain was reduced to 2x or Bench Boost was excluded).
- **View Switcher Tabs:**
  - `Pitch View`: Visual tactical pitch (`LayoutGrid` icon).
  - `List View`: Data-rich statistical table (`List` icon).

### 3.2 The Tactical Pitch View
Starters are partitioned dynamically into 4 tactical horizontal rows based on player position:
1. **Goalkeeper Row (GKP):** Exactly 1 starting goalkeeper centered at the top.
2. **Defenders Row (DEF):** 3, 4, or 5 starting defenders evenly spaced across the row.
3. **Midfielders Row (MID):** 3, 4, or 5 starting midfielders evenly spaced.
4. **Forwards Row (FWD):** 1, 2, or 3 starting strikers evenly spaced at the attacking end.

### 3.3 Individual Player Pitch Badge
Each player on the pitch renders:
- **Jersey Icon / Kit Badge:** Color-coded club shirt asset.
- **Player Web Name:** High-contrast text (e.g. `Saka`, `Haaland`, `Saliba`).
- **Club Short Code:** 3-letter abbreviation (`ARS`, `MCI`, `LIV`, etc.).
- **Captaincy Indicator:**
  - Standard Captain: Yellow `C` badge with double points (2x).
  - Triple Captain: Gold crown icon (`👑`) with `TC` badge and triple points (3x).
  - Vice-Captain: `V` badge.
- **Gameweek Points Pill:** Prominent badge displaying the player's official points scored in that Gameweek.

### 3.4 Bench Reserve Bar
- Positioned below the pitch surface with a distinct translucent divider.
- Displays the 4 reserve players: 1 substitute goalkeeper and 3 outfield bench players in priority order.
- Features clear rule annotations explaining whether bench points contributed to the tournament score (Bench Boost) or were excluded.

### 3.5 Detailed List View (`activeTab === "list"`)
Presents an exhaustive statistical breakdown in an interactive table:
- **Columns:** Player, Club, Position, Captaincy, Minutes Played, Goals, Assists, Clean Sheets, Bonus Points, and Total Gameweek Points.

---

## 4. Team Logo Picker Overlay (`TeamLogoPicker`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MODAL HEADER: Choose Team Logo                                          [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEARCH & LEAGUE FILTER BAR:                                                 │
│   [ 🔍 Search team or club name...                                       ] │
│   LEAGUES: [ALL] [Premier League] [La Liga] [Serie A] [Bundesliga]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ AUTO-SUGGESTION BANNER (if teamName matches):                               │
│   ✨ Suggested Match: Arsenal FC                                            │
│   [ Arsenal Crest ] [ Use Suggested Logo ]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ LOGO GRID:                                                                  │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│   │ [ARS]│ │ [AVL]│ │ [BOU]│ │ [BRE]│ │ [BHA]│ │ [CHE]│ │ [CRY]│ │ [EVE]│   │
│   │ Arsen│ │ Aston│ │ Bourn│ │ Brent│ │ Brigh│ │ Chels│ │ Cryst│ │ Evert│   │
│   ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤   │
│   │ [FUL]│ │ [IPS]│ │ [LEI]│ │ [LIV]│ │ [MCI]│ │ [MUN]│ │ [NEW]│ │ [NFO]│   │
│   │ Fulha│ │ Ipswi│ │ Leice│ │ Liver│ │ Man C│ │ Man U│ │ Newca│ │ Nottm│   │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│ MODAL FOOTER:                                                               │
│   [ Remove Logo ]                               [ Cancel ]  [ Select Logo ] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
1. **Curated Football Badge Library:** Hundreds of high-resolution transparent PNG crests across top European leagues.
2. **Instant Search Filter:** Real-time search query matching club names, nicknames, or leagues.
3. **League Filters:** Quick filter buttons (`ALL`, `Premier League`, `La Liga`, `Serie A`, `Bundesliga`, `Ligue 1`).
4. **Smart Auto-Suggestion Engine (`suggestLogoForTeamName`):** Analyzes the imported FPL League name (e.g. *"North London Gooners"* -> automatically suggests Arsenal FC crest).
5. **Selection Ring:** Selected logo glows with an indigo ring (`ring-2 ring-indigo-500 bg-indigo-50/50`).

---

## 5. Technical Logic & API Fetching

### 5.1 Dynamic Picks Endpoint (`/api/fpl/manager/[id]/picks`)
When the modal opens, it triggers a client-side fetch:
```typescript
const queryParams = new URLSearchParams({
  gameweek: String(gameweek),
  allowBenchBoost: String(allowBenchBoost),
  allowTripleCaptain: String(allowTripleCaptain),
});
const res = await fetch(`/api/fpl/manager/${fplId}/picks?${queryParams.toString()}`);
const data = await res.json();
setSquad(data.squad);
```

### 5.2 Responsive Modal Constraints
- Constrained to `max-w-4xl max-h-[94vh]`.
- Pitch canvas automatically scales down player badge padding on mobile screens (`p-1` vs `p-2`) while keeping all 11 starters legible without horizontal clipping.
