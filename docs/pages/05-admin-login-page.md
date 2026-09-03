# Page 05: Admin Login & Authentication Portal

> **Route:** `/admin/login`  
> **Source File:** `app/admin/login/page.tsx`  
> **Access Level:** Public / Unauthenticated Guest  
> **Design Theme:** Clean Light Administrative Theme (`from-blue-50 to-indigo-100`)  

---

## 1. Page Overview

The **Admin Login Page** is the secure authentication gateway to the platform's administrative back-office. It provides application owners with a protected portal to sign in, create tournaments, manage multi-admin structures, and configure FPL data synchronization.

### Target Personas
- **👑 Platform Owner (Super Admin):** Logging in to oversee tournaments, configure settings, and generate fixture schedules.

### Security Architecture
- Password-based authentication using hashed credentials.
- Server-side session verification via secure, HTTP-only cookie (`admin_session`).
- Protected by Next.js Edge Middleware (`middleware.ts`), which automatically redirects unauthenticated requests targeting `/admin/*` to `/admin/login`.

---

## 2. UI & Visual Architecture

### 2.1 Aesthetic Shift (Light Mode)
Unlike the public dark cosmic theme, the administrative section transitions to an ultra-clean, high-readability **Light Mode**:
- **Background:** Soft gradient mesh: `bg-gradient-to-br from-blue-50 to-indigo-100`.
- **Card Container:** Pristine white card with pronounced elevation: `bg-white shadow-xl border border-gray-200 rounded-xl`.
- **Primary Accents:** Royal Indigo (`bg-indigo-600 hover:bg-indigo-700`).

### 2.2 Layout Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                ┌───────────────────────┐                │
│                │      [🏆 Icon]        │                │
│                │    Fantasy Leagues    │                │
│                │  Admin Access Portal  │                │
│                ├───────────────────────┤                │
│                │ [Alert if error]      │                │
│                │                       │                │
│                │ Email Address:        │                │
│                │ [admin@tournament.loc]│                │
│                │                       │                │
│                │ Password:             │                │
│                │ [••••••••••••]        │                │
│                │                       │                │
│                │ [   Login Button   ]  │                │
│                └───────────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory & Interactive Elements

### 3.1 Portal Brand Header
- **Icon Avatar:** Rounded indigo container (`h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600`) featuring `Trophy` icon.
- **Card Title:** `text-2xl font-bold text-gray-900` reading `Fantasy Leagues`.
- **Card Subtitle:** `text-gray-600` reading `Admin Access Portal`.

### 3.2 Authentication Form
- **Email Field:**
  - Label: `Label htmlFor="email"`
  - Input: `Input type="email"` with placeholder `admin@tournament.local`, required validation.
  - Disabled during submission.
- **Password Field:**
  - Label: `Label htmlFor="password"`
  - Input: `Input type="password"` with placeholder `••••••••`, required validation.
  - Disabled during submission.
- **Submit Button:**
  - Full-width button (`w-full font-semibold`).
  - Active state: Indigo background with white text.
  - Loading state: `Loader2` animated spinner, button text changes to `Logging in...`, button is disabled to prevent duplicate submissions.

### 3.3 Error Notification Callout
- If authentication fails, a destructive Shadcn alert renders above the input fields:
  ```tsx
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
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

- **Mobile Viewports (< 640px):** Form occupies 100% of available width with `px-4` margins, centered vertically in the viewport.
- **Desktop Viewports (>= 640px):** Form is strictly constrained to `max-w-md` (448px) with elevated drop shadow (`shadow-xl`).

---

## 6. Edge Cases & Resilience

1. **Incorrect Password or Email:**
   - Displays clear error message (`"Invalid email or password"`) without revealing whether the email exists.
2. **Network Timeout:**
   - Caught in `try/catch` block, restoring the submit button and showing `"An error occurred. Please try again."`.
3. **Session Already Exists:**
   - If an authenticated admin visits `/admin/login`, navigating to `/admin` immediately restores the active session.
