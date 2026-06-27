# Mail Dashboard Agent Build Documentation

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Setup, Configuration & Deployment](#3-setup-configuration--deployment)
4. [Core Functionalities & Data Flow](#4-core-functionalities--data-flow)
5. [Troubleshooting Guide](#5-troubleshooting-guide)
6. [Maintenance & Updates](#6-maintenance--updates)

---

## 1. Executive Summary

### Core Purpose
The **Mail Dashboard** is a full-stack web application designed to help users manage job applications, track outreach efforts, compose emails, and analyze application performance metrics. The application is deployed on Cloudflare Workers, using D1 (SQLite) for database management and tRPC for type-safe API communication between the React frontend and Hono backend.

### Key Objectives
- Provide an intuitive user interface for managing job applications
- Support email composition and sending via SMTP (configurable in user settings)
- Track application statuses, history, and metrics via dashboards and analytics
- Store user preferences and application data securely
- Deploy to a scalable, serverless platform (Cloudflare Workers)

---

## 2. System Architecture

### High-Level Architecture Diagram (Text-Based)
```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │    Dashboard    │  │   Compose Mail  │  │   Analytics      │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
│                          (React/Vite)                           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (tRPC over HTTP)
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Hono/Cloudflare)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │   tRPC Router   │  │  Email Service  │  │  Database (D1)  │  │
│  │  (routers.ts)   │  │(emailService.ts)│  │  (db.ts)         │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown
1. **Frontend (React + Vite)**:
   - Located in `client/` directory
   - Uses Tailwind CSS for styling
   - Pages include Dashboard, Compose Mail, Analytics, Settings, etc.
   - Communicates with backend via tRPC (type-safe)

2. **Backend (Hono + Cloudflare Workers)**:
   - Located in `server/` directory
   - Uses tRPC for API routes
   - Uses Drizzle ORM for database interactions
   - Email sending via nodemailer/SMTP
   - Worker entrypoint: `server/_core/worker.ts`

3. **Database (Cloudflare D1)**:
   - SQLite-based serverless database
   - Schema defined in `drizzle/schema.ts`
   - Migrations stored in `drizzle/migrations/` and `migrations/`

---

## 3. Setup, Configuration & Deployment

### Prerequisites
- Node.js 20+
- pnpm (package manager)
- Cloudflare account (for deployment)
- SMTP credentials (for email sending)

### Step-by-Step Setup

#### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd mail-dashboard-project
pnpm install
```

#### 2. Configuration
- Cloudflare Worker config: [wrangler.toml](file:///d:/mail-dashboard/mail-dashboard-project/wrangler.toml)
- Vite config: [vite.config.ts](file:///d:/mail-dashboard/mail-dashboard-project/vite.config.ts)
- Drizzle config: [drizzle.config.ts](file:///d:/mail-dashboard/mail-dashboard-project/drizzle.config.ts)

#### 3. Database Setup
- Generate migrations: `pnpm exec drizzle-kit generate`
- Apply migrations locally/remote: `npx wrangler d1 migrations apply <db-name> --remote`

#### 4. Build & Deploy
- Build: `pnpm build`
- Deploy to Cloudflare Workers: `npx wrangler deploy`

---

## 4. Core Functionalities & Data Flow

### Core Features
1. **User Authentication**: Basic user management (default user created on first use)
2. **Job Applications**: Create, view, update, and delete applications with status tracking
3. **Email Composition**: Compose and send emails via SMTP (using nodemailer)
4. **Analytics & Metrics**: Visualize weekly/monthly application data, response rates
5. **User Settings**: Configure SMTP credentials, theme, daily limits, etc.

### API Specifications (tRPC)
- tRPC router definitions in [server/routers.ts](file:///d:/mail-dashboard/mail-dashboard-project/server/routers.ts)
- Available routers:
  - `auth`: User authentication
  - `companies`: Company management
  - `applications`: Application CRUD
  - `templates`: Email template management
  - `resumes`: Resume file management
  - `activityLogs`: Activity tracking
  - `settings`: User settings
  - `dashboard`: Metrics and chart data

### Data Flow
1. User interacts with frontend (React component)
2. Frontend calls tRPC procedure (via `trpc.<router>.<procedure>`)
3. Backend procedure executes:
   - Fetches/updates data from D1 database via [server/db.ts](file:///d:/mail-dashboard/mail-dashboard-project/server/db.ts)
   - Optionally sends emails via [server/emailService.ts](file:///d:/mail-dashboard/mail-dashboard-project/server/emailService.ts)
4. Data/result is returned to frontend and rendered

---

## 5. Troubleshooting Guide

### Common Issues & Solutions
1. **Emails not sending**:
   - Verify SMTP credentials in Settings
   - Check for typos in host/port (Gmail uses smtp.gmail.com:587)
   - Use an App Password if using Gmail (requires 2FA enabled)

2. **Database errors**:
   - Ensure D1 database is properly bound in [wrangler.toml](file:///d:/mail-dashboard/mail-dashboard-project/wrangler.toml)
   - Verify all migrations are applied: `npx wrangler d1 migrations list <db-name> --remote`

3. **Build/deployment failures**:
   - Check Node.js/pnpm versions match requirements
   - Run `pnpm install` to ensure dependencies are up to date
   
4. **SPA routes return "Internal Server Error" on refresh/navigation**:
   - Ensure all D1 migrations are applied (verify with `npx wrangler d1 migrations list <db-name> --remote`)
   - The [server/_core/worker.ts](file:///d:/mail-dashboard/mail-dashboard-project/server/_core/worker.ts) has correct fallback logic to serve index.html for client-side routes
   - Check that the worker.ts fallback checks for staticRes.status !== 404 before falling back to index.html

---

## 6. Maintenance & Updates

### Backup & Restore
- Backup D1 database: Use Cloudflare Dashboard or Wrangler CLI
- Restore: Apply existing migrations to a new database instance

### Updating Dependencies
- Update packages: `pnpm update`
- Check for breaking changes in package changelogs before deploying

### CI/CD
- GitHub Actions workflow: [.github/workflows/deploy.yml](file:///d:/mail-dashboard/mail-dashboard-project/.github/workflows/deploy.yml)
- Auto-deploys on pushes to `main` branch

---

## Glossary
- **tRPC**: Type-safe remote procedure call framework
- **D1**: Cloudflare's serverless SQLite database
- **Hono**: Lightweight web framework for edge computing
- **Drizzle ORM**: Type-safe ORM for SQL databases
