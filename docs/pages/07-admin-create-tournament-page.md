# Page 07: Admin Create Tournament Wizard

> **Route:** `/admin/tournaments/new`  
> **Source File:** `app/admin/tournaments/new/page.tsx`  
> **Component File:** `components/tournament-form.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Clean Light Administrative Theme (`bg-gray-100`, card `bg-white`)  

---

## 1. Page Overview

The **Create Tournament Page** is a comprehensive setup wizard that allows the tournament organizer to establish a new competition. It combines basic metadata input, granular FPL chip scoring rules, and live FPL account verification via the official Premier League API to establish the tournament's primary admin and co-administrators.

### Primary Responsibilities
- Collect tournament identification details (Name, Season).
- Configure tournament-wide FPL chip policies (Bench Boost on/off, Triple Captain 3x vs 2x).
- Verify the **Primary Admin FPL account** via real-time FPL API validation.
- Optionally attach **Co-Admins** to aggregate leagues from multiple organizers.
- Enforce the **Admin Exclusion Rule** at tournament initialization.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [Trophy] Fantasy Leagues Admin     admin@test.com  [Logout]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   Create Tournament                                                         │
│   Set up a new tournament for your FPL league                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT FORM CARD:                                                       │
│                                                                             │
│ 1. BASIC INFORMATION:                                                       │
│    Tournament Name *                                                        │
│    [ Premier League Fantasy Cup 2024                                       ]│
│    Season *                                                                 │
│    [ 2024                                                                  ]│
│                                                                             │
│ 2. FPL CHIPS CONFIGURATION CARD:                                            │
│    ⚡ FPL Chips Configuration                                                │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ [Armchair] Bench Boost                       [ENABLED]      [Toggle] │ │
│    │ Bench points count fully towards match score when played.            │ │
│    ├──────────────────────────────────────────────────────────────────────┤ │
│    │ [Crown] Triple Captain                       [ENABLED]      [Toggle] │ │
│    │ Triple Captain multiplier (3x) counts fully towards match score.     │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 3. TOURNAMENT ADMINS CARD (Multi-Admin Support):                            │
│    👥 Tournament Admins (1)                                [+ Add Co-Admin] │
│    ℹ️ Why add multiple admins? Private league limits. All admins excluded. │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ 👑 John Doe (Gunners XI)   #123456   [Primary Admin]                 │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [                     Create Tournament Button                             ]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Form Specifications

### 3.1 Basic Tournament Metadata
- **Tournament Name Field:**
  - Label: `Label htmlFor="name"` (`Tournament Name *`)
  - Input: `Input type="text"` with placeholder `e.g., Premier League Fantasy Cup 2024`, required.
- **Season Field:**
  - Label: `Label htmlFor="season"` (`Season *`)
  - Input: `Input type="number"` with range min `2020` to max `2100`, defaulting to the current calendar year.

### 3.2 FPL Chips Configuration Panel
A dedicated sub-card (`Card className="bg-gray-50/70 border-gray-200"`) housing two independent switches:
1. **Bench Boost Toggle:**
   - Visual Badge: Green `ENABLED` (`variant="success"`) or Red `DISABLED` (`variant="destructive"`).
   - Dynamic Explainer Text:
     - *Enabled:* `"Bench points count fully towards match score when a manager plays Bench Boost."`
     - *Disabled:* `"Bench points are excluded from the score (only starting 11 players count)."`
   - Interactive Control: Shadcn `Switch id="allowBenchBoost"`
2. **Triple Captain Toggle:**
   - Visual Badge: Green `ENABLED` or Red `DISABLED`.
   - Dynamic Explainer Text:
     - *Enabled:* `"Triple Captain multiplier (3x) counts fully towards match score."`
     - *Disabled:* `"Triple Captain is reduced to 2x (captain points are doubled instead of tripled)."`
   - Interactive Control: Shadcn `Switch id="allowTripleCaptain"`

### 3.3 Multi-Admin Configuration & FPL Verifier (`FPLVerifier`)
- **Informational Alert:** Highlights why multi-admin architecture is essential:
  > *"In Fantasy Premier League, an account can only join a limited number of private leagues. Adding co-admins allows your tournament to import teams from leagues joined by multiple organizers. All tournament admins are automatically excluded from match scoring."*
- **Step 1: Primary Admin Verification:**
  - If no admin is verified yet, renders the `<FPLVerifier />` widget:
    - Input: FPL Manager Entry ID (e.g., `123456`).
    - Action: `Verify Primary Admin` button.
    - Logic: Calls `/api/fpl/manager/{id}`. Upon a successful 200 response, retrieves the manager's official name (`player_first_name player_last_name`) and FPL team name (`name`).
    - Result: Adds the manager as the **Primary Admin** (`isPrimary: true`).
- **Step 2: Adding Co-Admins:**
  - Once the Primary Admin is locked in, an `Add Co-Admin` button appears (`UserPlus` icon).
  - Clicking this button expands a second `<FPLVerifier />` form.
  - Verified co-admins are added to the active admins list (`isPrimary: false`).
- **Admin Management Actions:**
  - **Set Primary:** Change which admin is designated as the primary organizer.
  - **Remove Admin:** Delete a co-admin (prevented if only 1 admin remains).

### 3.4 Submission Action
- Full-width button: `Create Tournament`.
- Shows `Loader2` animated spinner during asynchronous API dispatch.
- Disabled while processing.

---

## 4. Technical Logic & API Integration

### 4.1 Form Submission Workflow
The form submits a JSON payload to `POST /api/admin/tournaments`:
```typescript
const response = await fetch("/api/admin/tournaments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name,
    season,
    adminFplId: primaryAdmin.fplId,
    admins, // Array<{ fplId, name, teamName, isPrimary }>
    allowBenchBoost,
    allowTripleCaptain,
  }),
});
```

### 4.2 Database Transaction Structure
When created, Prisma automatically executes a relational transaction:
1. Creates the `Tournament` record with `status: "DRAFT"`.
2. Creates entries in the `TournamentAdmin` table for all verified administrators.
3. Automatically marks each admin's FPL ID so that future league member imports exclude these IDs by default.

---

## 5. Responsive Behavior

- **Mobile (< 640px):** Form fields, chip rule switches, and FPL verifier cards stack into single columns. Action buttons occupy full container width.
- **Desktop (>= 640px):** Card is centered inside `max-w-4xl` with spacious `p-8` padding. Admin items display horizontally with flush action buttons.

---

## 6. Validation Rules & Error Handling

1. **Unverified FPL Admin:**
   - If the user attempts to submit the form without verifying at least one FPL manager account, submission is halted with: `"Please verify at least one FPL admin account first"`.
2. **Duplicate Co-Admin:**
   - Verifying an FPL ID already present in the tournament displays: `"This manager is already an administrator of the tournament."`.
3. **Invalid FPL Entry ID:**
   - The FPL Verifier catches 404/500 errors from the official Fantasy Premier League API and presents a friendly error banner: `"FPL manager not found. Please check the Entry ID."`.
