# Page 09: Admin Tournament Settings Edit

> **Route:** `/admin/tournaments/[id]/edit`  
> **Source File:** `app/admin/tournaments/[id]/edit/page.tsx`  
> **Component File:** `components/tournament-form.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Clean Light Administrative Theme (`bg-gray-100`, card `bg-white`)  

---

## 1. Page Overview

The **Tournament Settings Edit Page** allows administrators to modify an existing tournament's configuration. It pre-populates all existing data—including tournament name, season, chip scoring rules, primary admin, and co-admins—enabling organizers to adapt rules, re-brand competitions, or adjust the organizing committee without losing existing groups or fixtures.

### Primary Responsibilities
- Allow updating the tournament name and season.
- Toggle FPL chip scoring rules (Bench Boost on/off, Triple Captain 3x vs 2x) with retroactive score calculation capability.
- Manage tournament administrators: promote a co-admin to Primary Admin, verify and add new co-admins, or remove existing co-admins.
- Persist changes to the database via `PUT /api/admin/tournaments`.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [Trophy] Fantasy Leagues Admin     admin@test.com  [Logout]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   Edit Tournament                                                           │
│   Update tournament details and organizers                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRE-POPULATED TOURNAMENT FORM:                                              │
│                                                                             │
│ 1. BASIC INFORMATION:                                                       │
│    Tournament Name *                                                        │
│    [ Champions Fantasy Cup 2024 (Updated)                                  ]│
│    Season *                                                                 │
│    [ 2024                                                                  ]│
│                                                                             │
│ 2. FPL CHIPS CONFIGURATION:                                                 │
│    ⚡ FPL Chips Configuration                                                │
│    • Bench Boost Toggle:    [ENABLED / DISABLED]                            │
│    • Triple Captain Toggle: [ENABLED / DISABLED]                            │
│                                                                             │
│ 3. TOURNAMENT ADMINS (Multi-Admin Management):                              │
│    👥 Tournament Admins (2)                                [+ Add Co-Admin] │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ 👑 John Doe (Gunners XI)   #123456   [Primary Admin]                 │ │
│    ├──────────────────────────────────────────────────────────────────────┤ │
│    │ 🛡️ Jane Smith (Reds FC)    #789012   [Make Primary]  [🗑️ Remove]     │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [                     Save Changes Button                                  ]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Page Header Block
- **Title (H1):** `text-3xl font-bold text-gray-900` reading `Edit Tournament`.
- **Subtitle:** `text-gray-600` reading `Update tournament details and organizers`.

### 3.2 Pre-Populated Form Inputs
Reuses `<TournamentForm />` populated with `initialData`:
1. **Tournament Name:** Initialized with the existing tournament title.
2. **Season:** Initialized with the existing season integer.
3. **Chip Configuration Switches:**
   - Bench Boost: Reflects current `allowBenchBoost` boolean.
   - Triple Captain: Reflects current `allowTripleCaptain` boolean.
4. **Admins Panel:**
   - Displays all registered tournament organizers sorted with the primary admin at the top.
   - Each admin row shows name, FPL team name, and FPL ID (`#123456`).
   - Co-admin rows include interactive controls:
     - **Make Primary Button:** Designates the chosen co-admin as the primary account (`handleSetPrimary`).
     - **Remove Admin Button (`Trash2`):** Removes the co-admin from the tournament (`handleRemoveAdmin`).
   - **Add Co-Admin Button (`UserPlus`):** Expands the inline `<FPLVerifier />` form to verify and add an additional FPL account.

### 3.3 Form Actions
- **Save Changes Button:** Full-width submit button triggering the update mutation.
- Shows `Loader2` spinner and disabled state during request execution.

---

## 4. Technical Logic & API Mutation

### 4.1 Server-Side Page Query
```typescript
const tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    admins: {
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    },
  },
});

if (!tournament) {
  notFound();
}
```

### 4.2 Update Mutation (`PUT /api/admin/tournaments`)
```typescript
const response = await fetch("/api/admin/tournaments", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: initialData.id,
    name,
    season,
    adminFplId: primaryAdmin.fplId,
    admins,
    allowBenchBoost,
    allowTripleCaptain,
  }),
});
```

### 4.3 Database Synchronization
- Updates the `Tournament` record.
- Synchronizes the `TournamentAdmin` table: inserts newly added co-admins, removes deleted ones, and updates the `isPrimary` flag.
- Redirects back to `/admin` dashboard upon success.

---

## 5. Responsive Behavior

- **Mobile Viewports (< 640px):** Form fields and admin item cards collapse into single-column vertical stacks. Action buttons wrap onto multiple rows.
- **Desktop Viewports (>= 640px):** Form is centered inside `max-w-4xl` with generous padding (`p-8`).

---

## 6. Edge Cases & Validation

1. **Attempting to Delete the Only Admin:**
   - A tournament must always retain at least one administrator. Attempting to delete the final admin produces: `"A tournament must have at least one administrator."`.
2. **Transferring Primary Admin Status:**
   - If the primary admin is removed, primary status automatically falls back to the first remaining co-admin.
3. **Retroactive Scoring Notice:**
   - Modifying Bench Boost or Triple Captain rules alters how future score recalculations behave. Organizers can trigger `Recalculate All Scores` in the Schedule Builder to apply rule updates across existing matches.
