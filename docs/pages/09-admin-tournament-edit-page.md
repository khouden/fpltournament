# Page 09: Admin Tournament Settings Edit

> **Route:** `/admin/tournaments/[id]/edit`  
> **Source File:** `app/admin/tournaments/[id]/edit/page.tsx`  
> **Component Files:** `components/tournament-form.tsx`, `components/tournament-wizard-stepper.tsx`, `components/fpl-verifier.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Operational Design System (`bg-[#F7F7F7]`, primary `#37003C`, accents `#00FF87` and `#E9007F`, cards `bg-white border-[#E5E5E5]`)  

---

## 1. Page Overview

The **Tournament Settings Edit Page** allows administrators to modify an existing tournament's configuration or revisit Step 1 of the tournament wizard. It pre-populates all existing competition parameters—including tournament title, season, stadium banner artwork, chip scoring rules, primary organizer, and co-administrators—enabling organizers to rebrand competitions, adapt chip scoring, or manage the organizing committee without impacting existing teams or fixtures.

### Primary Responsibilities
- Update competition identification (Tournament Name, Season).
- Customize tournament branding: Select from 6 preset stadium vectors, upload custom image assets via `/api/admin/upload`, or update the remote banner URL.
- Configure FPL chip policies (Bench Boost on/off, Triple Captain 3x vs 2x) with retroactive scoring recalculation capabilities.
- Manage tournament organizers: Designate a new Primary Admin, verify and add new co-administrators, or remove co-admins.
- Support step-by-step wizard navigation via `<TournamentWizardStepper />` and the "Save & Continue to Groups →" action.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Dashboard / Champions Fantasy Cup / Edit                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE TITLE:                                                                 │
│   [Badge: EDITING TOURNAMENT]  Champions Fantasy Cup                        │
│   Edit Tournament [Settings ⚙️]                                              │
│   Update tournament details, banner, scoring rules, and organizers          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-STEP WIZARD STEPPER:                                                      │
│   [1. Details (Active)] ─── [2. Groups] ─── [3. Schedule] ─── [4. Publish]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRE-POPULATED TOURNAMENT FORM:                                              │
│                                                                             │
│ [Card 1] BASIC INFORMATION & BANNER BRANDING                                │
│    Tournament Name *                                                        │
│    [ Champions Fantasy Cup 2024                                            ]│
│    Season *                                                                 │
│    [ 2024                                                                  ]│
│                                                                             │
│    Tournament Banner (Optional Branding)                                    │
│    TABS: [ 🎨 Presets Gallery ]  [ 📤 Upload Image ]  [ 🔗 Custom URL ]     │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ [Premier Stadium]  [Wembley Lights]  [Champions Arena]  [Emerald]... │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│    Banner Live Preview Card                                  [✕ Remove]     │
│                                                                             │
│ [Card 2] FPL CHIPS CONFIGURATION                                            │
│    ⚡ FPL Chips Configuration                                                │
│    [Armchair] Bench Boost                       [ENABLED]      [Toggle]     │
│    Bench points count fully towards match score when played.                │
│    ───────────────────────────────────────────────────────────────────────  │
│    [Crown] Triple Captain                       [ENABLED]      [Toggle]     │
│    Triple Captain multiplier (3x) counts fully towards match score.         │
│                                                                             │
│ [Card 3] TOURNAMENT ADMINISTRATORS                              [+ Add]     │
│    👥 Tournament Admins (2)                                                 │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ 👑 John Doe (Gunners XI)   #123456   [Primary Admin]                 │ │
│    ├──────────────────────────────────────────────────────────────────────┤ │
│    │ 🛡️ Jane Smith (Reds FC)    #789012   [Make Primary]  [🗑️ Remove]     │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [✓ Validation Alert: 2 configured administrators. Primary: John Doe]         │
│                                                                             │
│ [ ✨ Save & Continue to Groups → ]      [ Save Changes ]      [ Cancel ]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Form Specifications

### 3.1 Breadcrumbs & Step Header
- **Breadcrumb Trail:** `Dashboard` (links to `/admin`) `/` `{tournament.name}` (links to `/admin/tournaments/${id}`) `/` `Edit`.
- **Eyebrow Badge:** Outline badge in Premier Purple (`border-[#37003C]/30 bg-[#37003C]/5 text-[#37003C]`) reading `EDITING TOURNAMENT`.
- **Title (H1):** `text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F]` with `Settings` icon.
- **Wizard Stepper (`TournamentWizardStepper`):** Displays current step as 1 with active indicator, showing direct clickable links to Step 2 (Groups), Step 3 (Schedule), and Step 4 (Publish) for existing tournaments.

### 3.2 Basic Metadata & Banner Picker
- **Tournament Title:** Pre-populated text input with existing name.
- **Season Number:** Numeric input pre-populated with tournament season.
- **Banner Customization Suite (`TOURNAMENT_BANNERS`):**
  - **Presets Tab:** Grid of 6 vector stadium themes (`premier-stadium.svg`, `wembley-floodlights.svg`, `champions-arena.svg`, `emerald-pitch.svg`, `neon-fantasy.svg`, `trophy-glory.svg`).
  - **Upload Tab:** Direct client-side uploader to `/api/admin/upload` with instant thumbnail generation and error messaging.
  - **Custom URL Tab:** Remote image link input with live preview.
  - **Banner Preview Display:** Shows currently selected banner with responsive aspect ratio, dark gradient overlay, and a remove button (`X`).

### 3.3 FPL Chip Rules Switches
- **Bench Boost Switch:**
  - Reflects active `allowBenchBoost` boolean.
  - Explains whether bench scores are added or discarded.
- **Triple Captain Switch:**
  - Reflects active `allowTripleCaptain` boolean.
  - Explains whether captain scores receive a 3x multiplier or are limited to 2x.

### 3.4 Multi-Admin Organization Panel
- Displays all registered tournament organizers sorted with the primary admin at the top.
- Each admin row displays:
  - Role Badge: Gold crown `👑 Primary Admin` or Shield `🛡️ Co-Admin`.
  - Manager Name & FPL Team Name.
  - FPL Entry ID (`#123456`).
- **Interactive Controls:**
  - **Make Primary Button:** Reassigns the primary organizer role (`handleSetPrimary`).
  - **Remove Admin Button (`Trash2`):** Deletes a co-admin (disabled if only 1 admin exists).
  - **Add Co-Admin Button (`UserPlus`):** Expands inline `<FPLVerifier />` to verify and append another organizer account.

### 3.5 Action Buttons
- **Primary ("Save & Continue to Groups →"):** Deep Premier Purple button with Fantasy Green sparkle (`Sparkles`), setting `submitAction = "next_step"`. Updates database and routes directly to `/admin/tournaments/${id}/groups?wizard=true`.
- **Secondary ("Save Changes"):** Outlined button saving changes and routing back to the Tournament Hub (`/admin/tournaments/${id}`).
- **Cancel Button:** Reverts unsaved changes and redirects to the Tournament Hub.

---

## 4. Technical Logic & Server Mutation

### 4.1 Server Data Loading
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
    banner: banner || null,
    adminFplId: primaryAdmin.fplId,
    admins,
    allowBenchBoost,
    allowTripleCaptain,
  }),
});
```

### 4.3 Database Synchronization Lifecycle
1. Updates the `Tournament` record with new name, season, banner, and chip settings.
2. Synchronizes the `TournamentAdmin` table: deletes removed co-admins, inserts newly verified co-admins, and updates `isPrimary` flags.
3. If chip rules were modified, existing match scores remain intact until an admin triggers recalculation in the Schedule Builder.

---

## 5. Responsive Behavior & Validation Rules

- **Mobile Viewports (< 640px):** Preset banner selector adopts a 2-column layout. Wizard stepper collapses to icons and active title. Action buttons expand to full width.
- **Desktop (>= 640px):** Centered inside `max-w-4xl`. Preset banners render in a 3-column grid.
- **Validation Rules:**
  - Prevents removing the sole remaining administrator.
  - Requires tournament name and valid season number.
  - Handles image upload errors gracefully (file size limits, unsupported formats).
