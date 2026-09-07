# FPL Tournament Platform — Page Architecture & UI/UX Documentation

> **Project:** FPL Tournament (Fantasy Leagues)  
> **Framework:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, Shadcn UI  
> **Documentation Version:** 2.1 (Complete Platform Specification with 4-Step Wizard & Manual Scoring)  
> **Last Updated:** September 2026  

---

## 1. Executive Summary

This documentation suite provides an exhaustive, page-by-page specification of the **FPL Tournament** platform. Each document details the page's visual layout, design system tokens, UX architecture, component breakdown, interactive states, business logic, data models, edge cases, and server actions.

The application serves two primary audiences:
1. **Public Visitors & Fantasy Managers:** A public, spectator-ready experience (`/`, `/tournaments`, `/tournaments/[id]`, `/matches/[id]`) featuring panoramic tournament banners, live league standings (+3W/+1D/0L), head-to-head match cards with live in-progress and incoming fixture states, and interactive fantasy squad tactical pitch views.
2. **Platform & Tournament Administrators:** A high-productivity administrative portal (`/admin/*`) featuring a guided 4-step tournament wizard, multi-admin collaboration, FPL Classic League imports, manual team and player creation, custom team crest assignment, automated Berger round-robin schedule generation, manual fixture score editing, round-level recalculation, and pre-flight validation before public launch.

---

## 2. Global Site Architecture & Route Map

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     FPL TOURNAMENT SITE MAP                                      │
├────────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ PUBLIC SPECTATOR INTERFACE     │ • /                               (Home / Landing Page)         │
│ (Cosmic Dark & FPL Light)      │ • /tournaments                    (Tournaments Directory)       │
│                                │ • /tournaments/[id]               (Tournament Detail & Standings)│
│                                │ • /matches/[id]                   (Head-to-Head Match Center)   │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ ADMIN OPERATIONS PORTAL        │ • /admin/login                    (Admin Authentication Portal) │
│ (Global FPL Design System)     │ • /admin                          (Admin Dashboard & Overview)  │
│                                │ • /admin/tournaments/new          (Wizard Step 1: Create)       │
│                                │ • /admin/tournaments/[id]         (Tournament Management Hub)   │
│                                │ • /admin/tournaments/[id]/edit    (Wizard Step 1: Edit Details) │
│                                │ • /admin/tournaments/[id]/groups  (Wizard Step 2: Groups/Teams) │
│                                │ • /admin/tournaments/[id]/schedule(Wizard Step 3: Schedule)     │
│                                │ • /admin/tournaments/[id]/publish (Wizard Step 4: Review/Launch)│
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ INTERACTIVE MODALS & OVERLAYS  │ • FantasyTeamModal                (Tactical Pitch Squad Viewer) │
│                                │ • TeamLogoPicker                  (Club Crest Selection Modal)  │
│                                │ • AddManualTeamModal              (Manual Offline Team Creator) │
│                                │ • ManualPlayerModal               (Manual Team Player Creator)  │
│                                │ • ManualMatchScoreModal           (Manual Score & Points Editor)│
└────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 3. Page Documentation Catalog

Click any page below to inspect its comprehensive UI/UX and functional specification:

| # | Page Document | Route | Access | Key Responsibilities |
| :-: | :--- | :--- | :--- | :--- |
| **01** | [Home / Landing Page](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/01-home-landing-page.md) | `/` | Public | Platform hero, feature showcase, live tournaments tracker, stadium banners, and scoring rules. |
| **02** | [Tournaments Directory](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/02-tournaments-directory-page.md) | `/tournaments` | Public | Directory of active and completed competitions with stadium banners, match progress, and chip rules. |
| **03** | [Tournament Detail & Standings](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/03-tournament-detail-page.md) | `/tournaments/[id]` | Public | Panoramic banner hero, live table (+3W/+1D/0L), live/incoming gameweek cards, and team rosters. |
| **04** | [Match Detail & Squad Breakdown](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/04-match-detail-page.md) | `/matches/[id]` | Public | Head-to-head match scoreboard, live/incoming alerts, side-by-side squad points, and admin exclusion. |
| **05** | [Admin Login Page](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/05-admin-login-page.md) | `/admin/login` | Public / Guest | Minimal authentication portal for organizers with password hashing and session cookies. |
| **06** | [Admin Dashboard](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/06-admin-dashboard-page.md) | `/admin` | Admin Session | Platform KPIs, tournament list with banner thumbnails, quick actions, and deletion safety dialogs. |
| **07** | [Create Tournament Page (Wizard Step 1)](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/07-admin-create-tournament-page.md) | `/admin/tournaments/new` | Admin Session | Guided wizard Step 1: Competition details, stadium banner selector (presets/upload), chip rules, and admin verification. |
| **08** | [Admin Tournament Management Hub](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/08-admin-tournament-manage-page.md) | `/admin/tournaments/[id]` | Admin Session | Central tournament cockpit: banner showcase, operational KPIs, embedded live table, and wizard navigation. |
| **09** | [Edit Tournament Settings](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/09-admin-tournament-edit-page.md) | `/admin/tournaments/[id]/edit` | Admin Session | Revisit Step 1: Update metadata, change stadium banner, adjust chip rules, and manage co-organizers. |
| **10** | [Admin Group & League Manager (Wizard Step 2)](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/10-admin-group-manager-page.md) | `/admin/tournaments/[id]/groups` | Admin Session | Guided wizard Step 2: Multi-admin FPL league import, manual team/player creator, crest assignment, and deadline protection. |
| **11** | [Admin Schedule Builder (Wizard Step 3)](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/11-admin-schedule-builder-page.md) | `/admin/tournaments/[id]/schedule` | Admin Session | Guided wizard Step 3: Round-robin generator, custom rounds, round-level recalculation, and manual score entry. |
| **12** | [Fantasy Squad Pitch & Crest Overlays](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/12-fantasy-squad-modal-view.md) | Overlay Modals | Universal | Interactive 15-player tactical pitch view, captaincy multipliers, manual player support, and European club crest search. |
| **13** | [Review & Publish Tournament (Wizard Step 4)](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/13-admin-tournament-publish-page.md) | `/admin/tournaments/[id]/publish` | Admin Session | Guided wizard Step 4: Pre-flight readiness checks, consolidated tournament preview, launch confirmation, and unpublish controls. |

---

## 4. Visual Design System & Aesthetics

### 4.1 Design Philosophy & Color Palette
The platform utilizes a consistent, modern **Global Premier League FPL Design System**:
- **Deep Premier Purple:** `#37003C` (Primary brand color, headers, key buttons, and active tabs)
- **Secondary Purple:** `#5A0A63` (Interactive hover states and secondary accents)
- **Fantasy Green:** `#00FF87` (Live indicators, status dots, verification badges, and success highlights)
- **Fantasy Emerald:** `#008744` / `#008f4c` (High-contrast accessible text labels and points pills)
- **FPL Pink Accent:** `#E9007F` (Highlighted micro-badges, notifications, and active accents)
- **Canvas Background:** Clean operational canvas `#F7F7F7`
- **Surface Cards:** Pure white `#FFFFFF` cards with fine 1px borders (`#E5E5E5`) and subtle elevation (`shadow-fpl-sm` / `shadow-2xs`)

### 4.2 Typography & Iconography
- **Typography:** `Geist Sans` and `Poppins` for UI readability and bold tournament headings; `Geist Mono` for points, gameweek tags, and tabular calculations.
- **Iconography:** `lucide-react` icons standard throughout (Trophy, Calendar, Users, Rocket, Crown, Armchair, Shield, Zap, Sparkles, Check, Clock, Eye, Trash2, Pencil, ExternalLink).

---

## 5. Core Architectural Principles

1. **Guided 4-Step Tournament Setup Wizard:**
   Organizers are guided smoothly through four dedicated steps: (1) Details & Rules, (2) Groups & Teams, (3) Schedule & Fixtures, and (4) Review & Publish (`TournamentWizardStepper`).
2. **Strict Admin Points Exclusion:**
   Organizers join private FPL leagues strictly to synchronize roster data. Their scores are programmatically excluded (`isExcluded: true`, displayed with strikethrough styling and a shield icon).
3. **Multi-Admin League Aggregation:**
   Organizers can attach multiple FPL Co-Admins to a single tournament, pooling private leagues across multiple manager accounts without hitting FPL's 30-league limit.
4. **Dual Team Architecture (FPL Classic Leagues & Manual Teams):**
   Competitions can combine or exclusively feature official FPL Classic Leagues or completely offline manual squads with manual player rosters and score entry (`ManualMatchScoreModal`).
5. **Gameweek Deadline & Downtime Protection:**
   The application monitors the FPL API state (`lib/fpl-deadline.ts`, `/api/fpl/status`). During gameweek deadlines when FPL servers undergo maintenance, admins are warned and protected against data corruption.
6. **Graceful Upcoming & Live Match States:**
   Fixtures support `INCOMING` (scheduled future gameweeks with kickoff notice), `IN_PROGRESS` (live provisional points tracking), `COMPLETED` (finished gameweek), and `FINALIZED` (immutable official result).
7. **Round-Level Recalculation:**
   Admins can recalculate scores at the round level (`recalculateRoundAction`), refreshing live points for an entire Gameweek round without mutating historical or future rounds.
