# Mini CRM 360

> Comprehensive server-rendered CRM with marketing automation, social publishing, lead capture, reminders, billing, and HR tooling.

## Table of Contents
- [1) Product Overview](#1-product-overview)
- [2) Screens](#2-screens)
- [3) User Flows](#3-user-flows)
- [4) Tech Stack](#4-tech-stack)
- [5) Architecture & Code Structure](#5-architecture--code-structure)
- [6) Environment Configuration](#6-environment-configuration)
- [7) Database Documentation](#7-database-documentation)
- [8) API Reference](#8-api-reference)
- [9) Running Locally](#9-running-locally)
- [10) Deployment (Production)](#10-deployment-production)
- [11) Security Notes](#11-security-notes)
- [12) Troubleshooting & FAQ](#12-troubleshooting--faq)
- [13) Notes / Assumptions](#13-notes--assumptions)

---

## 1) Product Overview
Mini CRM 360 is a full-stack, server-rendered CRM and marketing platform built with Node.js/Express, Handlebars, and MySQL. It targets business users (owners/admins/agents) who need a unified workspace to:
- Manage customers, businesses, tasks, notes, reminders, and leads.
- Run WhatsApp/Email campaigns and publish to social channels from one page.
- Capture leads via public forms with analytics and a submissions viewer modal.
- Handle subscriptions/billing (Razorpay) with plan-based menu locking.
- Cover HR basics (employees, departments, designations, leave, documents).

Key modules: Customers, Businesses, Campaigns, Message Templates, Tasks/Notes, Reminders, Lead Forms & Submissions, Lead Records (tags/notes/tasks/audit), Social Publisher, Plans/Billing, HR, Profile/Settings.

## 2) Screens
(Server-rendered Handlebars views; routes in `src/routes`)
- `/login`, `/register` — Auth pages (activation-aware login).
- `/dashboard` — Main dashboard/metrics.
- `/profile` — Profile settings, avatar, sessions, billing, activity.
- `/business` — Business CRUD.
- `/customers` — Customer list + add/edit modal (DOB/anniversary fields).
- `/campaigns` — Campaign creation modal (business/template dropdowns).
- `/templates` — Unified Message Templates (Email/WhatsApp).
- `/tasks` — Task list; premium card UI for status tiles.
- `/notes` — Notes & timeline.
- `/reminders` — Birthday & anniversary reminders; sticky sidebar, pagination, bulk selection bar (Send WhatsApp/Email/Clear), “Send Wish” modal with template dropdown & loader, premium notifications.
- `/lead-forms` — Lead form builder list; create/edit/publish, embed/QR; submissions modal (search/sort/pagination/details).
- Public forms: `/forms/:slug` — Render published forms; submit via `/api/v1/forms/:slug/submit`.
- `/social-publisher` — Single-page publisher: sticky header, business selector, calendar/list toggle, connected account strip, connect CTA, templates/media drawers, scheduled posting via mock adapters.
- `/plans` — Plans page.
- `/admin` — Admin plans/menu locks.
- `/employees`, `/documents`, `/email-templates` — HR/docs/templates (present in code).

## 3) User Flows
- Auth → Activation-aware Login → Dashboard.
- Customers → Add/Edit (DOB/anniversary) → Reminders populate → Send Wish (email/WhatsApp) with template dropdown & loader.
- Reminders → Filter tab (All/Today/Birthdays/Anniversaries/Upcoming) → Select rows → Bulk bar (Send WhatsApp/Email/Clear) → Compose modal → Send (premium notification).
- Lead Forms → Create/Edit → Publish → Share public URL/QR → View Submissions modal (search/sort/page) → Lead records linked via submissionId (DB layer present).
- Social Publisher → Choose business → Accounts strip → Calendar/List → Create Post → Templates/Media drawers → Mock publish via BullMQ/DB fallback.
- Templates → Manage unified Email/WhatsApp templates → Used by Reminders and Campaigns.
- Billing → Plans → Razorpay create-order/verify (backend).
- Admin → Manage plans & menu locks.

## 4) Tech Stack
- **Frontend**: Handlebars, Bootstrap 5, Font Awesome, Vanilla JS, SortableJS (builder), Cropper.js (avatars), page-level premium CSS/JS.
- **Backend**: Node.js (ESM), Express 5.x, Sequelize (MySQL 8+), BullMQ (Redis) + DB fallback (Social Publisher), Multer, Nodemailer, PDFKit/Puppeteer, Razorpay SDK.
- **Auth**: JWT access/refresh, email activation, password reset, Google OAuth (in code), session tracking endpoints.
- **Integrations**: WhatsApp Cloud API (Graph), SMTP, Razorpay.
- **Tools**: dotenv (`property.env`), nodemon, csv-parser, Swagger config present, PM2-ready by convention.

## 5) Architecture & Code Structure
Flow: Request → Route (`src/routes`) → Controller (`src/controllers`) → Model/Service (`src/models`) → DB (Sequelize/MySQL) → View (`src/views`) or JSON.

Key folders:
- `src/app.js` Express app wiring.
- `src/routes` Route modules (auth/users, business, customers, campaigns, templates, tasks, notes, reminders, lead-forms, social-publisher, admin, billing, webhook).
- `src/controllers` Business logic (`reminder.controller.js`, `leadForm.controller.js`, `socialPublisher.controller.js`, etc.).
- `src/models` Sequelize models: users, businesses, customers, tasks, notes, lead_forms, form_submissions, lead_records, lead_tags, lead_tag_map, lead_notes, lead_tasks, lead_audit_logs, social_* tables, plans/menu_items, HR tables.
- `src/db/migrations` Custom idempotent migration scripts.
- `src/views` Handlebars pages with embedded JS/CSS.
- `public` Static assets/uploads.
- `property.env` Environment configuration.

Pattern: MVC with server-rendered views; associations in `src/models/index.js`.

## 6) Environment Configuration
All vars in `property.env` (required unless noted):
```env
NODE_ENV=development
PORT=3002

# DB (dev/stage)
DB_HOST_STAGE=localhost
DB_PORT_STAGE=3306
DB_NAME_STAGE=saas_whatsapp_manager
DB_USER_STAGE=root
DB_PASSWORD_STAGE=your_password

# DB (prod)
DB_HOST_PROD=...
DB_PORT_PROD=3306
DB_NAME_PROD=saas_whatsapp_manager
DB_USER_PROD=...
DB_PASSWORD_PROD=...

PRODUCTION_URL=https://yourdomain.com
DEVELOPMENT_URL=http://localhost:3002

JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
ACCESS_TOKEN_TTL=1d
REFRESH_TOKEN_TTL=7d
TOKEN_ENC_SECRET=your_32_byte_base64_encryption_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Your Name <your_email@gmail.com>"

# WhatsApp (optional)
META_APP_ID=...
META_APP_SECRET=...
META_GRAPH_VERSION=v20.0
WA_PHONE_NUMBER_ID=...
WABA_ID=...
WHATSAPP_TOKEN=...
WEBHOOK_VERIFY_TOKEN=...
APP_URL=https://yourdomain.com

# Razorpay (optional)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

CREATE_DB_IF_MISSING=false
SYNC_DB=false
```
Redis/BullMQ config not explicit; Social Publisher can fall back to DB scheduler.

## 7) Database Documentation
- DB: MySQL 8+, default `saas_whatsapp_manager`.
- Init: Run migrations (see section 9).
- Seed: `npm run create-admin` (optional).

Key tables (from models/migrations):
- Auth/Users: `users`, `user_sessions`, `activity_logs`.
- Business/CRM: `businesses`, `business_addresses`, `customers` (DOB/anniversary, tags JSON), `tasks`, `notes`, reminders (from customers).
- Lead capture: `lead_forms`, `form_submissions` (JSON, utm/referrer/ip/userAgent/status).
- Lead management: `lead_records` (links submissionId, businessId, customerId, assignedTo; status/priority/score/value/notes/customFields), `lead_tags`, `lead_tag_map`, `lead_notes`, `lead_tasks`, `lead_audit_logs`.
- Social Publisher: `social_accounts`, `social_posts`, `social_post_channels`, `social_templates`, `publish_attempts`, `social_audit_logs`, `media_assets`.
- Billing/Plans: `plans`, `user_plans`, `menu_items`, `plan_menu_items`.
- HR: `employees`, `departments`, `designations`, `services`, `leave_types`, `leave_requests`, `employee_documents`, `employee_education`, `employee_experience`.

Relations (high level):
- User hasMany Business/Customer/Task/Note/LeadForm/FormSubmission/LeadRecord/LeadTag/LeadNote/LeadTask/LeadAuditLog/SocialAccount/SocialPost/MediaAsset.
- LeadRecord belongsTo FormSubmission, Business, Customer, User(owner), User(assignedTo); belongsToMany LeadTag via LeadTagMap; hasMany LeadNote/LeadTask/LeadAuditLog.
- FormSubmission belongsTo LeadForm, Customer; hasOne LeadRecord.

## 8) API Reference (representative)
Auth  
- POST `/api/v1/users/register` — Register (public)  
- POST `/api/v1/users/login` — Login (activation-aware) (public)  
- POST `/api/v1/users/refresh` — Refresh (refresh token)  
- POST `/api/v1/users/logout` — Logout (auth)  
- POST `/api/v1/users/resend-activation` — Resend activation (public)  
- GET `/activate/:token` — Activate account (public)  

Profile  
- GET `/api/v1/profile` — Get profile (auth)  
- PUT `/api/v1/profile` — Update profile (auth)  
- POST `/api/v1/profile/avatar` — Upload avatar (auth)  
- POST `/api/v1/profile/change-password` — Change password (auth)  
- GET `/api/v1/profile/sessions` — List sessions (auth)  
- DELETE `/api/v1/profile/sessions/:sessionId` — Revoke (auth)  

Business  
- POST `/api/v1/business/create-business` — Create (auth)  
- GET `/api/v1/business/get-my-business` — List (auth)  
- PATCH `/api/v1/business/update-business/:id` — Update (auth)  
- DELETE `/api/v1/business/delete-business/:id` — Delete (auth)  

Customers  
- POST `/api/v1/customers` — Create/Update (auth)  
- GET `/api/v1/customers` — List (auth)  

Campaigns  
- POST `/api/v1/campaigns` — Create (auth)  
- GET `/api/v1/campaigns` — List (auth)  

Templates  
- POST `/api/v1/templates/meta` — Create Meta template (auth)  
- GET `/api/v1/templates/meta` — List Meta templates  
- POST `/api/v1/templates` — Save local template  
- GET `/api/v1/templates` — List local templates  
- `/templates` — UI  

Tasks  
- GET `/api/v1/tasks` — List (auth)  
- POST `/api/v1/tasks` — Create (auth)  
- PUT `/api/v1/tasks/:id` — Update (auth)  
- DELETE `/api/v1/tasks/:id` — Delete (auth)  

Notes  
- GET `/api/v1/notes` — List (auth)  
- POST `/api/v1/notes` — Create (auth)  
- PUT `/api/v1/notes/:id` — Update (auth)  
- DELETE `/api/v1/notes/:id` — Delete (auth)  

Reminders  
- GET `/api/v1/reminders` — List (auth)  
- POST `/api/v1/reminders` — Create (auth)  
- POST `/api/v1/reminders/bulk-send` — Bulk WhatsApp/Email (auth)  

Lead Forms & Submissions  
- GET `/api/v1/lead-forms` — List (auth)  
- POST `/api/v1/lead-forms` — Create (auth)  
- PUT `/api/v1/lead-forms/:id` — Update (auth)  
- DELETE `/api/v1/lead-forms/:id` — Delete (auth)  
- GET `/api/v1/lead-forms/:id/submissions` — List submissions with search/sort/pagination (auth)  
- GET `/lead-forms` — UI  
- GET `/forms/:slug` — Public form (no auth)  
- POST `/api/v1/forms/:slug/submit` — Submit (no auth)  

Social Publisher  
- GET `/social-publisher` — UI  
- GET `/api/v1/social/accounts` — List accounts (mock) (auth)  
- GET `/api/v1/social/posts` — List/scheduled posts (auth)  
- POST `/api/v1/social/posts` — Create/schedule (mock) (auth)  
- GET `/api/v1/social/templates` — List templates (auth)  
- POST `/api/v1/social/accounts` — Connect account (mock) (auth)  

Plans & Billing  
- GET `/api/v1/plans` — List plans (auth)  
- POST `/api/v1/payment/create-order` — Razorpay order (auth)  
- POST `/api/v1/payment/verify` — Verify payment (auth)  
- `/plans` — UI  

Admin  
- GET `/api/v1/admin/plans` — List plans (admin)  
- POST `/api/v1/admin/plans` — Create plan (admin)  
- PUT `/api/v1/admin/plans/:id` — Update plan (admin)  
- DELETE `/api/v1/admin/plans/:id` — Delete plan (admin)  
- GET `/api/v1/admin/menu-items` — List menu items (admin)  
- PUT `/api/v1/admin/menu-items/:menuItemId/plan/:planId/lock` — Toggle (admin)  
- `/admin` — UI  

Webhook & Health  
- GET `/api/v1/webhook` — WhatsApp verify  
- POST `/api/v1/webhook` — WhatsApp events  
- GET `/api/v1/health` — Health  

## 9) Running Locally
```bash
npm install
# create property.env (see env section) and set DB creds
# ensure MySQL running and database created: saas_whatsapp_manager

# run migrations (idempotent) in order:
npm run migrate:all-profile-columns
npm run migrate:activation-fields
npm run migrate:plans
npm run migrate:yearly-price
npm run migrate:menu-items
npm run migrate:plan-menu-items
npm run migrate:tasks
npm run migrate:notes
npm run migrate:reminders
npm run migrate:lead-forms
npm run migrate:enhance-lead-forms
npm run migrate:create-form-submissions
npm run migrate:add-updatedAt-to-form-submissions
npm run migrate:create-lead-records
npm run migrate:create-lead-tags
npm run migrate:create-lead-tag-map
npm run migrate:create-lead-notes
npm run migrate:create-lead-tasks
npm run migrate:create-lead-audit-logs
npm run migrate:create-social-publisher

# optional seed
npm run create-admin

# run dev
npm run dev   # http://localhost:3002
```
Node v14+ (ESM); v16+ recommended.

## 10) Deployment (Production)
- Set `NODE_ENV=production` and all prod env vars (DB/SMTP/JWT/Razorpay/WhatsApp).
- Start with `npm start` or PM2 (`pm2 start src/index.js --name mini-crm`).
- Reverse proxy via Nginx to `PORT` (default 3002); enable HTTPS.
- Configure webhook URLs for Razorpay/WhatsApp; set secrets.
- Logs: `pm2 logs mini-crm` (if using PM2); otherwise stdout.

## 11) Security Notes
- JWT access/refresh; activation required before login.
- Password hashing via bcrypt; reset tokens; activation tokens.
- Session tracking endpoints allow revocation.
- Plan/menu locks from DB-driven menu items.
- Keep secrets in `property.env`; do not commit.
- Validate webhooks with shared secrets; use HTTPS and CORS for your domain.

## 12) Troubleshooting & FAQ
1) DB connection refused — Check `DB_HOST_*`, user/pass, port 3306, and MySQL service.  
2) “Unknown column updatedAt in form_submissions” — Run `npm run migrate:add-updatedAt-to-form-submissions`.  
3) “Unknown column firstName in field list” on reminders — Ensure updated controller (uses `customer.name`).  
4) Reminders empty — Controller must return `data.reminders`; ensure `ApiResponse(200, { reminders })`.  
5) Duplicate `API_BASE` errors in views — Remove page-level duplicates; `API_BASE` is set globally in layout.  
6) QRCode not defined (lead-forms) — CDN load may fail; retry or rely on API fallback (implemented).  
7) Social Publisher empty accounts — Confirm `/api/v1/business` responds and `loadAccounts` parses `ApiResponse`.  
8) Campaign modal dropdowns empty — Ensure `loadBusinesses`, `loadMetaTemplates`, `loadEmailTemplates` are invoked on modal show and parse `ApiResponse`.  
9) WhatsApp/Email send fails — Verify SMTP/WhatsApp tokens in env; check controller logs.  
10) Port 3002 in use — Change `PORT` or stop existing process (`lsof -i :3002`).  
11) PM2/Nginx 502 — Ensure app running (`pm2 status`), correct upstream port, env set.  
12) Timezone offsets for reminders — DB timezone set to `+05:30`; align server/app TZ as needed.  

## 13) Notes / Assumptions
- BullMQ is referenced for Social Publisher scheduling; Redis config not explicit—DB fallback present.
- Social publishing uses mock adapters (LinkedIn/Facebook/X); no real provider keys included.
- HR/doc features exist in code but may be plan-locked.
- Public forms require `status='published'` and `isActive=true`; otherwise return not-available pages.

---

**Built with ❤️ using Node.js, Express.js, MySQL, and Handlebars.**
