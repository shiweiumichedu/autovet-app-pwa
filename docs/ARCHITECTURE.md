# AutoVet App PWA - Architecture & Design Document

## 1. Overview

**AutoVet App** (`autovet.app`) is a multi-tenant Progressive Web Application (PWA) for inspection and vetting workflows. It shares the same foundational architecture as [roof-estimator-pro-pwa](https://github.com/shiweiumichedu/roof-estimator-pro-pwa) — including multi-tenant routing, phone+PIN authentication, user profile management, and PWA infrastructure — but with all roofing domain logic removed and replaced with a clean, extensible foundation.

### 1.1 Tenant Strategy

The app supports multiple verticals under a single domain via **path-based tenants**:

| Path | Tenant Slug | Description |
|------|-------------|-------------|
| `autovet.app/` or `autovet.app/auto` | `auto` (default) | Automobile vetting / pre-purchase inspection |
| `autovet.app/garage` | `garage` | Garage / mechanic shop inspection |
| `autovet.app/house` | `house` | House / property inspection |

- Default tenant (no path prefix or `/auto`) = automobile vetting
- Each tenant has its own branding, users, and workflow (via `categories` table)
- Tenants are detected from URL path, same pattern as roof-estimator-pro-pwa

### 1.2 What is Transferred from roof-estimator-pro-pwa
- **Multi-tenant system**: TenantContext, useTenant hook, path-based `/:tenant` routing
- **Phone + PIN authentication** with category/tenant-aware user lookup
- **User profile setup** and registration flow
- **Protected route pattern** (auth guard + profile completeness check)
- **PWA configuration** (offline support, install prompt, service worker)
- **Supabase client** integration pattern
- **Error boundary** pattern
- **Tailwind CSS** styling approach
- **Vite** build tooling

### 1.3 What is Removed / Not Transferred
- **Roofing domain**: No estimates, properties, roof polygons, materials, map views
- **Referral system**: No referral tracking, referral links, or referrant tracking
- **Third-party integrations**: No Google Maps, no EmailJS, no Capacitor/iOS
- **Complex PIN request flow**: Simplified to direct PIN verification (no "Text Me a PIN" request system)
- **Company themes/logos**: Simplified tenant branding (can be added later)
- **Admin dashboards**: No AdminDashboard, AdminUserList, AdminPinRequests (placeholder for future)

---

## 2. Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first CSS |
| Supabase JS | 2.x | Backend-as-a-service (auth, database) |
| React Router DOM | 7.x | Client-side routing |
| Lucide React | 0.344+ | Icon library |
| vite-plugin-pwa | 1.x | PWA service worker & manifest generation |

### 2.1 Supabase (Separate Project)
AutoVet uses its **own Supabase project** (separate from roof-estimator-pro-pwa) with:
- `categories` table (tenants)
- `users` table (with `category_id` foreign key)
- RPC functions for authentication & profile management
- Row Level Security policies
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 3. Project Structure

```
autovet-app-pwa/
├── docs/
│   └── ARCHITECTURE.md              # This document
├── database/
│   ├── schema.sql                   # Supabase schema: categories, users, functions, RLS
│   └── add_inspection_tables.sql    # Inspection workflow migration: tables, RPC, seed data
├── public/
│   ├── icon-192.png                 # PWA icon 192x192
│   ├── icon-512.png                 # PWA icon 512x512
│   ├── icon-180.png                 # Apple touch icon
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx        # React error boundary
│   │   ├── LoginForm.tsx            # Phone + PIN login form (tenant-aware)
│   │   ├── ProtectedRoute.tsx       # Auth-only route guard (tenant-aware)
│   │   ├── ProtectedRouteWithProfile.tsx  # Auth + profile guard (tenant-aware)
│   │   ├── AccountModal.tsx         # User profile edit modal
│   │   ├── OfflineIndicator.tsx     # Offline status banner
│   │   ├── PhotoCapture.tsx         # Camera/photo upload component
│   │   ├── StepChecklist.tsx        # Checklist rendering with checkboxes + notes
│   │   ├── KnownIssueCard.tsx       # Known issue display with severity badge
│   │   └── InspectionProgress.tsx   # Step progress bar (1 of 7)
│   ├── contexts/
│   │   ├── TenantContext.ts         # Tenant context type definition
│   │   └── TenantContext.tsx        # Tenant provider (detects tenant from URL path)
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth state (tenant-aware, checks category)
│   │   ├── useTenant.ts            # Shorthand for useContext(TenantContext)
│   │   ├── useUserProfile.ts       # Profile CRUD (tenant-aware)
│   │   ├── useInspection.ts        # Inspection CRUD: create, load, update, complete
│   │   ├── useVehicleData.ts       # Vehicle known issues + step templates
│   │   └── usePhotoUpload.ts       # Photo upload/delete to Supabase Storage
│   ├── lib/
│   │   └── supabase.ts             # Supabase client initialization
│   ├── pages/
│   │   ├── Login.tsx               # Login page wrapper
│   │   ├── Registration.tsx        # Profile setup page
│   │   ├── Dashboard.tsx           # Main dashboard with inspection actions
│   │   ├── InspectionStart.tsx     # Vehicle info entry + known issues
│   │   ├── InspectionWizard.tsx    # Step-by-step inspection wizard
│   │   ├── InspectionSummary.tsx   # Review & decision page
│   │   └── InspectionHistory.tsx   # List of past inspections
│   ├── types/
│   │   ├── index.ts                # App-level type definitions
│   │   └── database.ts             # Supabase database types
│   ├── App.tsx                     # Root component with tenant + non-tenant routes
│   ├── main.tsx                    # Entry point + PWA init
│   ├── index.css                   # Global styles + Tailwind + PWA styles
│   └── vite-env.d.ts              # Vite type declarations
├── .env.example                    # Environment variable template
├── .gitignore
├── index.html                      # HTML entry point with PWA meta tags
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

---

## 4. Multi-Tenant Architecture

### 4.1 Tenant Detection Flow

```
URL Request
    │
    ▼
┌─────────────────────────────┐
│ TenantProvider (context)     │
│                              │
│ 1. Check localStorage        │
│    "lockedTenant"            │
│                              │
│ 2. Check URL path segment    │
│    /auto/... → "auto"        │
│    /garage/... → "garage"    │
│    /house/... → "house"      │
│                              │
│ 3. Fallback: "auto"          │
│    (default tenant)           │
└──────────────┬──────────────┘
               │
               ▼
         tenant = "auto" | "garage" | "house"
```

### 4.2 Known Tenants
Configured in `TenantContext.tsx`:
```typescript
const knownTenants = ['auto', 'garage', 'house']
```
- `auto` — Automobile pre-purchase inspection (default)
- `garage` — Garage / mechanic shop inspection (future)
- `house` — House / property inspection (future)

### 4.3 TenantContext
```typescript
// src/contexts/TenantContext.ts
interface TenantContextType {
  tenant: string | null    // 'auto', 'garage', 'house', or null during loading
  isLoading: boolean
}
```

### 4.4 TenantProvider
Adapted from `roof-estimator-pro-pwa/src/contexts/TenantContext.tsx`:
- Detects tenant from URL path (first segment)
- Falls back to `'auto'` as default tenant
- Supports locked tenant via `localStorage` for deep links
- Listens for URL changes (popstate + pushState/replaceState)
- No subdomain detection (autovet.app is single domain, path-based only)

### 4.5 useTenant Hook
```typescript
// src/hooks/useTenant.ts
export const useTenant = () => useContext(TenantContext)
// Returns: { tenant: string | null, isLoading: boolean }
```

---

## 5. Authentication Architecture

### 5.1 Auth Flow Diagram

```
┌────────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────────┐
│ /:tenant/login     │────>│  Enter Phone │────>│  Enter PIN  │────>│  Verify via RPC  │
│ or /login          │     │  Number      │     │  (6-digit)  │     │  (tenant-aware)  │
└────────────────────┘     └──────────────┘     └─────────────┘     └────────┬────────┘
                                                                              │
                                                       ┌──────────────────────┴───────────────────┐
                                                       │                                          │
                                                 ┌─────▼─────┐                            ┌──────▼──────┐
                                                 │  Success   │                            │   Failed    │
                                                 └─────┬─────┘                            └─────────────┘
                                                       │
                                             ┌─────────▼─────────┐
                                             │ Profile Complete?  │
                                             └─────────┬─────────┘
                                             Yes       │        No
                                         ┌─────────────┴───────────────┐
                                         │                             │
                                   ┌─────▼──────────┐         ┌───────▼──────────────┐
                                   │ /:tenant       │         │ /:tenant/registration │
                                   │ (dashboard)    │         └──────────────────────┘
                                   └────────────────┘
```

### 5.2 Auth State
Stored in `localStorage` under key `autovet-auth`:
```typescript
interface AuthState {
  isAuthenticated: boolean
  phoneNumber: string | null
  isAdmin: boolean         // true when accessLevel === 5
  accessLevel: number      // 1-5 (default: 2)
}
```

### 5.3 useAuth Hook (tenant-aware)
Adapted from `roof-estimator-pro-pwa/src/hooks/useAuth.ts`:
- On `login(phoneNumber)`:
  1. Gets current tenant from `useTenant()`
  2. Looks up `categories` table for the tenant's `category_id`
  3. Fetches user's `access_level` from `users` table filtered by phone + category_id
  4. Stores auth state in localStorage
- On `logout()`:
  - Clears auth state
  - Redirects to `/:tenant/login` or `/login`

### 5.4 PIN Verification
- User enters phone number and 6-digit PIN
- App calls Supabase RPC `verify_user_category_access(p_phone, p_tenant)`
- Returns `{ can_access, pin, access_level, category_name, error_message }`
- Client-side PIN comparison (same as reference)
- 4-digit to 6-digit migration: "0000" -> "000000", other 4-digit PINs get "00" prefix

---

## 6. User Profile Architecture

### 6.1 UserProfile Type
```typescript
interface UserProfile {
  id: string
  phoneNumber: string
  firstname: string
  lastname: string
  homeAddress: string
  email: string
  pin: string
  access_level: number  // 1=ReadOnly, 2=Limited, 3=Standard, 4=Power, 5=Admin
  active: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 6.2 useUserProfile Hook (tenant-aware)
Adapted from `roof-estimator-pro-pwa/src/hooks/useUserProfile.ts`:
- `loadProfile()`: If tenant is provided, gets category_id first via RPC, then queries users by phone + category_id
- `saveProfile()`: Uses tenant-aware RPC `save_user_data_with_category` when tenant is present
- Falls back to direct query when no tenant

### 6.3 Profile Completeness Check
`ProtectedRouteWithProfile` redirects to `/:tenant/registration` if:
1. No `registration-completed-{phone}` flag in localStorage, AND
2. Profile is missing OR `firstname`/`lastname` are empty

### 6.4 AccountModal
Allows editing: first name, last name, home address, email, PIN.
Phone number is read-only. Simplified version without referral link features.

---

## 7. Routing Architecture

### 7.1 Route Table

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/` | `Dashboard` | `ProtectedRouteWithProfile` | Default tenant (auto) dashboard |
| `/login` | `Login` | None | Default tenant login |
| `/registration` | `Registration` | `ProtectedRoute` | Default tenant registration |
| `/dashboard` | `Dashboard` | `ProtectedRouteWithProfile` | Default tenant dashboard |
| `/:tenant/login` | `Login` | None | Tenant-specific login |
| `/:tenant/registration` | `Registration` | `ProtectedRoute` | Tenant-specific registration |
| `/:tenant` | `Dashboard` | `ProtectedRouteWithProfile` | Tenant root (dashboard) |
| `/:tenant/dashboard` | `Dashboard` | `ProtectedRouteWithProfile` | Tenant dashboard |
| `/:tenant/inspect` | `InspectionStart` | `ProtectedRouteWithProfile` | New inspection entry |
| `/:tenant/inspect/:id` | `InspectionWizard` | `ProtectedRouteWithProfile` | Step-by-step wizard |
| `/:tenant/inspect/:id/summary` | `InspectionSummary` | `ProtectedRouteWithProfile` | Review & decision |
| `/:tenant/inspections` | `InspectionHistory` | `ProtectedRouteWithProfile` | Past inspections |

### 7.2 Route Guards (tenant-aware)

**ProtectedRoute**:
- Checks `isAuthenticated`
- Redirects to `/:tenant/login` or `/login` based on current tenant

**ProtectedRouteWithProfile**:
- Extends ProtectedRoute
- Checks profile completeness
- Shows loading spinner while profile loads
- Redirects to `/:tenant/registration` if profile is incomplete

---

## 8. Database Schema

### 8.1 Categories Table (Tenants)
```sql
CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  subdomain     TEXT UNIQUE NOT NULL,  -- 'auto', 'garage', 'house'
  website_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default tenants
INSERT INTO categories (name, subdomain) VALUES
  ('AutoVet', 'auto'),
  ('AutoVet Garage', 'garage'),
  ('AutoVet House', 'house');
```

### 8.2 Users Table
```sql
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  TEXT NOT NULL,
  category_id   UUID NOT NULL REFERENCES categories(id),
  firstname     TEXT NOT NULL DEFAULT '',
  lastname      TEXT NOT NULL DEFAULT '',
  home_address  TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  pin           TEXT NOT NULL DEFAULT '000000',
  access_level  INTEGER NOT NULL DEFAULT 2,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone_number, category_id)  -- Same phone can exist in different tenants
);
```

### 8.3 RPC Functions

**get_category_id_by_tenant(p_tenant TEXT) -> UUID**
- Looks up `categories.id` by `subdomain` column
- Returns UUID of the matching category

**verify_user_category_access(p_phone TEXT, p_tenant TEXT) -> TABLE**
- Verifies user exists in the tenant's category
- Returns `{ can_access, pin, access_level, category_name, error_message }`

**save_user_data_with_category(p_phone_number, p_tenant, p_name, p_email, p_address, p_pin) -> UUID**
- Upserts user record for the given tenant/category
- Returns user ID

**get_user_by_phone(p_phone TEXT) -> TABLE**
- Returns user rows matching phone number

### 8.4 Row Level Security
- Enable RLS on both tables
- RPC functions use `SECURITY DEFINER` to bypass RLS
- Anonymous users can only access data through RPC functions
- Direct table access is restricted

---

## 9. PWA Architecture

### 9.1 Service Worker
Generated by `vite-plugin-pwa` with:
- Precache strategy for app shell assets
- Runtime caching for Supabase API calls
- Offline fallback

### 9.2 Web Manifest
```json
{
  "name": "AutoVet App",
  "short_name": "AutoVet",
  "description": "Vehicle and property inspection app",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 9.3 iOS/Android Support
- Apple touch icon meta tags
- `apple-mobile-web-app-capable` meta tags
- Safe area inset CSS handling
- Touch target minimum size (44px)
- Font size 16px on inputs (prevents iOS zoom)
- Install prompt handling (`beforeinstallprompt`)
- Pull-to-refresh prevention (`overscroll-behavior-y: contain`)

---

## 10. Component Architecture

```
App
├── ErrorBoundary
│   ├── TenantProvider
│   │   ├── OfflineIndicator
│   │   ├── Router
│   │   │   ├── /:tenant/login
│   │   │   │   └── Login
│   │   │   │       └── LoginForm
│   │   │   ├── /:tenant/registration
│   │   │   │   └── ProtectedRoute
│   │   │   │       └── Registration
│   │   │   ├── /:tenant/dashboard (or /:tenant)
│   │   │   │   └── ProtectedRouteWithProfile
│   │   │   │       └── Dashboard
│   │   │   │           └── AccountModal (conditional)
│   │   │   ├── /login (default tenant)
│   │   │   ├── /registration (default tenant)
│   │   │   └── / (default tenant dashboard)
```

---

## 11. State Management

No external state library. State is managed via:

1. **React Context** (`TenantContext`) for tenant detection
2. **Custom hooks** (`useAuth`, `useUserProfile`, `useTenant`) for domain state
3. **localStorage** for persistence across sessions:
   - `autovet-auth` — authentication state
   - `rememberedPhoneNumber` — saved phone for convenience
   - `registration-completed-{phone}` — registration completion flag
   - `lockedTenant` — locked tenant from deep link
   - `selectedTenant` — user-selected tenant

---

## 12. Environment Configuration

### .env Variables
```
VITE_SUPABASE_URL=https://your-autovet-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Commands
```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
```

---

## 13. Future Extension Points

The project is designed as a clean, multi-tenant foundation:

1. **New tenants**: Add to `knownTenants` array + seed `categories` table
2. **Tenant-specific pages**: Create pages in `src/pages/` with `/:tenant/` routes
3. **Tenant-specific workflows**: Each tenant can have different dashboards/features by checking `tenant` value
4. **New database tables**: Add in `database/` with tenant-aware `category_id` foreign key
5. **Admin features**: Check `accessLevel >= 5` in route guards; add admin pages per tenant
6. **Category branding**: Add `category_themes` table for per-tenant colors/logos (pattern exists in reference)

### Example: Adding a new tenant "fleet"
1. Add `'fleet'` to `knownTenants` in `TenantContext.tsx`
2. `INSERT INTO categories (name, subdomain) VALUES ('AutoVet Fleet', 'fleet');`
3. Users navigate to `autovet.app/fleet/login`
4. Create fleet-specific pages as needed

---

## 14. Comparison with roof-estimator-pro-pwa

| Aspect | roof-estimator-pro-pwa | autovet-app-pwa |
|--------|----------------------|-----------------|
| Domain | `myroofconnect.com` | `autovet.app` |
| Tenants | Path + subdomain based (`/mills`, `mills.myroofconnect.com`) | Path-based only (`/auto`, `/garage`, `/house`) |
| Default tenant | `root` | `auto` |
| Known tenants | root, mills, brightview, rooftech, renaissance, chiroofing | auto, garage, house |
| Auth | Phone+PIN with company check | Phone+PIN with category check |
| PIN request | "Text Me a PIN" → admin approval | Direct PIN entry only (simplified) |
| User profile | Name, address, email, PIN, referral notes | Name, address, email, PIN |
| Referrals | Full referral tracking system | None |
| Domain features | Estimates, maps, proposals, references, inspections | Clean slate (TBD per tenant) |
| Supabase | Shared project | Separate project |
| iOS native | Capacitor wrapper | PWA only |
| Category themes | Full theming system (logos, colors, CSS) | Minimal (extensible) |
| Admin | Full admin dashboard, user management, PIN requests | Placeholder |

---

## 15. Car Inspection Workflow (Auto Tenant)

### 15.1 Overview
The `auto` tenant implements a guided car inspection workflow. A user stands in front of a vehicle, enters its info, reviews known issues, walks through a step-by-step inspection with photo capture, and optionally generates a PDF report.

### 15.2 User Flow
```
Dashboard → [Start Inspection]
  → Step 1: Vehicle Info (year, make, model, trim, mileage, VIN) + known issues
  → Step 2: Wheels & Tires (checklist + photos)
  → Step 3: Exterior (checklist + photos)
  → Step 4: Interior (checklist + photos)
  → Step 5: Engine Bay (checklist + photos)
  → Step 6: Trunk & Undercarriage (checklist + photos)
  → Step 7: Test Drive Notes (free-text, no photos)
  → Summary & Decision (review all, rate, decide: Interested or Pass)
```

### 15.3 New Database Tables
| Table | Purpose |
|-------|---------|
| `inspections` | One row per inspection session with vehicle info, status, rating, decision |
| `inspection_steps` | One row per step per inspection (7 steps), stores checklist JSONB, notes, rating |
| `inspection_photos` | Photos per step (max 2), with `ai_analysis` / `ai_verdict` fields for external AI service |
| `vehicle_known_issues` | Pre-seeded reference data for known vehicle issues by make/model/year range |
| `inspection_step_templates` | Defines the 7 step templates with checklist items and instructions |

### 15.4 Photo & AI Architecture
- Photos are uploaded to Supabase Storage bucket `inspection-photos` at path `{inspection_id}/{step_number}/{photo_order}.jpg`
- The PWA captures and uploads photos only — it does NOT call AI
- A separate external AI service reads the DB, analyzes images, and writes back to `inspection_photos.ai_analysis` / `ai_verdict`

### 15.5 PDF Report
- Server-side via Supabase Edge Function (`POST /functions/v1/generate-inspection-report`)
- Takes `{ inspection_id }`, builds PDF, uploads to Storage, returns URL
- Deferred to separate deployment task; button is wired in the UI

### 15.6 New Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/:tenant/inspect` | `InspectionStart` | Vehicle info entry + known issues |
| `/:tenant/inspect/:id` | `InspectionWizard` | Step-by-step inspection wizard |
| `/:tenant/inspect/:id/summary` | `InspectionSummary` | Review & decision |
| `/:tenant/inspections` | `InspectionHistory` | List of past inspections |

### 15.7 New Components
| Component | Purpose |
|-----------|---------|
| `PhotoCapture` | Camera input with preview, upload to Storage, max 2 photos per step |
| `StepChecklist` | Checklist items with checkboxes and per-item notes |
| `KnownIssueCard` | Displays a known issue with severity badge |
| `InspectionProgress` | Step progress bar (1 of 7) |

### 15.8 New Hooks
| Hook | Purpose |
|------|---------|
| `useInspection` | CRUD: create, load, update step, complete inspection |
| `useVehicleData` | Fetch known issues by make/model/year, fetch step templates |
| `usePhotoUpload` | Upload/delete photos in Supabase Storage + DB records |

### 15.9 RPC Functions
| Function | Purpose |
|----------|---------|
| `create_inspection(...)` | Creates inspection + 7 step rows from templates |
| `get_inspection(id)` | Returns full inspection with steps and photos |
| `get_user_inspections(user_id, category_id)` | Lists user's inspections |
| `update_inspection_step(step_id, ...)` | Updates checklist, notes, rating, status |
| `complete_inspection(id, rating, decision, notes)` | Finalizes inspection |
| `get_vehicle_known_issues(make, model, year)` | Finds matching known issues |
| `get_inspection_step_templates()` | Returns active step templates |
