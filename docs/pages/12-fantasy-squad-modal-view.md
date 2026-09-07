# Page 12: Fantasy Squad Pitch & Team Crest Overlays

> **Components:** `components/fantasy-team-modal.tsx` & `components/team-logo-picker.tsx`  
> **Type:** Universal Interactive Modal Overlays  
> **Access Level:** Universal (Public Spectators, Participants, and Admins)  
> **Design Theme:** Global FPL Light System (`bg-white` dialog, `#37003C` headers, `#00FF87` accents) enclosing Emerald Tactical Stadium Pitch  

---

## 1. Component Overview

While rendered as interactive modal dialogs rather than standalone page routes, the **Fantasy Squad Pitch Modal** and **Team Logo Picker** are two of the most technically sophisticated and visually engaging interfaces in the entire application:

- **`<FantasyTeamModal />`:** A full-featured tactical football pitch experience displaying an FPL manager's 15-player squad for any specific Gameweek. It renders starting formations (e.g. 3-4-3, 4-3-3, 5-3-2), live player points, captaincy multipliers, automatic substitutions, bench status, and chip penalties, with full support for manual teams and FPL deadline status detection.
- **`<TeamLogoPicker />`:** A searchable club crest selector allowing organizers to assign authentic football club crests (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) or smart auto-suggested badges.

---

## 2. UI & Visual Architecture

### 2.1 The Modal Shell & Surface Styling
- **Modal Container:** Pure white dialog surface (`bg-white border-[#E5E5E5] rounded-2xl shadow-xl max-w-4xl max-h-[92vh] overflow-y-auto`).
- **Header Strip:** Deep Premier Purple typography (`text-[#37003C] font-black text-lg sm:text-xl`) with club crest, manager name, gameweek indicator, and an external link to the official FPL profile (or `Manual Player` pill for manual teams).
- **Gameweek Points Callout:** Bold points total (`text-2xl sm:text-3xl font-black text-[#37003C]`) with green PTS badge (`bg-[#00FF87]/20 text-[#008744] border-[#00FF87]/40`).
- **Active Chip Badge:** High-visibility chip callout (`bg-[#E7FF00]/30 border-[#E7FF00] text-[#37003C]`) explaining rule enforcement (e.g. `Triple Captain (3x)` or `Triple Captain (2x limited)`).

### 2.2 Wireframe Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MODAL HEADER:                                                               │
│   [Crest] Highbury Heroes                                   [↗ View on FPL] │
│   Alex Morgan · Gameweek 28 · London Gunners                     [ 78 PTS ] │
│   ⚡ Triple Captain (3x) Active                                              │
│   Formation: [ 3-4-3 ]                 TABS: [ ⚽ Pitch View ] [ 📋 List ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ DEADLINE WARNING (if FPL API updating):                                     │
│   ⚠️ FPL Deadline Processing: Gameweek 28 points are currently updating...   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PITCH VIEW CANVAS (Emerald Stadium):                                        │
│                                                                             │
│                           [ 🧤 Raya (ARS) 6pts ]                            │
│                                                                             │
│      [ Saliba 6 ]     [ Gabriel 8 ]     [ White 5 ]     [ Gvardiol 7 ]      │
│                                                                             │
│       [ Saka (C) 24pts 👑 ]     [ Palmer 12 ]     [ Foden 8 ]               │
│                                                                             │
│                [ Haaland 14 ]         [ Watkins 8 ]                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ BENCH RESERVE BAR:                                                          │
│   BENCH: (Excluded from match score per tournament rules)                   │
│   [ 🧤 Turner 0 ]    [ 🛡️ Konsa 2 ]    [ 👟 Gordon 3 ]   [ ⚽ Muniz 2 ]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep Component Specifications

### 3.1 Formation Engine & Pitch Rows
Starters are partitioned dynamically into 4 tactical horizontal rows based on player position:
1. **Goalkeepers (GKP):** Exactly 1 starting goalkeeper centered at the top.
2. **Defenders (DEF):** 3, 4, or 5 starting defenders evenly distributed.
3. **Midfielders (MID):** 3, 4, or 5 starting midfielders evenly distributed.
4. **Forwards (FWD):** 1, 2, or 3 starting strikers at the attacking front.

### 3.2 Individual Pitch Player Card
Each player badge renders:
- **Player Kit / Shirt:** Color-coded club shirt asset.
- **Player Web Name:** High-contrast text label (e.g. `Saka`, `Haaland`).
- **Club Short Code:** 3-letter abbreviation (`ARS`, `MCI`, `LIV`).
- **Captaincy Multipliers:**
  - Standard Captain: Yellow `C` badge with double points (2x).
  - Triple Captain: Gold crown icon (`👑`) with `TC` badge and triple points (3x).
  - Vice Captain: Neutral `V` badge.
- **Gameweek Points Pill:** Prominent badge displaying the player's official score.
- **Substituted Status:** Visual indicator if the player was automatically substituted onto the pitch.

### 3.3 Bench Reserve Bar
- Positioned below the pitch canvas with a distinct divider.
- Displays 4 bench players (1 goalkeeper + 3 outfield reserves in priority order).
- Annotates whether bench points contributed to the tournament score (Bench Boost) or were excluded.

### 3.4 Manual Player Support
- When viewing a squad with manual players (`isManualPlayer`):
  - Hides the external FPL link and displays a neutral `Manual Player` pill.
  - Presents player stats, goals, and points entered manually by tournament organizers without crashing the tactical canvas.

### 3.5 FPL Deadline & Downtime Protection
- Integrated with `lib/fpl-deadline.ts`.
- If the official FPL API is currently down or updating during a Gameweek deadline:
  - Displays a high-visibility amber notice banner informing the viewer that live picks are locked until Premier League servers complete updates.
  - Provides a `Retry` button to reload squad data when service resumes.

---

## 4. Team Crest Picker Overlay (`TeamLogoPicker`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MODAL HEADER: Choose Team Crest                                         [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEARCH & LEAGUE FILTER BAR:                                                 │
│   [ 🔍 Search team or club name...                                       ] │
│   LEAGUES: [ALL] [Premier League] [La Liga] [Serie A] [Bundesliga] [Ligue 1]│
├─────────────────────────────────────────────────────────────────────────────┤
│ SMART AUTO-SUGGESTION BANNER:                                               │
│   ✨ Suggested Match: Arsenal FC                                            │
│   [ Arsenal Crest ]  [ Use Suggested Logo ]                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ CREST GRID:                                                                 │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│   │ [ARS]│ │ [AVL]│ │ [BOU]│ │ [BRE]│ │ [BHA]│ │ [CHE]│ │ [CRY]│ │ [EVE]│   │
│   │ Arsen│ │ Aston│ │ Bourn│ │ Brent│ │ Brigh│ │ Chels│ │ Cryst│ │ Evert│   │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│ MODAL FOOTER:                                                               │
│   [ Remove Crest ]                              [ Cancel ]  [ Select Crest ]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
1. **Curated Football Crest Library:** High-resolution transparent PNG crests across top European leagues.
2. **Instant Search:** Instant text search across club names, cities, and nicknames.
3. **League Filters:** Quick filter badges (`ALL`, `Premier League`, `La Liga`, `Serie A`, `Bundesliga`, `Ligue 1`).
4. **Smart Auto-Suggestion Engine (`suggestLogoForTeamName`):** Automatically maps team names (e.g. *"North London Reds"* -> Arsenal FC).
5. **Selection Ring:** Selected crest glows with a purple accent ring (`ring-2 ring-[#37003C] bg-[#37003C]/5`).

---

## 5. Technical Logic & Data Pipeline

```typescript
const queryParams = new URLSearchParams({
  gameweek: String(gameweek),
  allowBenchBoost: String(allowBenchBoost),
  allowTripleCaptain: String(allowTripleCaptain),
});
const res = await fetch(`/api/fpl/manager/${fplId}/picks?${queryParams.toString()}`);
const data = await res.json();

if (data.isDeadline) {
  setIsDeadline(true);
} else {
  setSquad(data.squad);
}
```
