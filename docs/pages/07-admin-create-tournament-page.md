# Page 07: Admin Create Tournament Wizard

> **Route:** `/admin/tournaments/new`  
> **Source File:** `app/admin/tournaments/new/page.tsx`  
> **Component Files:** `components/tournament-form.tsx`, `components/tournament-wizard-stepper.tsx`, `components/fpl-verifier.tsx`  
> **Access Level:** Admin Session Required  
> **Design Theme:** Global FPL Operational Design System (`bg-[#F7F7F7]`, primary `#37003C`, accents `#00FF87` and `#E9007F`, cards `bg-white border-[#E5E5E5]`)  

---

## 1. Page Overview

The **Create Tournament Page** is Step 1 of the guided 4-step tournament setup wizard. It enables tournament organizers to establish a new competition by defining core metadata, selecting a cinematic stadium banner, setting granular FPL chip scoring rules, and verifying the organizer's official Fantasy Premier League (FPL) account.

### Primary Responsibilities
- Collect tournament identification details (Tournament Name, Season).
- Select competition branding: Choose from 6 curated stadium preset SVG banners, upload custom artwork, or supply a remote image URL.
- Configure tournament-wide FPL chip policies (Bench Boost on/off, Triple Captain 3x vs 2x) with real-time rule explanations.
- Verify the **Primary Admin FPL account** via real-time FPL API validation to establish organizer identity.
- Optionally attach **Co-Admins** to aggregate leagues from multiple organizers without hitting FPL's 30-league limit.
- Provide fluid wizard navigation to transition directly into Step 2 (Groups & Teams) upon successful creation.

---

## 2. UI & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN NAVBAR: [🏆] Fantasy Leagues [ADMIN]      admin@test.com    [Logout]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGE HEADER:                                                                │
│   ← Back to Dashboard                                                       │
│   [Badge: STEP 1 OF 4: SETUP WIZARD]                                        │
│   Create Tournament [Trophy 🏆]                                             │
│   Configure competition identity, select a banner, and assign admins...    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4-STEP WIZARD STEPPER:                                                      │
│   [1. Details & Rules (Active)] ─── [2. Groups] ─── [3. Schedule] ─── [4. Publish]│
├─────────────────────────────────────────────────────────────────────────────┤
│ TOURNAMENT WIZARD FORM:                                                     │
│                                                                             │
│ [Card 1] BASIC INFORMATION & BANNER BRANDING                                │
│    Tournament Name *                                                        │
│    [ Premier League Fantasy Cup 2024                                       ]│
│    Season *                                                                 │
│    [ 2024                                                                  ]│
│                                                                             │
│    Tournament Banner (Optional Branding)                                    │
│    TABS: [ 🎨 Presets Gallery ]  [ 📤 Upload Image ]  [ 🔗 Custom URL ]     │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ [Premier Stadium]  [Wembley Lights]  [Champions Arena]  [Emerald]... │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│    Banner Live Preview Card                                                 │
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
│    👥 Tournament Admins (1)                                                 │
│    ℹ️ Why add multiple admins? Overcomes FPL league limits. All excluded.    │
│    ┌──────────────────────────────────────────────────────────────────────┐ │
│    │ 👑 John Doe (Gunners XI)   #123456   [Primary Admin]                 │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [✓ Validation Alert: 1 configured admin. Primary: John Doe]                 │
│                                                                             │
│ [ ✨ Create & Continue to Groups → ]      [ Save & Return to Dashboard ]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Form Specifications

### 3.1 Step Header & Wizard Stepper (`TournamentWizardStepper`)
- **Breadcrumb Back Link:** Outlined back button navigating directly to `/admin` with `ArrowLeft` icon.
- **Eyebrow Badge:** Deep Premier Purple badge reading `Step 1 of 4: Setup Wizard`.
- **Title Block:** `text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F]` with Trophy icon accented in Fantasy Green (`#00FF87`).
- **Interactive Stepper Bar:** Highlights Step 1 as current, displaying future steps (Groups, Schedule, Publish) in disabled state until tournament initialization completes.

### 3.2 Basic Tournament Metadata & Banner Selector
- **Tournament Name:** Text input with placeholder `e.g., Premier League Fantasy Cup 2024` (required).
- **Season:** Number input with range `2020` to `2100`, defaulting to current year.
- **Tournament Banner Selector (`TOURNAMENT_BANNERS`):**
  - **Tab 1: Presets Gallery:** Curated collection of 6 stadium-themed SVG illustrations:
    1. *Premier Stadium* (`/images/banners/premier-stadium.svg`)
    2. *Wembley Floodlights* (`/images/banners/wembley-floodlights.svg`)
    3. *Champions Arena* (`/images/banners/champions-arena.svg`)
    4. *Emerald Pitch* (`/images/banners/emerald-pitch.svg`)
    5. *Neon Fantasy* (`/images/banners/neon-fantasy.svg`)
    6. *Trophy Glory* (`/images/banners/trophy-glory.svg`)
  - **Tab 2: Upload Image:** Native file input integrated with `POST /api/admin/upload`, supporting PNG, JPEG, and WebP assets up to 5MB.
  - **Tab 3: Custom URL:** External image link input with live validation.
  - **Live Preview Container:** Visual aspect-ratio container (`h-32 sm:h-40 rounded-xl overflow-hidden`) showcasing the selected banner with a quick remove (`X` icon) button.

### 3.3 FPL Chips Configuration Panel
Card containing two independent toggles with contextual status pills:
1. **Bench Boost Switch (`allowBenchBoost`):**
   - *Enabled:* `bg-[#00FF87]/20 text-[#008744]` badge reading `ENABLED`. Bench points count fully toward match scores.
   - *Disabled:* `bg-[#FEE2E2] text-[#B91C1C]` badge reading `DISABLED`. Bench points are strictly excluded (only starting 11 count).
2. **Triple Captain Switch (`allowTripleCaptain`):**
   - *Enabled:* `bg-[#00FF87]/20 text-[#008744]` badge reading `ENABLED`. Triple Captain multiplier (3x) counts fully.
   - *Disabled:* `bg-[#FEF3C7] text-[#92400E]` badge reading `REDUCED (2x)`. Triple Captain is capped at standard double captain points.

### 3.4 Multi-Admin Configuration & FPL Verifier (`FPLVerifier`)
- **Organizer Verification Flow:**
  - Solves FPL's private league cap (managers can only enter a maximum number of private leagues).
  - Organizer inputs FPL Entry ID (e.g. `123456`) and clicks `Verify Primary Admin`.
  - Queries `GET /api/fpl/manager/{id}` to fetch manager name and team name.
  - Confirms organizer identity and registers them as `isPrimary: true`.
- **Co-Admin Addition (`showAddCoAdmin`):**
  - Once the Primary Admin is verified, the organizer can click `+ Add Co-Admin`.
  - Displays inline `FPLVerifier` allowing secondary organizers to be added.
- **Admin Exclusion Notice:**
  - Prominent banner explaining that all registered tournament administrators are automatically excluded from match scoring to maintain absolute sporting fairness.

### 3.5 Submission Actions
- **Primary Action ("Create & Continue to Groups →"):**
  - Styled in Deep Premier Purple (`bg-[#37003C] hover:bg-[#5A0A63] text-white`) with Fantasy Green sparkle icon (`Sparkles`).
  - Sets `submitAction = "next_step"`.
  - Upon creation, navigates straight to Step 2: `/admin/tournaments/${id}/groups?wizard=true`.
- **Secondary Action ("Save & Return to Dashboard"):**
  - Outlined button setting `submitAction = "save_exit"`.
  - Creates the tournament draft and redirects to `/admin`.

---

## 4. Technical Logic & API Integration

### 4.1 Form Submission Workflow
The form dispatches a JSON payload to `POST /api/admin/tournaments`:
```typescript
const response = await fetch("/api/admin/tournaments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name,
    season,
    banner: banner || null,
    adminFplId: primaryAdmin.fplId,
    admins, // Array<{ fplId, name, teamName, isPrimary }>
    allowBenchBoost,
    allowTripleCaptain,
  }),
});
```

### 4.2 Database Transaction Lifecycle
When submitted, Prisma executes an atomic transaction:
1. Creates the `Tournament` record in `DRAFT` status with configured banner and chip rules.
2. Creates entries in `TournamentAdmin` for all verified organizers.
3. Associates the primary admin's FPL Entry ID on the tournament root.
4. Returns `{ tournament: { id: "..." } }` to drive client-side routing.

---

## 5. Responsive Behavior & Validation Guards

- **Mobile (< 640px):** Preset banner grid reduces to 2 columns. Stepper shows short labels. Form buttons stack vertically with full width.
- **Desktop (>= 640px):** Centered inside `max-w-4xl`. Preset banners render in a 3-column responsive grid.
- **Validation Guards:**
  - Prevents submission if no FPL administrator is verified (`admins.length === 0`).
  - Blocks duplicate admin entry IDs with a dedicated alert.
  - Displays live API connectivity errors if FPL services are unreachable.
