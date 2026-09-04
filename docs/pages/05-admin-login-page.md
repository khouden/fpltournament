# Page 05: Admin Login & Authentication Portal

> **Route:** `/admin/login`  
> **Source File:** `app/admin/login/page.tsx`  
> **Access Level:** Public / Unauthenticated Guest  
> **Design Theme:** FPL-Inspired Minimal Administrative Theme (`#F7F7F7` page, `#37003C` Deep Premier Purple, `#5A0A63`, `#00FF87` Green Accent)  

---

## 1. Page Overview

The **Admin Login Page** is the secure authentication gateway to the platform's administrative back-office. It provides tournament owners and administrators with a high-trust, minimal, FPL-branded portal to sign in, oversee tournaments, manage multi-admin permissions, and configure FPL data synchronization.

### Target Personas
- **👑 Platform Owner (Super Admin):** Logging in to oversee tournaments, configure global settings, and generate fixture schedules.
- **🛡️ Tournament Admin:** Managing assigned tournaments, editing schedules, and reviewing scores.

### Security Architecture
- Password-based authentication using hashed credentials via server action `loginAction()`.
- Server-side session verification via secure, HTTP-only cookie (`admin_session`).
- Protected by Next.js Edge Middleware (`middleware.ts`), which automatically redirects unauthenticated requests targeting `/admin/*` to `/admin/login` and redirects authenticated sessions from `/admin/login` to `/admin`.

---

## 2. UI & Visual Architecture

### 2.1 Aesthetic & Design System Alignment
Adhering to the platform's global Premier League aesthetic with restrained administrative gravity:
- **Background:** Clean `#F7F7F7` canvas with subtle atmospheric ambient gradients (`#37003C` at 4% opacity, `#00FF87` at 3% opacity) and low-opacity decorative pitch geometry.
- **Card Container:** Pure white surface (`bg-white`) with fine border (`#E5E5E5`), `rounded-2xl`, and balanced `shadow-fpl-md`.
- **Brand Palette:**
  - Deep Premier Purple: `#37003C` (Primary CTA & Brand Mark)
  - Secondary Purple: `#5A0A63` (Hover & Sub-accents)
  - Fantasy Green: `#00FF87` (Status dot indicator & security badge)
  - Neutral Text: `#1F1F1F` (Headings/Inputs), `#666666` (Subtitles/Labels)

### 2.2 Layout Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                ┌───────────────────────┐                │
│                │      [🏆 Icon]🟢      │                │
│                │    ADMINISTRATION     │                │
│                │    Fantasy Leagues    │                │
│                │  Admin Access Portal  │                │
│                ├───────────────────────┤                │
│                │ Welcome back          │                │
│                │ Sign in to manage...  │                │
│                │                       │                │
│                │ [Alert if error]      │                │
│                │                       │                │
│                │ Email address:        │                │
│                │ [admin@tournament.loc]│                │
│                │                       │                │
│                │ Password:             │                │
│                │ [••••••••••••] [👁]   │                │
│                │                       │                │
│                │ [   Log in Button  ]  │                │
│                │                       │                │
│                │ 🛡️ Authorized admins  │                │
│                └───────────────────────┘                │
│                                                         │
│               © Fantasy Leagues Admin                   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Portal Brand Header
- **Icon Avatar:** Deep purple container (`h-13 w-13 rounded-2xl bg-[#37003C] text-white shadow-md border border-[#5A0A63]/25`) with a `Trophy` icon and live status green indicator dot (`bg-[#00FF87]`).
- **Category Badge:** Subdued uppercase badge `ADMINISTRATION` (`text-[10px] font-bold text-[#5A0A63] bg-[#37003C]/5 px-2.5 py-0.5 rounded-full`).
- **Card Title:** `text-2xl sm:text-[28px] font-black text-[#1F1F1F]` reading `Fantasy Leagues`.
- **Card Subtitle:** `text-xs sm:text-sm font-medium text-[#666666]` reading `Admin Access Portal`.

### 3.2 Authentication Form & Card
- **Card Container:** Centered `max-w-[440px]` shell with smooth entrance animation (`animate-fpl-slide-up`).
- **Card Header:** "Welcome back" with descriptive subtitle "Sign in to manage your fantasy tournaments."
- **Email Field:**
  - Label: `Label htmlFor="email"` ("Email address")
  - Input: `Input type="email"` with placeholder `admin@tournament.local`, `autoComplete="email"`, required validation.
  - Disabled during submission.
- **Password Field:**
  - Label: `Label htmlFor="password"` ("Password")
  - Input: `Input type={showPassword ? "text" : "password"}` with placeholder `••••••••`, `autoComplete="current-password"`, required validation.
  - Show/Hide Password Toggle: Accessible button with `Eye` / `EyeOff` icon and `aria-label`.
  - Disabled during submission.
- **Submit Button:**
  - Full-width button (`w-full h-12 font-bold bg-[#37003C] hover:bg-[#5A0A63]`).
  - Active state: `active:scale-[0.99]`.
  - Loading state: `Loader2` animated spinner, button text changes to `Logging in...`, disabled to prevent duplicate submissions.
- **Security Micro-copy:**
  - Subdued trust footer within the card: Shield icon + `"Authorized administrators only · Secure encrypted session"`.

### 3.3 Error Notification Callout
- When authentication fails, a destructive Shadcn alert renders above the input fields:
  ```tsx
  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900 animate-fpl-fade-in py-3 px-3.5 rounded-xl shadow-xs">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertTitle>Authentication Failed</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
  ```

---

## 4. Technical Specifications & Authentication Flow

### 4.1 Client-Side Submission Workflow
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const result = await loginAction(email, password);

    if (result.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(result.error || "Login failed");
    }
  } catch (err) {
    setError("An error occurred. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

### 4.2 Middleware Route Guard (`middleware.ts`)
```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = request.cookies.get("admin_session");
    if (!session || !session.value) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
```

---

## 5. Responsive Behavior

- **Mobile Viewports (< 640px):** Form occupies 100% of available width with `px-4 py-8` margins, centered vertically in the viewport without horizontal overflow.
- **Desktop Viewports (>= 640px):** Form is strictly constrained to `max-w-[440px]` with elevated drop shadow (`shadow-fpl-md`), comfortable padding (`p-8`), and balanced vertical centering.

---

## 6. Edge Cases & Resilience

1. **Incorrect Password or Email:**
   - Displays clear error message (`"Invalid email or password"`) without revealing whether the email account exists.
2. **Network/Server Timeout:**
   - Caught in `try/catch` block, restoring the submit button and showing `"An error occurred. Please try again."`.
3. **Session Already Exists:**
   - Middleware automatically redirects authenticated admins to `/admin`.
