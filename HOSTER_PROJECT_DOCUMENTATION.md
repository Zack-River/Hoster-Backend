# HOSTER - Multi-Channel Rental Management Platform
## Complete Project Documentation

---

**Project Name:** Hoster
**Platform Type:** SaaS (Subscription-Based)
**Application Type:** Progressive Web App (PWA), Mobile-First

---

## 1. PROJECT VISION & SCOPE

Hoster is a mobile-first Progressive Web App designed for solo short-term rental hosts. It centralizes management of multi-channel bookings, availability, and guest communications from platforms like Airbnb, Booking.com, Expedia, and TripAdvisor into a single, unified dashboard.

**Target Users:**
- Individual short-term rental hosts managing 1-50+ properties
- Cleaning service providers serving rental hosts
- Platform administrators overseeing the marketplace

**Business Model:** Subscription-based with three planned tiers:
- **Light** - Basic features for new hosts
- **Growth** - Expanded capabilities for growing portfolios
- **Expanding** - Full feature set for professional hosts

*Note: Subscription plan enforcement is defined in the database schema (`subscriptionPlan` field on users) but tier-based feature gating is not yet enforced in the application logic. All users currently have access to all features.*

---

## 2. SYSTEM ARCHITECTURE

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| UI Framework | TailwindCSS + Shadcn/ui |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Neon-backed) |
| ORM | Drizzle ORM |
| Authentication | Email/Password (bcrypt + express-session) |
| Frontend Router | Wouter |
| State Management | TanStack Query v5 |
| File Uploads | Multer |

### UI/UX Design System

| Element | Value |
|---------|-------|
| Primary Color | Coral/Rose `#FF385C` (HSL: 350 100% 61%) |
| Font | Nunito (configured via `--font-sans` CSS variable) |
| Mode | Light only |
| Design Inspiration | Airbnb-inspired warm palette |
| Layout | Mobile-first with bottom tab navigation |
| Navigation | Bottom tabs (Host Portal), Sidebar (Admin Panel), Bottom tabs (Provider Portal) |
| Backgrounds | Warm neutral grays |

### URL Structure & Routing

| URL Path | Portal | Description |
|----------|--------|-------------|
| `/` | Redirect | Redirects to `/hostapp` |
| `/hostapp` | Host Portal | Mobile PWA - main app for hosts |
| `/admin` | Admin Panel | Web dashboard for administrators |
| `/provider` | Provider Portal | Dashboard for cleaning providers |
| `/dev-portal` | Developer Portal | Channel API configuration tool |

Each portal uses wouter's `Router base` for routing isolation.

---

## 3. PORTALS & PAGES

### 3.1 Host Portal (`/hostapp`) - 20 Pages

The primary mobile-first PWA for rental hosts with bottom tab navigation.

#### Authentication Pages
| Page | Path | Description |
|------|------|-------------|
| Landing | `/hostapp` | Dark splash screen with app branding |
| Login | `/hostapp/login` | Email/password login form |
| Signup | `/hostapp/signup` | Host registration form (role: host) |

#### Main Navigation (Bottom Tabs)
| Tab | Path | Description |
|-----|------|-------------|
| Home | `/hostapp/` | Dashboard with stats, upcoming reservations, notifications |
| Calendar | `/hostapp/calendar` | Calendar view with date blocking/unblocking per listing |
| Inbox | `/hostapp/inbox` | Unified inbox aggregating messages from all channels |
| Settings | `/hostapp/settings` | Settings hub with sub-pages |

#### Settings Sub-Pages
| Page | Path | Description |
|------|------|-------------|
| Profile | `/hostapp/profile` | User profile with photo upload, company details |
| Listings | `/hostapp/settings/listings` | Property listing management |
| Templates | `/hostapp/settings/templates` | Message template editor |
| Reminders | `/hostapp/settings/reminders` | Notification reminder preferences |
| Cleaning | `/hostapp/settings/cleaning` | Cleaning marketplace - browse/subscribe to providers |
| Maintenance | `/hostapp/settings/maintenance` | Maintenance task management |
| Automation | `/hostapp/settings/automation` | Automated messaging configuration (3-step check-in flow) |
| Channels | `/hostapp/channels` | Channel connection management |

#### Additional Pages
| Page | Path | Description |
|------|------|-------------|
| Chat | `/hostapp/chat/:id` | Individual conversation view |
| Listing Detail | `/hostapp/listing/:id` | Detailed listing information |
| Notifications | `/hostapp/notifications` | Notification center |
| Community Questions | `/hostapp/community-questions` | Community Q&A section |
| Support Chat | `/hostapp/support-chat` | Direct support messaging with admin |

---

### 3.2 Admin Panel (`/admin`) - 10 Pages

Web dashboard for platform administrators with sidebar navigation.

| Page | Path | Description |
|------|------|-------------|
| Login | `/admin` (unauthenticated) | Admin login with email/password |
| Dashboard | `/admin/` | Overview stats - users, listings, connections, bookings, health metrics |
| Users | `/admin/users` | User management - search, view, block/unblock, role change |
| User Detail | `/admin/users/:id` | Individual user profile with activity details |
| Finance | `/admin/finance` | Financial overview and revenue analytics |
| Providers | `/admin/providers` | Service provider management, requests, promotions |
| Cleaning | `/admin/cleaning` | Cleaning marketplace oversight (4 tabs below) |
| Settings | `/admin/settings` | Admin password and profile settings |
| Support Chat | `/admin/chat` | Support message threads with users |

#### Admin Cleaning Sub-Tabs
| Tab | Description |
|-----|-------------|
| Subscriptions | View all host-provider subscription relationships with status |
| Visit Reports | Review cleaning visit reports with photo galleries |
| Reviews | Monitor all cleaning reviews with star ratings |
| Flagged | Reviews flagged for admin attention (rating <= 2 or long comments) |

---

### 3.3 Provider Portal (`/provider`) - Single-Page App with 4 Tabs

Self-contained dashboard for cleaning service providers with own auth and bottom tab navigation.

| Tab | Description |
|-----|-------------|
| Requests | Incoming subscription requests from hosts - accept or decline with optional message |
| Properties | Accepted properties - submit visit reports with photo uploads (minimum 8 photos) |
| Reviews | View star ratings and written feedback from hosts |
| Chat | Messaging with subscribed hosts (polling-based updates) |

Provider Portal includes its own login and signup forms within the page. Providers register with `role: provider`.

---

### 3.4 Developer Portal (`/dev-portal`) - 1 Page

| Page | Path | Description |
|------|------|-------------|
| Dev Portal | `/dev-portal` | Per-channel API key configuration, staging/production environments, test connection, API call logs |

---

## 4. COMPLETE FEATURE LIST

### 4.1 Authentication & User Management
- Email/password registration and login (`POST /api/auth/register`, `POST /api/auth/login`)
- Three user roles: `host`, `provider`, `admin`
- Session-based authentication (express-session with connect-pg-simple)
- Profile management with base64 photo upload (max 4MB, PNG/JPEG/WebP)
- Company details and CR number storage
- User blocking/unblocking by admin
- Role changes by admin

### 4.2 Channel Integration
- **Supported Channels:** Airbnb, Booking.com, Expedia, TripAdvisor
- Channel connection/disconnection workflow (`POST /api/providers/connect`, `POST /api/providers/disconnect`)
- Connection status tracking: CONNECTED, DISCONNECTED, ERROR
- Manual sync trigger (`POST /api/sync/run`, `POST /api/sync/channel`)
- Per-channel data deletion (`DELETE /api/channels/:channelKey/data`)
- Mock provider implementations via `IProviderAdapter` interface (ready for real API integration)
- External listing import from channels (`POST /api/sync/import-listings`)

### 4.3 Reservation Management
- Multi-channel reservation aggregation
- Status workflow: PENDING, CONFIRMED, INQUIRY, CANCELED, CHECKED_IN, CHECKED_OUT, REJECTED
- Accept/reject workflow (`POST /api/reservations/:id/accept`, `POST /api/reservations/:id/reject`)
- Guest name, check-in/out dates, total amount, currency
- Checkout flow triggering cleaning task creation (`POST /api/checkout`)

### 4.4 Calendar Management
- Date blocking/unblocking per listing (`POST /api/calendar/block`)
- Calendar status: AVAILABLE, BLOCKED, RESERVED
- Source tracking: MANUAL vs CHANNEL
- Per-listing calendar queries (`GET /api/calendar`)

### 4.5 Unified Inbox & Messaging
- Aggregated conversations from all connected channels (`GET /api/inbox`)
- Per-conversation message view (`GET /api/chat/:id`)
- Send messages to guests (`POST /api/chat/:id/send`)
- Message direction tracking (INBOUND/OUTBOUND)
- Unread count badges on inbox tab

### 4.6 Automated Messaging System
- **3-Step Check-in Flow:**
  1. Welcome message (WELCOME_10MIN)
  2. Access details (ACCESS_30MIN)
  3. Follow-up (FOLLOWUP_1H)
- Checkout thank-you messages (CHECKOUT_THANKYOU)
- First reply acknowledgment (FIRST_REPLY_ACK)
- Check-in messages (CHECKIN_MESSAGE)
- Cleaning reminders
- Template variables system (`{guestName}`, `{listingName}`, `{checkIn}`, etc.)
- Quiet hours enforcement (configurable start/end times, default 23:00-08:00)
- Per-listing automation configuration:
  - Encrypted door codes (AES encryption)
  - Encrypted WiFi credentials (SSID + password)
  - PDF brochure uploads
  - Default check-in time
- Deduplication via `dedupeKey` to prevent repeat messages
- Action logging with SUCCESS/FAILED/PAUSED status tracking
- Two cron endpoints: `POST /api/cron/daily`, `POST /api/cron/every10min`

### 4.7 Cleaning Services Marketplace (Three-Portal System)

#### Host Side (at `/hostapp/settings/cleaning`):
- Browse available cleaning providers (`GET /api/cleaning/providers`)
- View provider profiles with average rating and review count
- Subscribe to providers with listing selection and terms acceptance (`POST /api/cleaning/subscribe`)
- Three-state subscription status display:
  - Yellow (PENDING) - Awaiting provider response
  - Green (ACCEPTED) - Active service
  - Red (DECLINED) - With decline reason message
- View visit reports with photo galleries (`GET /api/cleaning/visit-reports/:subscriptionId`)
- Leave star ratings (1-5) and written reviews (`POST /api/cleaning/reviews`)
- Chat with subscribed providers (`GET/POST /api/cleaning/messages/:subscriptionId`)

#### Provider Side (at `/provider`):
- Provider registration and login (email/password, role: provider)
- View incoming subscription requests (`GET /api/provider/subscriptions`)
- Accept or decline with optional message (`PATCH /api/provider/subscriptions/:id/respond`)
- Submit visit reports with photo uploads:
  - Minimum 8 photos required
  - Notes per visit
  - Visit date selection
  - Listing selection from accepted subscriptions
  - Multi-file upload via Multer (max 10MB per file, 20 photos max)
  - (`POST /api/provider/visit-reports`)
- View visit report history (`GET /api/provider/visit-reports`)
- View reviews from hosts (`GET /api/provider/reviews`)
- Chat with subscribed hosts (`GET/POST /api/provider/messages/:subscriptionId`)
- View own profile (`GET /api/provider/profile`)

#### Admin Side (at `/admin/cleaning`):
- View all subscriptions across platform (`GET /api/admin/cleaning/subscriptions`)
- View all visit reports with photo galleries (`GET /api/admin/cleaning/visit-reports`)
- Monitor all reviews (`GET /api/admin/cleaning/reviews`)
- Auto-flagged reviews tab (reviews with `flaggedForAdmin: true`)

### 4.8 Listing Management
- Create listings (`POST /api/listings`)
- Photo management: add (`POST /api/listings/:id/photos`), remove (`DELETE /api/listings/:id/photos`)
- Amenities management (`PUT /api/listings/:id/amenities`)
- Active/Inactive status
- External listing mapping across channels (`external_listing_maps` table)
- Import listings from connected channels

### 4.9 Notification System
- In-app notification center (`GET /api/notifications`)
- Mark individual as read (`PATCH /api/notifications/:id/read`)
- Mark all as read (`POST /api/notifications/read-all`)
- Entity-linked notifications (type, entityType, entityId)

### 4.10 Support System
- Two-way support chat between hosts and admin
- Host endpoint: `GET /api/support/messages`, `POST /api/support/send`
- Admin endpoints: `GET /api/admin/support-threads`, messages and send per user
- Read status tracking for both admin and user sides

### 4.11 Cleaning Tasks (Checkout Workflow)
- Automatic cleaning task creation on checkout (`POST /api/checkout`)
- Task status tracking: PENDING, IN_PROGRESS, COMPLETED
- Task list view (`GET /api/cleaning-tasks`)
- Status updates (`PATCH /api/cleaning-tasks/:id/status`)

### 4.12 Template Management
- Create message templates (`POST /api/templates`)
- Edit templates (`PATCH /api/templates/:id`)
- Delete templates (`DELETE /api/templates/:id`)

### 4.13 Reminder Settings
- Configurable reminders (`PATCH /api/reminder-settings`):
  - Auto check-in message
  - Cleaning reminder
  - Checkout reminder
  - Payment reminder
  - Review reminder

### 4.14 Developer Portal (Channel API Configuration)
- Per-channel API configuration: API key, client ID, client secret, webhook URL, base URL
- Staging and production environment support
- Save/update configs (`PUT /api/dev-portal/configs`)
- Delete configs (`DELETE /api/dev-portal/configs/:id`)
- Test connection (`POST /api/dev-portal/test-connection`)
- API call logging with response times (`GET /api/dev-portal/logs`)

### 4.15 Admin Dashboard & Tools
- **User Statistics:** Total users by role, new host signups
- **Platform Metrics:** Total listings, active connections, bookings, messages, work orders
- **Health Monitoring:** Sync errors, webhook failures, token expiry, queue backlog
- **Channel Distribution:** Breakdown of channel connections
- **User Management:** List, search, create users, block/unblock, change roles
- **Individual User Profiles:** Listings, reservations, connected channels
- **Financial Overview:** Revenue metrics and analytics
- **Provider Management:** Create/edit/delete providers, handle requests, manage promotions
- **Conversation Monitoring:** View all user conversations and messages
- **Support Thread Management:** View and respond to support threads

---

## 5. DATABASE SCHEMA (30+ Tables)

### Core Tables
| Table | Key Fields |
|-------|-----------|
| `users` | id, email, password, firstName, lastName, role (host/provider/admin), subscriptionPlan, blocked |
| `channels` | id, key (AIRBNB/BOOKING/EXPEDIA/TRIPADVISOR), name, logoUrl |
| `channel_connections` | id, userId, channelId, status, accessToken, refreshToken, lastSyncAt |
| `listings` | id, userId, name, status (ACTIVE/INACTIVE), photos[], amenities[] |
| `external_listing_maps` | id, listingId, channelId, externalListingId, externalName |
| `reservations` | id, listingId, channelId, guestName, checkIn, checkOut, status, totalAmount, currency |
| `calendar_days` | id, listingId, date, status (AVAILABLE/BLOCKED/RESERVED), source (MANUAL/CHANNEL) |
| `conversations` | id, listingId, channelId, reservationId, guestName, unreadCount |
| `messages` | id, conversationId, direction (INBOUND/OUTBOUND), body, sentAt |
| `templates` | id, userId, name, body |
| `notifications` | id, userId, type, title, body, entityType, entityId, readAt |
| `audit_logs` | id, userId, action, entityType, entityId, meta (JSONB) |

### Automation Tables
| Table | Key Fields |
|-------|-----------|
| `automation_settings` | userId, autoCheckinEnabled, autoCheckinTiming, quietHours, welcomeEnabled, accessEnabled, followupEnabled |
| `automation_templates` | userId, key (CHECKIN_MESSAGE/CHECKOUT_THANKYOU/WELCOME_10MIN/ACCESS_30MIN/FOLLOWUP_1H/FIRST_REPLY_ACK), name, body |
| `automation_action_logs` | userId, actionType, status (SUCCESS/FAILED/PAUSED), reason, guestName, dedupeKey |
| `listing_automation_configs` | listingId, defaultCheckinTime, doorCodeEncrypted, wifiSsidEncrypted, wifiPasswordEncrypted, brochurePdfUrl |
| `reminder_settings` | userId, autoCheckinMessage, cleaningReminder, checkoutReminder, paymentReminder, reviewReminder |

### Cleaning Marketplace Tables
| Table | Key Fields |
|-------|-----------|
| `cleaning_subscriptions` | id, hostId, providerId, listingIds[], termsAccepted, status (PENDING/ACCEPTED/DECLINED), declineMessage |
| `cleaning_visit_reports` | id, subscriptionId, providerId, listingId, photos[], notes, visitDate |
| `cleaning_reviews` | id, visitReportId, subscriptionId, hostId, providerId, rating (1-5), comment, flaggedForAdmin |
| `provider_messages` | id, subscriptionId, senderId, senderType (HOST/PROVIDER), body, sentAt |
| `cleaning_tasks` | id, userId, reservationId, listingId, cleaningCompany, status (PENDING/IN_PROGRESS/COMPLETED) |

### Service Provider Tables (Admin-managed)
| Table | Key Fields |
|-------|-----------|
| `service_providers` | id, name, type (CLEANING/MAINTENANCE), email, phone, companyName, commissionRate, status |
| `provider_requests` | id, name, type, email, phone, companyName, message, status (PENDING/APPROVED/REJECTED) |
| `provider_promotions` | id, providerId, title, description, discountPercent, validFrom, validUntil, active |

### API & Support Tables
| Table | Key Fields |
|-------|-----------|
| `channel_api_configs` | userId, channelKey, environment (STAGING/PRODUCTION), apiKey, clientId, clientSecret, webhookUrl, status |
| `api_call_logs` | userId, channelKey, environment, method, endpoint, statusCode, responseTimeMs, success |
| `support_messages` | userId, direction, body, sentAt, readByAdmin, readByUser |

---

## 6. COMPLETE API ENDPOINT LIST

### Authentication (6 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user (host or provider) |
| POST | `/api/auth/login` | No | Login with email/password |
| POST | `/api/auth/logout` | Yes | End session |
| GET | `/api/auth/user` | Yes | Get current user profile |
| PATCH | `/api/auth/user` | Yes | Update user profile |
| POST | `/api/upload/avatar` | Yes | Upload profile picture (base64) |

### Dashboard & Core (7 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Host dashboard data (check-ins, checkouts, stats) |
| GET | `/api/inbox` | Yes | Unified inbox conversations |
| GET | `/api/settings` | Yes | User settings (channels, listings, templates) |
| GET | `/api/notifications` | Yes | User notifications list |
| PATCH | `/api/notifications/:id/read` | Yes | Mark notification as read |
| POST | `/api/notifications/read-all` | Yes | Mark all notifications as read |
| PATCH | `/api/reminder-settings` | Yes | Update reminder preferences |

### Reservations (3 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reservations/:id/accept` | Yes | Accept pending reservation |
| POST | `/api/reservations/:id/reject` | Yes | Reject pending reservation |
| POST | `/api/checkout` | Yes | Process checkout and create cleaning task |

### Calendar (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/calendar` | Yes | Get calendar days for listings |
| POST | `/api/calendar/block` | Yes | Block/unblock dates |

### Messaging (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat/:id` | Yes | Get conversation messages |
| POST | `/api/chat/:id/send` | Yes | Send message in conversation |

### Listings (7 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/listings` | Yes | Create new listing |
| POST | `/api/listings/:id/photos` | Yes | Add photos to listing |
| DELETE | `/api/listings/:id/photos` | Yes | Remove photos from listing |
| PUT | `/api/listings/:id/amenities` | Yes | Update listing amenities |
| POST | `/api/sync/import-listings` | Yes | Import listings from channels |
| GET | `/api/listings/:listingId/automation` | Yes | Get listing automation config |
| PUT | `/api/listings/:listingId/automation` | Yes | Update listing automation config |

### Templates (3 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/templates` | Yes | Create message template |
| PATCH | `/api/templates/:id` | Yes | Update template |
| DELETE | `/api/templates/:id` | Yes | Delete template |

### Channel Management (4 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/providers/connect` | Yes | Connect to a channel |
| POST | `/api/providers/disconnect` | Yes | Disconnect from channel |
| POST | `/api/sync/run` | Yes | Trigger full sync |
| POST | `/api/sync/channel` | Yes | Sync specific channel |
| DELETE | `/api/channels/:channelKey/data` | Yes | Delete all data for channel |

### Automation (9 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/automation/settings` | Yes | Get automation settings |
| PUT | `/api/automation/settings` | Yes | Update automation settings |
| PUT | `/api/automation/templates/:key` | Yes | Update automation template |
| GET | `/api/automation/logs` | Yes | Get automation action logs |
| GET | `/api/automation/checkin` | Yes | Get check-in automation settings |
| PUT | `/api/automation/checkin/settings` | Yes | Update check-in settings |
| PUT | `/api/automation/checkin/templates/:key` | Yes | Update check-in template |
| PUT | `/api/listings/automation/apply-all` | Yes | Apply automation to all listings |
| POST | `/api/listings/:listingId/brochure` | Yes | Upload brochure PDF |

### Cleaning Tasks (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cleaning-tasks` | Yes | Get user's cleaning tasks |
| PATCH | `/api/cleaning-tasks/:id/status` | Yes | Update cleaning task status |

### Cleaning Marketplace - Host Side (6 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cleaning/providers` | No | List all available providers |
| POST | `/api/cleaning/subscribe` | Yes | Subscribe to a provider |
| GET | `/api/cleaning/my-subscriptions` | Yes | Get host's subscriptions |
| GET | `/api/cleaning/visit-reports/:subscriptionId` | Yes | Get visit reports for subscription |
| POST | `/api/cleaning/reviews` | Yes | Submit review for visit report |
| GET/POST | `/api/cleaning/messages/:subscriptionId` | Yes | Get/send chat messages |

### Provider Portal (9 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/provider/auth-check` | Session | Check if user is a provider |
| GET | `/api/provider/subscriptions` | Provider | Get subscription requests |
| PATCH | `/api/provider/subscriptions/:id/respond` | Provider | Accept/decline request |
| POST | `/api/provider/visit-reports` | Provider | Submit visit report with photos |
| GET | `/api/provider/visit-reports` | Provider | Get provider's visit reports |
| GET | `/api/provider/reviews` | Provider | Get provider's reviews |
| GET | `/api/provider/messages/:subscriptionId` | Provider | Get chat messages |
| POST | `/api/provider/messages/:subscriptionId` | Provider | Send chat message |
| GET | `/api/provider/profile` | Provider | Get provider profile |

### Developer Portal (5 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dev-portal/configs` | Yes | Get channel API configs |
| PUT | `/api/dev-portal/configs` | Yes | Save/update API config |
| DELETE | `/api/dev-portal/configs/:id` | Yes | Delete API config |
| POST | `/api/dev-portal/test-connection` | Yes | Test channel connection |
| GET | `/api/dev-portal/logs` | Yes | Get API call logs |

### Support Chat (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/support/messages` | Yes | Get support messages |
| POST | `/api/support/send` | Yes | Send support message |

### Cron Jobs (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/cron/daily` | No | Daily automated tasks (checkout thanks, cleaning reminders) |
| POST | `/api/cron/every10min` | No | 10-min automated tasks (check-in flow, auto-replies) |

### Admin Panel (27 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/auth-check` | Session | Check if user is admin |
| POST | `/api/admin/setup` | Yes | One-time admin setup |
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | List all users (with search) |
| POST | `/api/admin/users` | Admin | Create new user |
| GET | `/api/admin/users/:id` | Admin | Get user detail |
| PATCH | `/api/admin/users/:id/block` | Admin | Block/unblock user |
| PATCH | `/api/admin/users/:id/role` | Admin | Change user role |
| GET | `/api/admin/finance` | Admin | Financial data |
| GET | `/api/admin/providers` | Admin | List service providers |
| POST | `/api/admin/providers` | Admin | Create service provider |
| PATCH | `/api/admin/providers/:id` | Admin | Update service provider |
| DELETE | `/api/admin/providers/:id` | Admin | Delete service provider |
| GET | `/api/admin/provider-requests` | Admin | List provider requests |
| POST | `/api/admin/provider-requests` | Admin | Create provider request |
| PATCH | `/api/admin/provider-requests/:id` | Admin | Review provider request |
| GET | `/api/admin/providers/:id/promotions` | Admin | Get provider promotions |
| POST | `/api/admin/providers/:id/promotions` | Admin | Create promotion |
| DELETE | `/api/admin/promotions/:id` | Admin | Delete promotion |
| PATCH | `/api/admin/settings/password` | Admin | Change admin password |
| PATCH | `/api/admin/settings/profile` | Admin | Update admin profile |
| GET | `/api/admin/conversations` | Admin | List all user conversations |
| GET | `/api/admin/conversations/:id/messages` | Admin | Get conversation messages |
| POST | `/api/admin/conversations/:id/send` | Admin | Send message in conversation |
| GET | `/api/admin/support-threads` | Admin | List support threads |
| GET | `/api/admin/support-threads/:userId/messages` | Admin | Get support thread messages |
| POST | `/api/admin/support-threads/:userId/send` | Admin | Send support reply |

### Admin Cleaning Oversight (3 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/cleaning/subscriptions` | Admin | All cleaning subscriptions |
| GET | `/api/admin/cleaning/reviews` | Admin | All cleaning reviews |
| GET | `/api/admin/cleaning/visit-reports` | Admin | All visit reports |

**Total: 97 API endpoints**

---

## 7. INTEGRATIONS & DEPENDENCIES

### Active Integrations
| Integration | Purpose |
|------------|---------|
| PostgreSQL (Neon-backed) | Primary database via Replit built-in |
| express-session + connect-pg-simple | Session management stored in PostgreSQL |
| bcrypt | Password hashing (registration and login) |
| Multer | Multi-part file uploads (avatars, visit photos, brochures) |
| Drizzle ORM | Type-safe database queries and schema management |
| AES Encryption | Door codes and WiFi credential encryption |

### Mock Channel Integrations (via `IProviderAdapter` Interface)
| Channel | Status | Description |
|---------|--------|-------------|
| Airbnb | Mock | Deterministic seeded mock data |
| Booking.com | Mock | Deterministic seeded mock data |
| Expedia | Mock | Deterministic seeded mock data |
| TripAdvisor | Mock | Deterministic seeded mock data |

These mock implementations provide a clean abstraction layer. To integrate real channel APIs, implement the `IProviderAdapter` interface for each channel.

### Future Integration Opportunities
- Real channel APIs (Airbnb, Booking.com, Expedia, TripAdvisor)
- Payment processing for subscription billing
- Email notification service
- Push notifications
- SMS alerts
- iCal calendar sync
- Webhook receivers for real-time channel updates

---

## 8. SECURITY IMPLEMENTATION

| Feature | Implementation |
|---------|---------------|
| Password Storage | bcrypt hashing with salt |
| Session Management | express-session with PostgreSQL store |
| Role-Based Access | Middleware checks (isAuthenticated, isAdmin, isProvider) |
| Sensitive Data Encryption | AES encryption for door codes and WiFi credentials |
| File Upload Validation | MIME type checking, file size limits (4MB avatars, 10MB photos) |
| SQL Injection Prevention | Parameterized queries via Drizzle ORM |
| API Authorization | Per-endpoint middleware enforcement |

---

## 9. FILE STRUCTURE

```
/
|-- client/
|   |-- src/
|       |-- pages/
|       |   |-- admin/                     # 10 admin panel pages
|       |   |   |-- admin-dashboard.tsx
|       |   |   |-- admin-users.tsx
|       |   |   |-- admin-user-detail.tsx
|       |   |   |-- admin-finance.tsx
|       |   |   |-- admin-providers.tsx
|       |   |   |-- admin-cleaning.tsx
|       |   |   |-- admin-settings.tsx
|       |   |   |-- admin-chat.tsx
|       |   |   |-- admin-login.tsx
|       |   |   |-- admin-layout.tsx
|       |   |-- provider-portal.tsx         # Provider SPA (966 lines)
|       |   |-- home.tsx                    # Host dashboard
|       |   |-- calendar.tsx               # Calendar management
|       |   |-- inbox.tsx                  # Unified inbox
|       |   |-- chat.tsx                   # Conversation view
|       |   |-- settings.tsx              # Settings hub
|       |   |-- settings-cleaning.tsx      # Cleaning marketplace
|       |   |-- settings-automation.tsx    # Automation config
|       |   |-- settings-listings.tsx      # Listing management
|       |   |-- settings-templates.tsx     # Template editor
|       |   |-- settings-reminders.tsx     # Reminder prefs
|       |   |-- settings-maintenance.tsx   # Maintenance tasks
|       |   |-- landing.tsx               # Landing page
|       |   |-- login.tsx                 # Login form
|       |   |-- signup.tsx                # Signup form
|       |   |-- profile.tsx              # User profile
|       |   |-- listing-detail.tsx        # Listing details
|       |   |-- notifications.tsx         # Notification center
|       |   |-- channels.tsx             # Channel management
|       |   |-- community-questions.tsx   # Community Q&A
|       |   |-- support-chat.tsx          # Support messaging
|       |   |-- dev-portal.tsx            # Developer portal
|       |   |-- not-found.tsx             # 404 page
|       |-- components/
|       |   |-- ui/                       # Shadcn components
|       |   |-- bottom-tabs.tsx           # Bottom tab navigation
|       |-- hooks/                        # Custom React hooks
|       |-- lib/                          # Utilities (queryClient, etc.)
|-- server/
|   |-- routes.ts                         # Main API routes (2,529 lines)
|   |-- admin-routes.ts                   # Admin endpoints (849 lines)
|   |-- provider-routes.ts               # Provider + cleaning endpoints (626 lines)
|   |-- storage.ts                       # Database operations interface
|   |-- db.ts                            # Database connection
|   |-- providers/                       # Mock channel provider implementations
|   |-- automation.ts                    # Automation engine (quiet hours, templates, dedup)
|   |-- encryption.ts                    # AES encryption utilities
|   |-- replit_integrations/             # Auth integration (register, login, session)
|-- shared/
|   |-- schema.ts                        # Drizzle schema (928 lines, 30+ tables)
|   |-- models/
|       |-- auth.ts                      # User model and auth schemas
|-- uploads/
|   |-- avatars/                         # User profile pictures
|   |-- visit-photos/                    # Cleaning visit report photos
|   |-- brochures/                       # Listing PDF brochures
```

---

## 10. DEPLOYMENT

| Setting | Value |
|---------|-------|
| Hosting Platform | Replit |
| Database | PostgreSQL (Neon-backed, built-in to Replit) |
| Build Tool | Vite (frontend) + TSX (backend) |
| Server Port | 5000 |
| SSL/TLS | Automatic via Replit |
| File Storage | Local filesystem (uploads directory) |

---

## 11. SCOPE SUMMARY

| Metric | Count |
|--------|-------|
| Portals | 4 (Host, Admin, Provider, Developer) |
| Frontend Pages | 33 |
| Database Tables | 30+ |
| API Endpoints | 97 |
| Backend Route Files | 3 (4,004 lines total) |
| Schema File | 928 lines |
| Supported Channels | 4 (mock, ready for real integration) |
| User Roles | 3 (Host, Provider, Admin) |

---

## 12. KNOWN LIMITATIONS & FUTURE WORK

| Area | Current State | Future Enhancement |
|------|--------------|-------------------|
| Channel APIs | Mock implementations | Real API integrations via IProviderAdapter |
| Subscription Plans | Schema defined, not enforced | Tier-based feature gating |
| Payments | Not implemented | Payment gateway integration |
| Notifications | In-app only | Email, push, SMS notifications |
| File Storage | Local filesystem | Cloud storage (S3/GCS) |
| Calendar | Basic blocking | Full iCal sync |
| Real-time | Polling-based chat | WebSocket for real-time updates |
| Search | Basic text search | Full-text search engine |

---

*Document generated: February 13, 2026*
*Version: 1.0*
