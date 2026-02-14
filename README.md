# Hoster - Multi-Channel Rental Management PWA

## Overview
Hoster is a mobile-first PWA designed for solo short-term rental hosts. Its primary purpose is to centralize the management of multi-channel bookings, availability, and guest communications from platforms like Airbnb, Booking.com, Expedia, and TripAdvisor into a single, unified dashboard. The project aims to streamline operations for hosts, offering a scalable solution with a subscription-based business model (Light, Growth, Expanding plans). The business vision is to empower individual hosts with enterprise-level tools, reducing administrative burden and increasing efficiency in the competitive short-term rental market.

## User Preferences
- Mobile-first design with bottom tab navigation
- Calm, professional aesthetic with coral/rose primary color
- Light mode only

## System Architecture
Hoster is built with a modern web stack, featuring a **React + Vite + TailwindCSS + Shadcn/ui** frontend, an **Express.js with TypeScript** backend, and a **PostgreSQL** database managed by **Drizzle ORM**. Authentication is handled via email/password using bcrypt and express-session. Routing is managed by wouter on the frontend and Express on the backend, with state management handled by TanStack Query v5.

**URL Structure & Routing:**
- `/` → Redirects to `/hostapp`
- `/hostapp` → Host Portal (mobile PWA) - landing, login, signup, and authenticated app
- `/admin` → Admin Panel (web dashboard) - protected by admin login
- `/provider` → Provider Portal - cleaning service provider dashboard with own auth
- `/dev-portal` → Developer Portal for channel API configuration
- Uses wouter `Router base` for portal isolation (`/hostapp`, `/admin`, and `/provider` are separate routing contexts)

**UI/UX Decisions:**
The application adopts an Airbnb-inspired UI refresh, characterized by a coral/rose primary color (`#FF385C`), the Nunito font, warm neutral grays, and updated stock photography. Key UI components include a persistent bottom tab navigation, warmer stat cards, and coral notification badges. The application also features a 3-screen landing flow (dark splash → login → signup) and a redesigned settings interface with sub-pages.

**Technical Implementations & Features:**
- **Provider Abstraction:** Utilizes mock provider implementations with a clean `IProviderAdapter` interface to facilitate future integration with real APIs (Airbnb, Booking.com, Expedia, TripAdvisor).
- **Reservation Management:** Supports `PENDING`, `CONFIRMED`, `INQUIRY`, and `CANCELED` reservation statuses, including an accept/reject workflow for pending reservations.
- **Automated Messaging:** Implements a 3-step check-in flow (Welcome, Access, Follow-up) with per-listing configuration, encrypted door codes, WiFi credentials, and PDF brochure uploads. Features template variables and respects quiet hours.
- **Channel Integration & Health:** Includes a developer portal for per-channel API configuration (staging/production environments), test connection functionality, and API call logs. A channel health center provides sync status, disconnect options, and data deletion for each integrated channel.
- **Cleaning & Maintenance Workflow:** Features a checkout-to-cleaning workflow with automatic cleaning task creation and status tracking.
- **Cleaning Services Marketplace:** Three-portal cleaning marketplace where hosts browse and subscribe to cleaning providers (PENDING/ACCEPTED/DECLINED states), providers accept/decline requests and upload visit reports with minimum 8 photos, hosts review visits with star ratings, and admins monitor flagged reviews. Provider Portal (`/provider`) with own login, chat between hosts and providers, admin oversight at `/admin/cleaning`.
- **Calendar Management:** Provides a 12-month forward view with date blocking/unblocking per listing and channel-specific indicators.
- **Unified Inbox:** Aggregates messages from various channels, supporting permission-based messaging and "view only" indicators for read-only channels.
- **User & Listing Profiles:** Allows profile picture uploads, company details, and comprehensive listing detail pages.
- **Cron Jobs:** Daily and 10-minute cron jobs manage automated check-in messages, checkout thank-yous, cleaning reminders, and auto-replies.

**Key Design Decisions:**
- Mock providers use deterministic seeding for consistent testing.
- Calendar priority is defined as Reserved > Blocked > Available.
- Listings are auto-mapped by name across channels.
- Templates are seeded on first channel connection.
- Double-booking detection triggers notifications.

## External Dependencies
- **PostgreSQL:** Primary database for all application data.
- **Vite:** Frontend build tool.
- **TailwindCSS:** Utility-first CSS framework.
- **Shadcn/ui:** UI component library.
- **Express.js:** Backend web application framework.
- **TypeScript:** Superset of JavaScript for type-safe code.
- **Drizzle ORM:** TypeScript ORM for PostgreSQL.
- **bcrypt:** For password hashing.
- **express-session & connect-pg-simple:** For session management.
- **wouter:** React router.
- **TanStack Query v5:** Data fetching and state management.
- **Mock Providers:** Simulated integrations for Airbnb, Booking.com, Expedia, and TripAdvisor.