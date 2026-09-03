# Page 06: Admin Dashboard & Tournaments Directory

> **Route:** `/admin`  
> **Source File:** `app/admin/page.tsx`  
> **Layout File:** `app/admin/layout.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Clean Light Administrative Theme (`bg-gray-100`, cards `bg-white`)  

---

## 1. Page Overview

The **Admin Dashboard** is the command center for the tournament administrator. It provides an immediate executive summary of all tournaments hosted on the platform, categorized KPI metrics, quick shortcuts to create new tournaments, and direct administrative controls to edit, manage groups, generate schedules, publish, or delete competitions.

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
│ ADMIN NAVBAR: [Trophy] Fantasy Leagues Admin     admin@test.com  [Logout]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ DASHBOARD TITLE:                                                            │
│   Dashboard                                                                 │
│   Manage tournaments and competitions                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ KPI SUMMARY METRICS:                                                        │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐│
│ │ Total Tournaments 4  │  │ Published          3 │  │ Draft              1 ││
│ │ [🏆 Icon]            │  │ [✓ CheckCircle]      │  │ [📄 FileText]        ││
│ └──────────────────────┘  └──────────────────────┘  └──────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENTS MANAGEMENT PANEL:                                               │
│   Tournaments                                      [+ Create Tournament]   │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ Champions Fantasy Cup 2024                             [PUBLISHED]    │ │
│   │ Season 2024 · 4 groups · 12 matches · BB: On · TC: On                 │ │
│   │ [Edit] [Groups] [Schedule] [Unpublish] [Delete]                       │ │
│   ├───────────────────────────────────────────────────────────────────────┤ │
│   │ Premier League Knockout                                [DRAFT]        │ │
│   │ Season 2024 · 8 groups · 0 matches · BB: Off · TC: On                 │ │
│   │ [Edit] [Groups] [Schedule] [Publish] [Delete]                         │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Admin Top Navigation (`app/admin/layout.tsx`)
- **Brand Title:** `Fantasy Leagues Admin` with `Trophy` icon in `indigo-600`, linking to `/admin`.
- **User Identifier:** Displays the authenticated admin's email address (`session.user?.email`).
- **Logout Action:** Form button triggering `logoutAction`, terminating the session cookie and redirecting to `/admin/login`.

### 3.2 KPI Stat Cards
A 3-card grid (`grid gap-6 md:grid-cols-3`):
1. **Total Tournaments:** Large count in `text-gray-900`, `Trophy` icon in `bg-indigo-50 text-indigo-600`.
2. **Published Tournaments:** Large count in `text-emerald-600`, `CheckCircle2` icon in `bg-emerald-50 text-emerald-600`.
3. **Draft Tournaments:** Large count in `text-amber-600`, `FileText` icon in `bg-amber-50 text-amber-600`.

### 3.3 Tournaments List Panel
- **Header Action:** Prominent `Create Tournament` button (`Button asChild`) linking to `/admin/tournaments/new` with a `Plus` icon.
- **Tournament Card Rows:**
  - **Tournament Title Link:** Links directly to `/admin/tournaments/${tournament.id}` for deep management.
  - **Metadata Subtitle:** `Season {season} · {groups} groups · {matches} matches · BB: {On/Off} · TC: {On/Off}`.
  - **Status Pill:**
    - `PUBLISHED`: Emerald badge (`variant="success"`).
    - `DRAFT`: Amber badge (`variant="warning"`).
    - `FINISHED`: Gray badge (`variant="secondary"`).
  - **Action Toolbar (`TournamentActions`):**
    - `Edit`: Links to `/admin/tournaments/${id}/edit`.
    - `Groups`: Links to `/admin/tournaments/${id}/groups`.
    - `Schedule`: Links to `/admin/tournaments/${id}/schedule`.
    - `Publish` (Drafts only): Triggers `publishTournamentWithValidationAction(tournamentId)`. Disables if no groups exist.
    - `Unpublish` (Published only): Reverts status back to `DRAFT`.
    - `Delete`: Destructive button opening the `AlertDialog` confirmation modal.

### 3.4 Deletion Confirmation Dialog (`AlertDialog`)
- Prompts the user: `"Delete Tournament?"`
- Description: `"Are you sure you want to delete '{tournamentName}'? This action cannot be undone and all associated rounds and matches will be removed."`
- Buttons: `Cancel` and `Delete` (styled in destructive red with loading spinner).

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
Before a tournament can transition from `DRAFT` to `PUBLISHED`, `publishTournamentWithValidationAction` enforces strict business rules:
1. Tournament must have at least 2 groups imported.
2. Tournament must have at least 1 round with scheduled matches.
3. If validation fails, an alert banner displays the exact list of issues that must be addressed:
   ```tsx
   {validationIssues.length > 0 && (
     <ul className="list-disc list-inside space-y-0.5">
       {validationIssues.map((issue, idx) => (
         <li key={idx}>{issue}</li>
       ))}
     </ul>
   )}
   ```

---

## 5. Responsive Breakpoints

- **Mobile (< 768px):** KPI metric cards stack vertically. Tournament action buttons wrap onto multiple rows (`flex-wrap gap-1.5`).
- **Desktop (>= 768px):** KPI cards display in 3 equal columns. Tournament cards feature inline horizontal layouts with flush right actions.

---

## 6. Edge Cases & Empty States

### Zero Tournaments Created
When no tournaments exist in the database, the list card displays:
```tsx
<p className="mt-4 text-sm text-gray-600">
  No tournaments yet. Create your first tournament to get started.
</p>
```
With the `Create Tournament` button highlighted above.
