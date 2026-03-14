# Fieldpiece Digital

**Multi-tenant HVAC intelligence and service platform**

Fieldpiece Digital extends Fieldpiece's trusted tool brand into software — turning field service events and measurement data into a platform for technicians, HVAC service companies, and Fieldpiece's internal operations team.

---

## Architecture Overview

### Multi-Tenant Model
- Each HVAC service company is an isolated **tenant**
- All data tables include `tenant_id` with Row Level Security enforced at the database level
- Fieldpiece operates the platform centrally — internal users have elevated access via platform roles
- Tenant data is never cross-accessible except by authorized platform users

### Role System
| Role | Type | Access |
|------|------|--------|
| `platform_super_admin` | Fieldpiece Internal | Full platform access, all tenants |
| `platform_support_admin` | Fieldpiece Internal | Support console, impersonation |
| `platform_support_agent` | Fieldpiece Internal | Limited support views |
| `company_admin` | Tenant | Full tenant access |
| `dispatcher` | Tenant | Jobs, scheduling |
| `technician` | Tenant | Assigned jobs, readings |

### Application Zones
1. `/` → redirects to `/dashboard` (tenant users) or `/admin/platform` (platform users)
2. `/(app)/` — Tenant application: jobs, equipment, customers, team, settings
3. `/(admin)/` — Fieldpiece internal console: tenants, users, support, audit logs, impersonation, feature flags
4. `/(auth)/` — Login, forgot password, reset password, invite acceptance

### Impersonation Safeguards
- Impersonation requires a written business reason (minimum 20 chars)
- Two-step confirmation UI before session starts
- Session is recorded in `impersonation_sessions` (immutable)
- All actions during impersonation are flagged in `audit_logs` with `impersonated_by`
- Orange banner shown during active session with one-click end button

### AI Diagnostic Architecture
- `lib/diagnostics/rules-engine.ts` — Rules-based MVP engine (works offline, no API needed)
- `lib/ai/diagnostic-engine.ts` — Abstraction layer; delegates to rules engine by default, or Claude when `AI_DIAGNOSTICS` feature flag is enabled and `ANTHROPIC_API_KEY` is set
- Diagnostic results stored in `diagnostic_results` table with source tracking

### Data Ingestion Architecture
- MVP: manual entry via job readings form
- Future: `POST /api/ingestion/v1/readings` endpoint for Fieldpiece device webhooks
- `lib/ingestion/normalizer.ts` handles unit conversion and validation
- Raw values preserved alongside normalized values for future reprocessing

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database / Auth**: Supabase (PostgreSQL + Row Level Security)
- **UI**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Email**: Resend
- **AI**: Anthropic SDK (Claude) — abstracted for future activation
- **Tests**: Vitest (unit) + Playwright (E2E)
- **Hosting**: Vercel

---

## Setup

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for emails)
- (Optional) [Anthropic API key](https://console.anthropic.com) for AI diagnostics

### 1. Clone and install

```bash
git clone <your-repo>
cd fpd
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase URL, anon key, service role key, and Resend API key.

### 3. Set up Supabase

In your Supabase project's SQL editor, run the migrations **in order**:

```
db/migrations/001_tenants.sql
db/migrations/002_users_memberships.sql
db/migrations/003_customers_sites.sql
db/migrations/004_equipment.sql
db/migrations/005_jobs.sql
db/migrations/006_readings.sql
db/migrations/007_diagnostics.sql
db/migrations/008_audit_logs.sql
db/rls/policies.sql
```

### 4. Load seed data (optional, for development)

Before running the seed, create these users in Supabase Auth (Dashboard → Authentication → Users):

| Email | Password | Role |
|-------|----------|------|
| `superadmin@fieldpiecedigital.com` | `FpdDemo2024!` | Platform Super Admin |
| `support@fieldpiecedigital.com` | `FpdDemo2024!` | Platform Support Admin |
| `owner@abchvac.com` | `FpdDemo2024!` | Company Admin |
| `dispatch@abchvac.com` | `FpdDemo2024!` | Dispatcher |
| `mike@abchvac.com` | `FpdDemo2024!` | Technician |
| `sarah@abchvac.com` | `FpdDemo2024!` | Technician |
| `david@abchvac.com` | `FpdDemo2024!` | Technician |

Then run `db/seed/dev-seed.sql` in Supabase's SQL editor.

### 5. Configure Supabase Auth

In Supabase → Authentication → URL Configuration:
- **Site URL**: `https://www.fieldpiecedigital.com` (or `http://localhost:3000` for local)
- **Redirect URLs**: `https://www.fieldpiecedigital.com/api/auth/callback`

Create an auth trigger to auto-insert profiles:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Testing

### Unit tests
```bash
npm test
# or with watch mode:
npm run test:watch
```

### E2E tests (requires running dev server + seed data)
```bash
npm run dev &
npm run test:e2e
```

---

## Deployment to Vercel

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example` in Vercel's project settings
4. Set custom domain: `www.fieldpiecedigital.com`
5. Configure Supabase Auth redirect URLs to include the production domain

**Required Vercel environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://www.fieldpiecedigital.com`
- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY` (optional)

---

## Resend Setup

1. Verify your domain at [resend.com](https://resend.com)
2. Add DNS records for `fieldpiecedigital.com`
3. Update `FROM_ADDRESS` in `lib/email/resend.ts` if using a different sending domain

---

## File Structure

```
app/
  (auth)/           # Login, forgot/reset password, invite acceptance
  (app)/            # Tenant user application
    dashboard/
    jobs/[id]/
    equipment/[id]/
    customers/
    team/
    settings/
  (admin)/          # Fieldpiece internal console
    platform/
    tenants/[id]/
    users/
    support/
    impersonation/
    audit-logs/
    feature-flags/
  api/
    auth/callback/  # Supabase auth callback
    ingestion/v1/   # Future device ingestion endpoint
components/
  layout/           # Sidebars, nav, logo, impersonation banner
  shared/           # MetricCard, StatusBadge, PageHeader
  ui/               # shadcn auto-generated components
lib/
  supabase/         # Browser + server clients
  auth/             # RBAC permission helpers
  ai/               # Diagnostic engine abstraction (AI-ready)
  diagnostics/      # Rules-based diagnostic engine
  ingestion/        # Reading normalization pipeline
  email/            # Resend helpers
types/              # TypeScript interfaces
db/
  migrations/       # SQL migration files (run in order)
  rls/              # Row Level Security policies
  seed/             # Development seed data
tests/unit/         # Vitest unit tests
e2e/                # Playwright E2E tests
```

---

## Recommended Next Enhancements

1. **Customer/Equipment creation forms** — Add UI to create customers, sites, and equipment
2. **Job creation form** — New job wizard with customer/equipment lookup
3. **User invitation flow** — Complete the invite → accept → setup flow with email
4. **Notifications** — Real-time updates using Supabase Realtime
5. **Analytics service** — Aggregate tenant usage for manager dashboards
6. **Weather enrichment** — ZIP-code based ambient condition data
7. **Mobile technician app** — Progressive Web App enhancements for field use
8. **AI diagnostics** — Activate `ai_diagnostics` feature flag with Anthropic API key
9. **Billing integration** — Stripe subscription integration using existing tenant plan fields
10. **Device ingestion** — Activate the `/api/ingestion/v1/readings` endpoint for Fieldpiece tools
