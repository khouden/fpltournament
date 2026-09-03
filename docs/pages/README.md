# FPL Tournament Platform — Page Architecture & UI/UX Documentation

> **Project:** FPL Tournament (Fantasy Leagues)  
> **Framework:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, Shadcn UI  
> **Documentation Version:** 2.0 (Complete Page Specification)  
> **Last Updated:** September 2026  

---

## 1. Executive Summary

This documentation suite provides an exhaustive, page-by-page breakdown of the **FPL Tournament** platform. Each document details the page's visual layout, design system tokens, UX architecture, component breakdown, interactive states, business logic, data models, and edge cases.

The application serves two primary audiences:
1. **Public Visitors & Fantasy Managers:** A public, spectator-ready dark-themed interface (`/`, `/tournaments`, `/tournaments/[id]`, `/matches/[id]`) with live league standings, head-to-head match cards, and interactive fantasy squad pitch views.
2. **Platform & Tournament Administrators:** A clean, high-productivity light-themed administrative dashboard (`/admin/*`) featuring multi-admin collaboration, FPL league import, team logo customization, automatic round-robin schedule generation, and on-demand FPL API score recalculation.

---

## 2. Global Site Architecture & Route Map

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     FPL TOURNAMENT SITE MAP                                      │
├────────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ PUBLIC INTERFACE (Dark Theme)  │ • /                               (Home / Landing Page)         │
│                                │ • /tournaments                    (Tournaments Directory)       │
│                                │ • /tournaments/[id]               (Tournament Detail & Table)   │
│                                │ • /matches/[id]                   (Head-to-Head Match View)     │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ ADMIN PORTAL (Light Theme)     │ • /admin/login                    (Admin Authentication)        │
│                                │ • /admin                          (Admin Dashboard & Overview)  │
│                                │ • /admin/tournaments/new          (Create Tournament Wizard)    │
│                                │ • /admin/tournaments/[id]         (Tournament Management Hub)   │
│                                │ • /admin/tournaments/[id]/edit    (Settings & Multi-Admin Edit) │
│                                │ • /admin/tournaments/[id]/groups  (Group Manager & FPL Import)  │
│                                │ • /admin/tournaments/[id]/schedule(Schedule & Fixture Builder)  │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ INTERACTIVE MODALS & OVERLAYS  │ • FantasyTeamModal                (Pitch Squad Lineup Viewer)   │
│                                │ • TeamLogoPicker                  (Club Logo Selection Modal)   │
└────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 3. Page Documentation Catalog

Click any page below to inspect its comprehensive UI/UX and functional specification:

| # | Page Document | Route | Access | Key Responsibilities |
| :-: | :--- | :--- | :--- | :--- |
| **01** | [Home / Landing Page](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/01-home-landing-page.md) | `/` | Public | Platform hero, feature showcase, live tournaments tracker, and core scoring rules overview. |
| **02** | [Tournaments Directory](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/02-tournaments-directory-page.md) | `/tournaments` | Public | Complete directory of active and completed tournaments with status badges and quick metrics. |
| **03** | [Tournament Detail & Standings](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/03-tournament-detail-page.md) | `/tournaments/[id]` | Public | Live league table (+3W/+1D/0L), gameweek fixture cards with player points, and team list. |
| **04** | [Match Detail & Squad Breakdown](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/04-match-detail-page.md) | `/matches/[id]` | Public | Head-to-head match scoreboard, side-by-side squad points, chip adjustments, and admin exclusion. |
| **05** | [Admin Login Page](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/05-admin-login-page.md) | `/admin/login` | Public / Guest | Secure authentication portal for application owners with password hashing and session cookies. |
| **06** | [Admin Dashboard](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/06-admin-dashboard-page.md) | `/admin` | Admin Session | High-level metrics, tournament management table, publication toggles, and deletion safety dialogs. |
| **07** | [Create Tournament Page](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/07-admin-create-tournament-page.md) | `/admin/tournaments/new` | Admin Session | Tournament creation form, Bench Boost & Triple Captain chip rules, and Primary FPL Admin verification. |
| **08** | [Admin Tournament Management Hub](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/08-admin-tournament-manage-page.md) | `/admin/tournaments/[id]` | Admin Session | Central tournament cockpit: key statistics, live standings, multi-admin management, and navigation hub. |
| **09** | [Edit Tournament Settings](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/09-admin-tournament-edit-page.md) | `/admin/tournaments/[id]/edit` | Admin Session | Edit tournament metadata, update chip scoring configurations, and add/remove co-administrators. |
| **10** | [Admin Group & League Manager](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/10-admin-group-manager-page.md) | `/admin/tournaments/[id]/groups` | Admin Session | Import FPL Classic Leagues across all co-admins, assign custom team logos, rename teams, and inspect squads. |
| **11** | [Admin Schedule Builder](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/11-admin-schedule-builder-page.md) | `/admin/tournaments/[id]/schedule` | Admin Session | Automated round-robin generator, custom round/fixture CRUD, live FPL score recalculation, and finalization. |
| **12** | [Fantasy Squad Pitch & Logo Overlays](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/docs/pages/12-fantasy-squad-modal-view.md) | Overlay Modals | Universal | Interactive 15-player tactical pitch view, captaincy badges, chip impacts, and club logo search picker. |

---

## 4. Visual Design System & Aesthetics

### 4.1 Dual-Theme Strategy

The application employs a deliberate, highly tailored **Dual-Theme Design System**:

1. **Public Spectator Experience (Dark Glassmorphism):**
   - **Background:** Deep cosmic midnight mesh: `bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900`
   - **Surfaces:** Translucent glass cards: `bg-white/5 border border-white/10 backdrop-blur-md`
   - **Text:** Crisp white headers (`text-white`), muted lilac labels (`text-indigo-200/80`), and slate body text (`text-gray-400`)
   - **Accents:** Neon Indigo (`text-indigo-400`, `bg-indigo-600`), Emerald Green for wins/active states (`text-emerald-400`), Amber Gold for crowns/points (`text-amber-400`)

2. **Admin Operations Portal (Clean Light Productivity):**
   - **Background:** Soft administrative gray: `bg-gray-100` / `bg-gradient-to-br from-blue-50 to-indigo-100`
   - **Surfaces:** Pure white cards with subtle drop shadows: `bg-white border border-gray-200 shadow-xs`
   - **Text:** High-contrast slate typography (`text-gray-900`, `text-gray-600`)
   - **Accents:** Indigo primary buttons (`bg-indigo-600 hover:bg-indigo-700`), Emerald publication pills, Rose destructive badges

### 4.2 Typography & Iconography
- **Typography:** Powered by Google's `Geist Sans` (UI readability) and `Geist Mono` (scores, gameweek numbers, and tabular data).
- **Icons:** `lucide-react` icons standard throughout (Trophy, Calendar, Users, Crown, Armchair, Shield, Zap, Sparkles, Eye, Trash2, Pencil, ExternalLink).

---

## 5. Architectural Principles

1. **Strict Admin Points Exclusion:**
   Organizers join private FPL leagues strictly to enable data synchronization. Their scores are programmatically excluded (`isExcluded: true`, displayed with a strikethrough and shield icon).
2. **Multi-Admin League Aggregation:**
   Organizers can attach multiple FPL Co-Admins to a single tournament, allowing the platform to pool private leagues from multiple manager accounts without hitting FPL's 30-league limit.
3. **Head-to-Head Group Scoring:**
   Matches pit two FPL Classic Leagues against each other. Each group's score is the exact sum of all non-admin members' Gameweek points minus transfer costs, with configurable chip adjustments.
4. **Resilient Data Caching:**
   Gameweek rosters and scores are stored in Prisma (`MatchScore`, `GroupMember`) so historical fixtures remain immutable even when managers make subsequent transfers in the live FPL game.
