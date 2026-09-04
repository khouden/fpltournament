# Page 06: Admin Dashboard & Tournaments Directory

> **Route:** `/admin`  
> **Source File:** `app/admin/page.tsx`  
> **Layout File:** `app/admin/layout.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** FPL Operational Design System (`bg-[#F7F7F7]`, cards `bg-white border-[#E5E5E5]`, primary `#37003C`)  

---

## 1. Page Overview

The **Admin Dashboard** is the command center for tournament administrators. It provides an immediate executive summary of all competitions hosted on the platform, categorized KPI metrics, shortcuts to create new tournaments, and direct administrative controls to edit, manage groups, generate schedules, publish, unpublish, or delete competitions.

### Primary Responsibilities
- Display high-level platform KPIs: Total Tournaments, Published Tournaments, and Draft Tournaments.
- List all created tournaments with real-time metadata (season, group count, match count, chip rules).
- Provide instantaneous administrative actions: Publish, Unpublish, Edit, Manage Groups, Build Schedule, and Delete.
- Guard deletion behind accessible confirmation modal dialogs.
- Enforce validation rules before allowing drafts to be published.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ DASHBOARD HEADER:                                                           │
│   Dashboard                                          [+ Create Tournament]  │
│   Manage tournaments and competitions                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ KPI SUMMARY METRICS (3 Columns Desktop / 1 Column Mobile):                  │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐│
│ │ TOTAL TOURNAMENTS    │  │ PUBLISHED            │  │ DRAFT                ││
│ │ 4                    │  │ 3                    │  │ 1                    ││
│ │ [🏆 Icon]            │  │ [✓ CheckCircle2]     │  │ [📄 FileText]        ││
│ └──────────────────────┘  └──────────────────────┘  └──────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENTS MANAGEMENT PANEL:                                               │
│   Tournaments · All competitions                     4 Competitions         │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ Champions Fantasy Cup 2024                             [✓ PUBLISHED]  │ │
│   │ 📅 Season 2024 · 👥 4 groups · 🏆 12 matches · [BB ON] [TC ON]        │ │
│   │ [✏️ Edit] [👥 Groups] [📅 Schedule] [👁️ Unpublish]         [🗑️ Delete] │ │
│   ├───────────────────────────────────────────────────────────────────────┤ │
│   │ Premier League Knockout                                [📄 DRAFT]     │ │
│   │ 📅 Season 2024 · 👥 8 groups · 🏆 0 matches ·  [BB OFF] [TC ON]       │ │
│   │ [✏️ Edit] [👥 Groups] [📅 Schedule] [🚀 Publish]           [🗑️ Delete] │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Admin Top Navigation (`app/admin/layout.tsx`)
- **Brand Title:** `Fantasy Leagues` with Trophy icon in Deep Premier Purple (`#37003C`) and Fantasy Green (`#00FF87`) accent, plus an uppercase `ADMIN` badge, linking to `/admin`.
- **User Identifier:** Displays the authenticated admin's email address (`session.user?.email`) in muted secondary text (`text-[#666666]`).
- **Logout Action:** Accessible secondary/outline button triggering `logoutAction` with `LogOut` icon, gracefully styled without dominating the navigation bar.

### 3.2 Dashboard Header & Primary Action
- **Header:** High-contrast `Dashboard` title (`text-2xl sm:text-3xl font-extrabold text-[#1F1F1F]`) with descriptive subtitle `Manage tournaments and competitions`.
- **Primary CTA:** Prominent `+ Create Tournament` button styled in Deep Premier Purple (`bg-[#37003C] hover:bg-[#5A0A63] text-white`) linking to `/admin/tournaments/new`. Positioned inline with header on desktop and full-width on mobile.

### 3.3 KPI Stat Cards
A 3-card responsive grid (`grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6`):
1. **Total Tournaments:** Large count in `text-[#1F1F1F]`, `Trophy` icon in `bg-[#37003C]/10 text-[#37003C]`.
2. **Published:** Large count in `text-emerald-600`, `CheckCircle2` icon in `bg-emerald-50 text-emerald-600`.
3. **Draft:** Large count in `text-amber-600`, `FileText` icon in `bg-amber-50 text-amber-600`.
Cards retain clean white surfaces with 1px `#E5E5E5` borders and subtle shadows.

### 3.4 Tournaments Management List
- **Section Heading:** `Tournaments` and `All competitions` with a subtle total competition count pill.
- **Tournament Card Items:**
  - **Tournament Title Link:** Links directly to `/admin/tournaments/${tournament.id}` for deep tournament administration.
  - **Explicit Status Badges:**
    - `PUBLISHED`: Emerald pill with `CheckCircle2` icon.
    - `DRAFT`: Amber pill with `FileText` icon.
    - `FINISHED`: Neutral gray pill with `Clock` icon.
  - **Metadata Row:**
    - `Season {season}` with `Calendar` icon.
    - `{groups} groups` with `Users` icon.
    - `{matches} matches` with `Trophy` icon.
    - Chip Rule Indicators: `[BB ON]` / `[BB OFF]` and `[TC ON]` / `[TC OFF]` compact badges.
  - **Action Toolbar (`TournamentActions`):**
    - **Primary:** `Edit` (`Pencil` icon, links to `/admin/tournaments/${id}/edit`).
    - **Secondary:** `Groups` (`Users` icon) and `Schedule` (`Calendar` icon).
    - **Contextual:**
      - `Publish` (Drafts only): Emerald button with `Upload` icon calling `publishTournamentWithValidationAction(tournamentId)`. Disabled if tournament has fewer than 2 groups.
      - `Unpublish` (Published only): Secondary outline button with `EyeOff` icon calling `unpublishTournamentAction(tournamentId)`.
    - **Destructive:** `Delete` (`Trash2` icon) opening the deletion modal dialog, separated to prevent accidental clicks.

### 3.5 Deletion Confirmation Dialog (`AlertDialog`)
- Prompts administrator: `"Delete Tournament?"`
- Description: `"Are you sure you want to delete '{tournamentName}'? This action cannot be undone and all associated rounds and matches will be removed."`
- Buttons: `Cancel` and destructive `Delete` (with loading spinner during deletion).

---

## 4. Technical Logic & Server Actions

### 4.1 Server-Side Data Loading
```typescript
const tournaments = await prisma.tournament.findMany({
  include: {
    groups: true,
    rounds: {
      include: { matches: true },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### 4.2 Publication Validation Engine
Before a tournament can transition from `DRAFT` to `PUBLISHED`, `publishTournamentWithValidationAction` enforces strict rules:
1. Tournament must have at least 2 groups imported.
2. Tournament must have at least 1 round with scheduled matches.
3. If validation fails, an alert banner displays the exact list of issues that must be addressed:
   ```tsx
   {validationIssues.length > 0 && (
     <ul className="list-disc list-inside space-y-1 font-medium text-red-800">
       {validationIssues.map((issue, idx) => (
         <li key={idx}>{issue}</li>
       ))}
     </ul>
   )}
   ```

---

## 5. Responsive Breakpoints

- **Mobile (< 768px):** KPI metric cards stack vertically. Tournament action buttons wrap comfortably (`flex-wrap gap-2`). Header CTA flows beneath title. Brand in navbar remains compact.
- **Desktop (>= 768px):** KPI cards display in 3 equal columns. Dashboard header features inline CTA. Tournament cards feature inline horizontal metadata and clean left-to-right action toolbar with delete aligned cleanly.

---

## 6. Edge Cases & Empty States

### Zero Tournaments Created
When no tournaments exist in the database, the dashboard displays a clean centered white card:
- Trophy icon in `#37003C` accent.
- Title: `"No tournaments yet"`.
- Description: `"Create your first tournament to get started."`.
- Centered `+ Create Tournament` button.

