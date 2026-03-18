# Fieldpiece Digital — Product Requirements Document

## Executive Summary

Fieldpiece Digital is a modern, multi-tenant SaaS platform designed specifically for HVAC contractors to manage their field service operations. It provides a complete suite of tools for job scheduling, technician assignment, equipment diagnostics with AI-powered insights, invoicing, customer relationship management, and team collaboration. The platform is built for scalability with a robust platform admin console for managing multiple tenant companies, support staff coordination, and system-wide governance.

---

## 1. Application Overview & Purpose

**Product Name:** Fieldpiece Digital

**Primary Purpose:** A comprehensive field service management (FSM) and HVAC diagnostics platform that enables HVAC contractors to:
- Organize and dispatch work orders (jobs) to technicians
- Track service requests from customers
- Manage customer sites and equipment inventory
- Collect and analyze diagnostic readings from HVAC systems
- Generate and send invoices
- Collaborate across teams with role-based access
- Integrate with IoT devices and digital tools

**Target Users:**
- HVAC contracting companies (small to enterprise)
- Service technicians performing on-site repairs and maintenance
- Field dispatchers managing job assignments
- Company administrators overseeing operations
- Platform admins and support staff (Fieldpiece team)

**Key Value Propositions:**
- Real-time job dispatch and technician tracking
- Automated service request intake (web form, email)
- Rules-based and AI-powered diagnostics for HVAC equipment
- Quick invoice generation tied to jobs
- Full audit trail and compliance tracking
- Customizable email templates per contractor
- Impersonation support for customer support debugging

---

## 2. User Roles and Permissions

The system implements a hierarchical role model with both **platform roles** (for Fieldpiece staff) and **tenant roles** (for contractor companies).

### Platform Roles (Fieldpiece Staff)

These roles operate across the entire platform and are stored in the `profiles.platform_role` field.

#### `platform_super_admin`
- **Tier:** Highest
- **Scope:** Global platform control
- **Key Permissions:**
  - Full CRUD on all tenants (create, suspend, update plan/renewal date)
  - Invite and manage all platform users
  - Execute user impersonation with audit logging
  - Manage global feature flags
  - View all audit logs
  - Manage support cases and support team
  - Access platform admin console

#### `platform_support_admin`
- **Tier:** Senior support
- **Scope:** Support team leadership
- **Key Permissions:**
  - Assign/manage support agents
  - Manage support cases (resolve, reassign, close)
  - View support case comments
  - Execute user impersonation
  - Manage assignment queue (assign service requests to tenants)
  - Reassign customers between tenants
  - View audit logs
  - Cannot manage feature flags or suspend tenants (those need super admin)

#### `platform_support_agent`
- **Tier:** Basic support
- **Scope:** Day-to-day support work
- **Key Permissions:**
  - View and respond to support cases
  - View support case comments
  - Cannot reassign cases or impersonate users
  - Cannot manage feature flags

### Tenant Roles (HVAC Contractor Staff)

These roles exist per tenant and are stored in `memberships.role`. A user may belong to one tenant.

#### `company_admin`
- **Tier:** Highest within tenant
- **Scope:** Full company control
- **Key Permissions:**
  - Create, update, and archive jobs
  - Assign technicians to jobs
  - Create and send invoices
  - Create and edit customers and sites
  - Register and manage equipment
  - Invite team members (other company_admin, dispatcher, technician)
  - View and edit team members
  - Customize company email templates
  - Update company settings (slug, branding, timezone)
  - View company audit logs
  - Generate and use API keys for device integrations

#### `dispatcher`
- **Tier:** Operations manager
- **Scope:** Job lifecycle management
- **Key Permissions:**
  - Create jobs (assign status and technician)
  - Update job status (unassigned → assigned → in_progress → paused → completed)
  - View all jobs (filtered by date, status, priority)
  - View job details including customer, site, equipment, and readings
  - View technician names and availability
  - Cannot create customers or edit invoices
  - Cannot invite users or manage company settings

#### `technician`
- **Tier:** Field worker
- **Scope:** Personal job execution
- **Key Permissions:**
  - View only jobs assigned to them
  - Update status of assigned jobs
  - Record readings and diagnostics for jobs
  - View customer and site info for assigned jobs
  - Submit readings via mobile device (via API)
  - Cannot create jobs, customers, or invoices
  - Cannot view other technicians' jobs

### Permission Model

The system enforces permissions through:
1. **Middleware** — Redirects unauthenticated users to login
2. **Server-side authorization** — Checked in server components and API routes
3. **Client-side guards** — UI elements hidden/disabled based on role
4. **Row-level security (RLS)** — Supabase policies prevent direct DB access outside permissions

Role hierarchy for escalation checks:
```
technician < dispatcher < company_admin < platform_support_agent < platform_support_admin < platform_super_admin
```

---

## 3. Tenant (HVAC Contractor) Features

### 3.1 Dashboard & Analytics

**Purpose:** High-level view of company operations for admins and dispatchers.

**Features:**
- Key metrics: total jobs, pending assignments, jobs in progress, completed jobs this week/month
- Charts and graphs (powered by Recharts)
  - Job completion rate over time
  - Technician utilization
  - Service category breakdown
  - Priority distribution
- Quick filters to drill into specific data
- Recent activity feed (new jobs, completed jobs, team updates)
- Alerts for critical issues (overdue jobs, technician overload, etc.)

---

### 3.2 Jobs Management

**Purpose:** Core operational feature — manage the complete lifecycle of service jobs.

**Job Entity Fields:**
- `job_number` — Auto-generated unique identifier (e.g., "JOB-2026-0001")
- `customer_id` — Reference to customer record
- `site_id` — Reference to service location
- `assigned_technician_id` — Optional reference to technician profile
- `service_category` — Type of service (maintenance, repair, installation, inspection, emergency, warranty, estimate, other)
- `priority` — low | normal | high | emergency
- `problem_description` — Customer-reported issue or scope of work
- `resolution_summary` — Technician's summary after completion
- `scheduled_at` — Expected or planned start time
- `started_at` — Timestamp when technician begins work
- `completed_at` — Timestamp when job marked as completed
- `status` — unassigned | assigned | in_progress | paused | completed | cancelled
- `follow_up_required` — Boolean flag for follow-up needs
- `follow_up_notes` — Notes on required follow-up
- `notes` — Internal company notes

**Job Lifecycle:**
1. **Unassigned** — Job created but no technician assigned
2. **Assigned** — Technician assigned; awaiting start
3. **In Progress** — Technician actively working
4. **Paused** — Temporarily halted (waiting for parts, etc.)
5. **Completed** — Work finished; resolution summary recorded
6. **Cancelled** — Job cancelled (e.g., customer reschedule, no-show)

**Key Features:**
- **Job Creation** — Dispatchers/admins create new jobs with customer, site, service type, priority, and optional technician assignment
- **Job Assignment** — Assign or reassign technicians; triggers email notification to customer with technician details
- **Status Transitions** — Update job status as work progresses; system timestamps transitions
- **Filtering & Search** — Filter by status, date range, priority, customer, technician, service category
- **Job Detail View** — Full job context including customer info, site details, assigned equipment, readings, diagnostics, and invoices
- **Job Map View** — Map-based visualization of job locations (via Leaflet)
- **Email Notifications** — Auto-send emails when job assigned or completed

---

### 3.3 Customers & Sites

**Purpose:** Organize the companies/individuals and locations that the contractor serves.

**Customer Entity:**
- `name` — Customer company or individual name
- `email` — Primary contact email
- `phone` — Primary contact phone
- `customer_type` — residential | commercial | industrial
- `notes` — Internal notes

**Site Entity:**
- `customer_id` — Reference to customer (many sites per customer)
- `name` — Site name (e.g., "Main Office," "Building A")
- `address_line1`, `address_line2`, `city`, `state`, `zip`, `country`
- `latitude`, `longitude` — GPS coordinates for map display
- `site_type` — residential | commercial | industrial
- `climate_zone` — Optional climate zone (e.g., "humid subtropical" for diagnostics context)
- `notes` — Site-specific notes (building characteristics, access restrictions, etc.)

**Key Features:**
- **Customer Directory** — Searchable list of all customers with contact info
- **Site Management** — Add/edit/view multiple sites per customer
- **Location Tracking** — Geocoding and map display for technician routing
- **Customer History** — View all jobs, equipment, and readings associated with customer
- **Bulk Operations** — Merge duplicate customers, update site info (company-admin only)

---

### 3.4 Equipment & Diagnostics

**Purpose:** Maintain inventory of HVAC equipment and track system health via readings and diagnostics.

**Equipment Entity:**
- `tenant_id`, `site_id`, `customer_id` — References for proper scoping
- `manufacturer` — Equipment brand
- `model_number`, `serial_number` — Identification
- `unit_name` — Optional user-friendly name (e.g., "Upstairs Unit")
- `unit_type` — split_ac | heat_pump | package_unit | mini_split | furnace | boiler | chiller | air_handler | condenser | rooftop_unit | other
- `location` — indoor | outdoor | both
- `refrigerant_type` — R-410A, R-22, R-32, R-454B, R-407C, R-134a, R-404A, Other
- `tonnage`, `capacity_btu` — Cooling/heating capacity
- `install_date`, `warranty_expiry`, `warranty_notes` — Maintenance scheduling
- `status` — active | retired | decommissioned
- `notes` — Custom notes (e.g., known issues)

**Diagnostic System:**
- **Reading Types** — Predefined measurement types (suction pressure, discharge pressure, superheat, delta T, voltage, leak indicator, etc.)
- **Readings** — Individual data points captured during job work
  - `value` — Numeric value (e.g., 65 PSI)
  - `bool_value` — Boolean value (e.g., leak detected: true)
  - `text_value` — Text value (e.g., compressor model)
  - `unit` — Measurement unit (PSI, °F, V, etc.)
  - `source` — manual | device | import | api
  - `is_flagged` — Technician can flag anomalies
  - `flag_reason` — Why flagged (anomaly description)
  - `refrigerant_type` — For R-value-specific diagnostics
- **Rules Engine** — Predefined diagnostic rules evaluate readings:
  - Low refrigerant (suction pressure < 55 PSI)
  - High discharge pressure (> 280 PSI)
  - Low superheat (< 8°F) — flooding risk
  - High superheat (> 25°F) — undercharged
  - Low airflow delta T (< 12°F)
  - Refrigerant leak detected
  - Low supply voltage (< 200V)
- **Diagnostic Alerts** — System auto-generates alerts based on rules:
  - Severity levels: info | warning | critical
  - Includes description and recommended actions
  - Shown in job detail view
  - Can be AI-enriched (see section 3.4.1)

**Key Features:**
- **Equipment Registry** — Add/edit HVAC units at each site
- **Warranty Tracking** — Flag expiring warranties
- **Reading Capture** — Technicians record readings during jobs (manual, device, API)
- **Diagnostic Insights** — Auto-generated alerts from readings
- **Compliance** — EPA 608 refrigerant handling notes

#### 3.4.1 AI-Ready Diagnostics

**Purpose:** Enhance diagnostic accuracy with Claude AI analysis (future/in-progress feature).

**Architecture:**
- Rules engine runs first (deterministic, fast)
- Results passed to Claude for contextual enrichment
- AI can:
  - Cross-reference multiple readings for hidden issues
  - Suggest preventive actions based on trends
  - Identify rare or compound problems
- Responses include confidence scores
- All AI-generated diagnostics are attributed to source: 'ai'

**Implementation:**
- `/lib/ai/diagnostic-engine.ts` — Integration with Anthropic SDK
- Feature-flagged for gradual rollout
- Fallback to rules engine if AI unavailable
- Audit logged for compliance

---

### 3.5 Readings & Data Ingestion

**Purpose:** Accept equipment readings from field technicians or IoT devices; normalize and validate data.

**Ingestion Endpoint:**
- `POST /api/ingestion/v1/readings`
- Secured via API key authentication (stored hashed in `api_keys` table)
- Accepts readings from mobile devices, scanners, IoT systems
- Rate-limited per tenant

**Data Flow:**
1. Device/app submits readings with headers:
   - `X-API-Key` — Tenant's API key
   - `X-Tenant-Id` — Tenant UUID
2. System validates key, verifies job ownership
3. Readings normalized via `normalizeReadings()` function
4. Invalid readings rejected with error details
5. Valid readings inserted into `readings` table
6. Audit logged

**Reading Format:**
```json
{
  "job_id": "uuid",
  "equipment_id": "uuid (optional)",
  "technician_id": "uuid",
  "readings": [
    { "key": "suction_pressure", "value": 65, "unit": "PSI" },
    { "key": "discharge_pressure", "value": 250, "unit": "PSI" },
    { "key": "superheat", "value": 12, "unit": "°F" },
    { "key": "leak_indicator", "bool_value": false }
  ]
}
```

**Key Features:**
- **API Key Management** — Company admins can generate/revoke keys in settings
- **Validation** — Type checking, range validation, unit verification
- **Normalization** — Handle various device formats (JSON, CSV, custom)
- **Audit Trail** — Every ingestion recorded with technician, device, count of readings
- **Error Reporting** — Detailed response indicating which readings failed and why

---

### 3.6 Invoicing

**Purpose:** Generate, customize, and track invoices tied to jobs.

**Invoice Entity:**
- `invoice_number` — Auto-generated (e.g., "INV-2026-0042")
- `job_id` — Reference to job (optional; can invoice outside jobs)
- `customer_id` — Reference to customer
- `status` — draft | sent | paid | void
- `line_items` — JSON array of items:
  ```json
  [
    { "description": "Compressor Replacement", "qty": 1, "unit_price": 1500, "total": 1500 },
    { "description": "Labor (4 hrs @ $75/hr)", "qty": 4, "unit_price": 75, "total": 300 }
  ]
  ```
- `subtotal` — Sum of line items
- `tax_rate` — Tax percentage (decimal: 0.08 for 8%)
- `tax_amount` — Calculated tax
- `total` — Subtotal + tax
- `notes` — Payment terms, thank you message, etc.
- `due_date` — Payment deadline
- `paid_at` — When marked paid
- `created_at`, `updated_at`

**Key Features:**
- **Quick Invoice** — Admins build invoice from job data, add line items
- **Draft & Review** — Save drafts before sending
- **Status Tracking** — Mark invoices sent, paid, or void
- **Print/PDF** — Download invoice for printing or email
- **Email Send** — Auto-send invoice to customer with customized template
- **Payment Tracking** — Record payment date and method

---

### 3.7 Team Management

**Purpose:** Manage contractor staff, roles, permissions, and invitations.

**Features:**
- **User Invite** — Company admin sends invite link; user sets password
- **Role Assignment** — Assign role (company_admin, dispatcher, technician) at invite
- **User Directory** — View all team members with role, email, last login
- **Deactivate Users** — Soft-disable accounts (preserve audit trail)
- **Activity Tracking** — See when team members last logged in
- **Permissions Enforcement** — Role-based access automatically enforced

**Invite Flow:**
1. Company admin enters user email, name, role
2. System generates magic link (via Supabase Auth)
3. Email sent with link to join company
4. User sets password; automatically added to membership
5. Audit logged

---

### 3.8 Email Templates & Communication

**Purpose:** Customize outbound emails to match company branding and messaging.

**Built-in Template Types:**
- **Job Assigned** — Sent to customer when technician assigned; includes tech name, schedule, contact
- **Job Completed** — Sent to customer on job completion; includes summary, tech name, next steps
- **Invoice Sent** — Sent to customer with invoice attached or link
- **Service Request Confirmation** — Auto-response when customer submits web form
- **Team Invitation** — Sent when user invited to join company

**Customization:**
- Company admins edit template subject and HTML body
- Template editor with rich text formatting (Tiptap)
- Preview before saving
- Fallback to platform defaults if not customized
- Per-tenant storage in `email_templates` table

**Delivery:**
- Via Resend email service
- From: `Fieldpiece Digital <noreply@fieldpiecedigital.com>` (with optional override)
- HTML formatted with Fieldpiece branding
- Auto-linked tracking (Resend feature)

---

### 3.9 Service Requests

**Purpose:** Intake customer requests (web form, email) and convert to jobs.

**Service Request Entity:**
- `contact_name`, `contact_email`, `contact_phone` — Customer info
- `subject`, `description` — Request summary
- `address` — Service location
- `source` — email | web_form | manual
- `status` — new | acknowledged | converted | spam | closed
- `job_id` — Link to created job (when converted)
- `auto_response_sent_at` — Timestamp of auto-response email
- `raw_payload` — Original submission data (for audit)

**Web Form:**
- Public URL: `/request-service`
- Pre-fill form via `slug` parameter for tenant-specific landing
- Submit creates service request
- Auto-response email sent
- Platform admin assigns to tenant in assignment queue

**Email Intake:**
- Incoming email webhook (via Resend inbound routes)
- Parsed into service request
- Stored for manual review by support team

**Key Features:**
- **Smart Matching** — System tries to match email to existing customer by address/email
- **Assignment Queue** — Support team assigns unmatched requests to tenants
- **Conversion** — Create job from service request with one click
- **Spam Filter** — Mark obvious spam to prevent clutter
- **Auto-Response** — Confirm receipt with templated email

---

### 3.10 Settings & Configuration

**Purpose:** Company-level settings and integrations.

**Settings Available:**
- **Company Profile** — Name, slug, timezone, phone, address, branding (logo, primary color)
- **Email Templates** — Customize outgoing emails (see section 3.8)
- **API Keys** — Generate and revoke API keys for device integrations
- **Billing** — Subscription plan, seat limit, renewal date (read-only for contractors; managed by platform admin)
- **Audit Log** — View immutable log of all company actions (company_admin only)
- **Service Request Links** — Copy public URL for embedding service request form on website

---

## 4. Platform Admin Console Features

The platform admin console is accessible only to platform users (super admin, support admin, support agent) and provides system-wide management and oversight.

### 4.1 Tenant Management

**Purpose:** Manage contractor companies on the platform.

**Tenant List:**
- Table view of all tenants
- Columns: company name, status, plan, onboarding status, location, creation date
- Search/filter by name, status, plan
- Pagination for large lists

**Tenant Detail Page:**
- Company info: name, slug, address, timezone, website, phone
- Subscription: plan tier, seat limit, renewal date, status
- Onboarding status: pending | in_progress | complete
- Internal notes (admin-only)
- Logo and branding preview
- Actions:
  - Edit company info
  - Update plan/seat limit (super admin only)
  - Suspend/activate (super admin only)
  - View company members and jobs
  - View company audit logs

**Tenant Status Lifecycle:**
- **Active** — Normal operation; paying or trial
- **Trial** — Time-limited free access (30 days default)
- **Suspended** — Accounts frozen; no access (payment issue, ToS violation)
- **Cancelled** — Archived; data retained for compliance

**Tenant Plans:**
- **Trial** — 30-day free access; all features; up to 5 users
- **Starter** — $99/mo; up to 10 users; core features
- **Professional** — $299/mo; up to 25 users; advanced features
- **Business** — $799/mo; up to 100 users; custom integrations
- **Enterprise** — Custom pricing; unlimited users; dedicated support

---

### 4.2 User Management

**Purpose:** Manage all platform and tenant users.

**User List (Platform Admin Only):**
- Filter by role, status, tenant, last login
- Search by email, name
- Columns: email, name, role, status, last login, created date

**User Detail Page:**
- Profile: email, name, phone, avatar
- Platform role (if applicable) or tenant role (if applicable)
- Active status
- Last sign-in date
- Actions:
  - Edit profile (name, phone, role)
  - Change role (only by higher-ranked admin)
  - Deactivate/reactivate
  - Trigger password reset
  - Start impersonation (with reason)
  - View user's audit trail

---

### 4.3 Impersonation & Support

**Purpose:** Safe, audited user impersonation for troubleshooting and support.

**Impersonation Controls:**
- **Initiation** — Support admin selects user and enters business reason
- **Session** — Support admin logs in as user; UI indicates "impersonation mode" prominently
- **Audit** — Every action taken while impersonating is logged with impersonation_session_id
- **Termination** — Admin clicks "end impersonation"; session marked ended with timestamp
- **Access** — Only accessible to super admin and support admin roles

**Impersonation Session Entity:**
- `initiated_by` — Admin's user ID
- `target_user_id` — User being impersonated
- `target_tenant_id` — Tenant context (optional)
- `reason` — Mandatory reason (logged for audit)
- `status` — active | ended
- `started_at`, `ended_at`

**Safety Measures:**
- Visual banner in UI during impersonation
- Cannot impersonate another admin
- All audit logs include impersonation session ID
- Impersonation sessions immutable and queryable

---

### 4.4 Audit Logs

**Purpose:** Immutable audit trail for compliance, debugging, and security.

**Audit Log Entry:**
- `action` — Action type (e.g., "job.created", "user.invited", "tenant.suspended")
- `actor_id`, `actor_email` — Who performed the action
- `impersonated_by` — If action was under impersonation
- `resource_type` — Type of resource affected (job, user, tenant, customer, etc.)
- `resource_id`, `resource_label` — Which specific resource
- `metadata` — Additional context (JSON)
- `ip_address`, `user_agent` — Request metadata
- `created_at` — Timestamp (immutable)

**Audit Log Viewer (Platform Admin):**
- Query by date range, actor, action, resource, tenant
- Filter by severity (critical actions highlighted)
- Export to CSV
- Search by resource ID or label
- Show before/after values for updates

**Supported Actions:**
- User: invited, updated, deactivated
- Tenant: created, updated, suspended, plan_changed
- Job: created, status_updated, technician_assigned, completed, cancelled
- Invoice: created, status_updated, sent, paid, void
- Readings: submitted, flagged
- Equipment: added, updated, decommissioned
- Customer: created, updated, reassigned_tenant
- Service Request: assigned, acknowledged, spam, closed
- Settings: changed
- Impersonation: started, ended
- Feature flags: changed

---

### 4.5 Feature Flags

**Purpose:** Control feature rollout globally and per-tenant.

**Global Platform Flags:**
- Toggle on/off for all tenants
- Example flags:
  - `ai_diagnostics_enabled` — Enable Claude AI diagnostic enrichment
  - `advanced_reporting` — Enable advanced analytics
  - `webhook_integrations` — Enable third-party webhooks
  - `mobile_app_beta` — Beta access to mobile app
  - `api_v2` — New API endpoints

**Per-Tenant Overrides:**
- Allow/disallow specific features for specific tenants
- Override global settings
- Used for beta testing with selected contractors

**Flag Management:**
- Super admin only
- UI to toggle flags and set per-tenant overrides
- Audit logged
- Checked at runtime via Supabase policies

---

### 4.6 Support Console & Cases

**Purpose:** Manage customer support tickets and team coordination.

**Support Case Entity:**
- `tenant_id` — Which contractor submitted the case
- `reported_by` — User who reported the issue (optional)
- `assigned_to` — Support agent assigned to resolve
- `subject` — Issue summary
- `description` — Full details
- `page_url` — URL where issue occurred (for debugging)
- `status` — open | in_progress | resolved | closed
- `priority` — low | medium | high | critical
- `created_at`, `updated_at`

**Support Case Comments:**
- `case_id` — Reference to case
- `author_id` — Staff member commenting
- `body` — Comment text (supports Markdown)
- `is_internal` — Boolean (internal notes not shown to contractor)
- `created_at`

**Support Console Dashboard:**
- **Open Cases** — Active cases requiring attention (priority-sorted)
- **Recent Cases** — All cases (any status) sorted by date
- **Case Detail** — Full case with comments thread, assignment, status controls
- **Search** — Find cases by subject, tenant, reporter
- **Quick Actions:** Assign, change priority, change status, close, reopen

---

### 4.7 Assignment Queue

**Purpose:** Route unmatched service requests to tenants and manage customer reassignments.

**Unmatched Service Requests:**
- Requests received without a clear tenant match
- Web form submissions without pre-selected tenant
- Inbound emails with no linked customer
- Listed with contact info, description, date received

**Assignment Actions:**
- **Assign to Tenant** — Select target tenant; system auto-matches customer if email/address match
- **Mark Spam** — Dismiss obvious spam
- **Mark Closed** — Request handled externally; skip assignment

**Customer Reassignment:**
- Move customer between tenants
- Reassigns customer, all sites, equipment, and open jobs
- Completed jobs remain in original tenant for historical accuracy
- Audit logged with from/to tenant info

---

## 5. Public-Facing Features

### 5.1 Service Request Web Form

**URL:** `/request-service[/slug]`

**Purpose:** Allow customers to submit service requests directly without contractor account.

**Form Fields:**
- Contact name (required)
- Contact email (required)
- Contact phone (optional)
- Subject (required)
- Description (required)
- Address (optional)
- Service type dropdown (optional; if slug provided, pre-selects contractor)

**Behavior:**
- Public, no authentication required
- If accessed with contractor slug (e.g., `/request-service/acme-hvac`), pre-associate with that contractor
- On submit, creates service_request record
- Sends auto-response email to contact
- Displayed in assignment queue for platform admin to review
- Can be converted to job by support team

**Branding:**
- Company logo and primary color shown (if slug provided)
- Fieldpiece branding in footer
- Responsive design (mobile-friendly)

---

## 6. Data Model & Key Relationships

### Core Entities

```
Tenants
├── name, slug, plan, status, timezone, branding
└── Related: profiles (members), customers, jobs, equipment, etc.

Profiles (Users)
├── email, name, phone, is_platform_user, platform_role
└── Related: memberships, audit_logs (as actor)

Memberships (Tenant Assignments)
├── user_id, tenant_id, role, is_active
└── Links profiles to tenants with role

Customers
├── tenant_id, name, email, phone, type
└── Related: sites, equipment, jobs, service_requests

Sites
├── tenant_id, customer_id, address, coordinates, type
└── Related: equipment, jobs

Equipment
├── tenant_id, site_id, customer_id, manufacturer, model, serial, type, status
└── Related: readings, job_equipment

Jobs
├── tenant_id, customer_id, site_id, assigned_technician_id
├── job_number, status, priority, service_category
├── scheduled_at, started_at, completed_at
└── Related: readings, invoices, job_equipment, audit_logs

Readings
├── job_id, equipment_id, technician_id
├── reading_type_id, value, unit, source
├── is_flagged, flag_reason
└── Related: diagnostic_results

Invoices
├── job_id, customer_id, invoice_number
├── line_items (JSON), subtotal, tax_amount, total
├── status, paid_at, due_date
└── Related: jobs

Service Requests
├── tenant_id (nullable), customer_id (nullable)
├── contact_name, contact_email, contact_phone
├── description, address, source
├── status, job_id (if converted)

Audit Logs (Immutable)
├── action, actor_id, actor_email
├── resource_type, resource_id, resource_label
├── metadata (JSON), ip_address, user_agent
├── impersonation_session_id (if under impersonation)

Impersonation Sessions
├── initiated_by, target_user_id, target_tenant_id
├── reason, status, started_at, ended_at

Feature Flags
├── platform_feature_flags — Global settings
├── tenant_feature_flags — Per-tenant overrides

Diagnostic Rules & Results
├── diagnostic_rules — Rule definitions with conditions
├── diagnostic_results — Results of rule/AI evaluation for jobs

Email Templates
├── tenant_id, key, subject, html_body

API Keys
├── tenant_id, key_hash (SHA-256), label, last_used_at, revoked_at
```

### Key Relationships

- **Tenant → Profiles** — One tenant can have many profiles (team members) via memberships
- **Profile → Membership** — One profile can belong to one tenant
- **Customer → Sites** — One customer can have many sites
- **Site → Equipment** — One site can have many equipment units
- **Job → Equipment** — Many-to-many via job_equipment join table
- **Job → Readings** — One job can have many readings
- **Readings → Diagnostic Results** — One reading can trigger many diagnostic alerts
- **Tenant → Service Requests** — Service requests unassigned until matched to tenant

---

## 7. Integrations

### 7.1 Authentication (Supabase Auth)

- Magic link login (passwordless) and email/password
- Session management via Supabase SSR helpers
- Middleware refreshes session on each request
- Profile data stored in separate `profiles` table
- Audit logs track login/logout events

### 7.2 Email Service (Resend)

- Transactional email provider
- Outbound emails:
  - Invitations (magic link)
  - Password resets
  - Job assignments
  - Job completion notifications
  - Invoice delivery
  - Service request confirmations
- Email templates customizable per tenant
- Webhooks available for bounce/complaint handling (future)

### 7.3 Inbound Email (Resend Inbound Routes)

- Route incoming emails to `/api/email/inbound`
- Parse email body/attachments
- Create service request
- Stores raw payload for audit

### 7.4 IoT & Device Integrations

- **REST API** — `/api/ingestion/v1/readings`
- **Authentication** — API key (tenant-specific, SHA-256 hashed)
- **Payload Format** — JSON with job_id, equipment_id, readings array
- **Rate Limiting** — Per-tenant (future; currently no limits)
- **Supported Devices** — Any device that can HTTP POST JSON (HVAC testing tools, smart sensors, mobile apps)

### 7.5 Anthropic AI (Claude)

- **SDK** — `@anthropic-ai/sdk`
- **Use Cases:**
  - Diagnostic enrichment (analyze readings, suggest root causes)
  - Invoice summaries (auto-generate resolution descriptions)
  - Customer communication (draft emails)
- **Implementation** — `/lib/ai/diagnostic-engine.ts`
- **Feature Flag** — `ai_diagnostics_enabled`
- **Cost** — Haiku model for fast/cheap tasks, Sonnet for main analysis
- **Safety** — All AI outputs audit-logged; no sensitive data sent

---

## 8. Tech Stack

### Frontend
- **Framework:** Next.js 16+ (App Router)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 + `cn()` utility (clsx + tailwind-merge)
- **Components:** Shadcn/ui (New York style)
- **Forms:** React Hook Form + Zod validation
- **Rich Text Editor:** Tiptap (for email templates, notes)
- **Maps:** Leaflet + React Leaflet
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner toasts
- **Command Palette:** Cmdk

### Backend & Infrastructure
- **Runtime:** Node.js
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth
- **ORM/Client:** Supabase JS SDK
- **API Routes:** Next.js API Routes (NextRequest/NextResponse)
- **Deployment:** Vercel

### External Services
- **Email:** Resend
- **Webhooks:** Svix (for webhook verification, future)
- **AI:** Anthropic Claude API

### Testing
- **Unit Tests:** Vitest + @testing-library/react
- **E2E Tests:** Playwright
- **Test Data:** Custom fixtures + seeding

### Development Tools
- **Linting:** ESLint 9
- **Package Manager:** npm
- **Version Control:** Git

---

## 9. Non-Functional Requirements

### Performance
- Page load time < 2s for typical page
- Search/filter results < 500ms
- API endpoint response < 1s (including DB query)
- Support 10,000+ jobs per tenant
- Map rendering for 100+ job locations

### Scalability
- Multi-tenant SaaS architecture
- Row-level security (RLS) in Supabase
- Connection pooling for DB
- Stateless API design
- CDN-ready (Vercel Edge Functions for future)
- Support future growth to 10,000+ contractor companies

### Security
- End-to-end TLS/SSL
- Password hashing (bcrypt via Supabase)
- API key hashing (SHA-256)
- Row-level security policies
- Input validation (Zod schemas)
- CSRF protection (SameSite cookies)
- Rate limiting (future implementation)
- Audit logging for all sensitive operations
- No sensitive data logged (no passwords, API keys in plain text)
- Impersonation requires business reason and full audit trail

### Reliability & Availability
- 99.5% uptime SLA (Vercel + Supabase commitment)
- Automated backups (Supabase standard)
- Redundant infrastructure (Vercel Edge)
- Graceful error handling with user-friendly messages
- Fallback UI if feature flags fail
- Email delivery retry logic

### Compliance & Audit
- Immutable audit logs for all actions
- Timestamp on every audit entry
- Retention: 7 years (configurable)
- GDPR compliance: data export, deletion (future)
- SOC 2 Type II certification (roadmap)
- Accessibility: WCAG 2.1 AA (progressive)

### Maintainability
- TypeScript strict mode
- Consistent code style (ESLint)
- Server components by default
- Clear separation of concerns
- Centralized types and utilities
- Comprehensive error handling

### Disaster Recovery
- Database snapshots (Supabase automated)
- Git version control
- Rollback capability via Vercel deployments
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 15 minutes

---

## 10. Roadmap & Future Features

### Phase 2 (Q2 2026)
- Mobile app (React Native) for technician field work
- Advanced reporting & business intelligence
- Integration with QuickBooks for invoicing sync
- SMS notifications for job alerts
- Predictive maintenance insights (ML-based)

### Phase 3 (Q3 2026)
- Automated job scheduling optimization (route optimization)
- Customer self-service portal (view job status, invoices)
- Integration with Slack for team notifications
- Warranty tracking and recall management
- Custom branding for white-label resellers

### Phase 4 (Q4 2026 & Beyond)
- International expansion (multi-language, multi-currency)
- Webhook marketplace for third-party integrations
- Advanced role-based access control (custom roles)
- Compliance modules (EPA 608, DOT, industry-specific)
- Integration with smart thermostats and building automation systems

---

## Appendix: Key Abbreviations

- **FSM** — Field Service Management
- **HVAC** — Heating, Ventilation, and Air Conditioning
- **RLS** — Row-Level Security
- **SLA** — Service Level Agreement
- **RBAC** — Role-Based Access Control
- **ToS** — Terms of Service
- **RTO** — Recovery Time Objective
- **RPO** — Recovery Point Objective
- **ORM** — Object-Relational Mapping
- **SSR** — Server-Side Rendering
- **API** — Application Programming Interface
- **CSV** — Comma-Separated Values
- **JSON** — JavaScript Object Notation
- **EPA** — Environmental Protection Agency
- **PSI** — Pounds per Square Inch
- **BTU** — British Thermal Unit
- **UUID** — Universally Unique Identifier

---

**Document Version:** 1.0
**Date Generated:** 2026-03-18
**Status:** For Development & Stakeholder Review
**Last Updated By:** Claude Code (codebase analysis)
