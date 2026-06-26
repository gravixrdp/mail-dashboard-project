# AGENT_GUIDE: Personal Job Application Dashboard

This document provides an overview of the Personal Job Application Dashboard, its functionality, technical architecture, and deployment process. It is intended for AI agents and developers who need to understand, maintain, or extend this application.

## 1. Overview

The Personal Job Application Dashboard is a web application designed to help users manage their job application process efficiently. It provides a centralized platform to track applications, manage company information, create and use email templates, store resumes, analyze application statistics, and monitor activity logs.

## 2. Key Features

The dashboard includes the following core modules:

| Module | Description | Key Functionality |
|---|---|---|
| **Dashboard** | Provides a high-level overview of application progress. | Stat cards (total, today, week, month, replies, interviews, rejected, pending), response rate, application status distribution, weekly/monthly application trends, recent applications, activity timeline, quick-action shortcuts. |
| **Applications** | Manages individual job applications. | CRUD (Create, Read, Update, Delete) operations, search, filter by status, pagination, status badges. |
| **Companies** | Stores information about companies applied to. | Card grid view, CRUD operations, status badges (active, archived, rejected), HR email tracking, application count, last applied date. |
| **Templates** | Manages reusable email templates for applications. | Card grid view, category filtering, variable insertion (e.g., `{{company}}`, `{{position}}`), preview functionality, duplicate template, CRUD operations. |
| **Compose Mail** | Facilitates sending job application emails. | Live variable substitution, template loading, resume attachment selection, company linking, duplicate application detection with warning, email preview. |
| **Resume Manager** | Stores and manages multiple resume versions. | Drag-and-drop file upload, rename, set default resume, file size display, preview, delete. |
| **Analytics** | Provides insights into job search performance. | Metric cards (total applications, replies, interviews, rejected, response rate, current month applications), daily/monthly application charts, response trend line chart, status distribution pie chart, top email domains bar chart. |
| **Settings** | Allows users to configure personal preferences and integrations. | Profile (phone, portfolio, GitHub, LinkedIn, signature), email defaults (subject, daily send limit, delay), Gmail API/SMTP configuration, Google Sheets integration, theme switcher (light/dark/system). |
| **Activity Logs** | Records and displays user actions within the dashboard. | Timeline view with action-type icons and colors, search, pagination. |

## 3. Technical Architecture

The application is built using a modern web stack, primarily focused on React for the frontend and tRPC for API communication.

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Wouter (router), Recharts (charts), Shadcn/ui (components).
- **Backend**: Node.js, Express, tRPC, Drizzle ORM, SQLite (development), Cloudflare D1 (production).
- **Authentication**: Manus OAuth (configured via `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` environment variables).
- **Database**: Drizzle ORM for type-safe database interactions. Uses SQLite in development and Cloudflare D1 in production.
- **Storage**: Cloudflare R2 (for resume storage, configured via `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` environment variables).
- **Deployment**: Cloudflare Pages/Workers, GitHub Actions for CI/CD.

## 4. Environment Variables

The following environment variables are crucial for the application's operation:

- `OAUTH_SERVER_URL`: Base URL for the OAuth server.
- `VITE_OAUTH_PORTAL_URL`: Portal URL for OAuth application authentication.
- `VITE_APP_ID`: Application ID for OAuth.
- `DATABASE_URL`: Database connection string (e.g., `file:./dev.db` for SQLite, or D1 binding for Cloudflare).
- `R2_ACCOUNT_ID`: Cloudflare R2 account ID.
- `R2_ACCESS_KEY_ID`: Cloudflare R2 access key ID.
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 secret access key.
- `R2_BUCKET_NAME`: Cloudflare R2 bucket name for resume storage.
- `R2_PUBLIC_URL`: Public URL for the R2 bucket.
- `JWT_SECRET`: Secret key for JSON Web Token signing.

## 5. Deployment to Cloudflare

The application is designed for deployment to Cloudflare Pages and Workers, leveraging Cloudflare D1 for the database and R2 for file storage. Deployment is automated via GitHub Actions.

### 5.1 Cloudflare Resources

- **Cloudflare D1**: A serverless SQL database. The Drizzle ORM is configured to interact with D1 in production.
- **Cloudflare R2**: Object storage compatible with S3 API. Used for storing user resumes.
- **Cloudflare Pages/Workers**: Hosts the frontend and backend (Workers).

### 5.2 GitHub Actions Workflow

The GitHub Actions workflow will perform the following steps:

1. **Checkout code**.
2. **Install dependencies**.
3. **Build the application** (frontend and backend).
4. **Run D1 migrations** (if any).
5. **Deploy to Cloudflare Pages/Workers**.

This ensures that every push to the `main` branch automatically updates the deployed application.

## 6. Maintenance and Extension

- **Frontend**: Standard React development practices apply. Components are built with Shadcn/ui and Tailwind CSS for styling.
- **Backend**: tRPC procedures define the API. Drizzle ORM handles database interactions. Extend existing routers or create new ones for new features.
- **Database**: Drizzle Kit is used for schema migrations. `drizzle-kit generate` to create migration files and `drizzle-kit migrate` to apply them.
- **Environment**: Ensure all necessary environment variables are configured in the Cloudflare Pages project settings and GitHub Actions secrets.

This guide will be updated with any significant changes to the application's architecture or functionality.
