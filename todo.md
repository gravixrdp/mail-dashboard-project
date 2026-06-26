# Job Application Tracker - TODO

## Database Schema & Setup
- [ ] Create applications table (company, hr_email, status, resume_used, date, notes, etc.)
- [ ] Create companies table (name, emails, first_applied, last_applied, app_count, status, notes)
- [ ] Create email_templates table (name, subject, body, category, variables)
- [ ] Create resumes table (filename, file_key, file_url, is_default, uploaded_at)
- [ ] Create activity_logs table (action_type, description, metadata, timestamp)
- [ ] Create user_settings table (name, email, phone, portfolio, github, linkedin, signature, default_resume_id, default_subject, daily_send_limit, email_delay, gmail_settings, sheets_config)
- [ ] Create email_queue table (recipient, subject, body, status, scheduled_at, sent_at)
- [ ] Run migrations and apply schema

## Core Layout & Navigation
- [ ] Update DashboardLayout sidebar with all menu items (Dashboard, Compose Mail, Applications, Companies, Templates, Resume Manager, Analytics, Settings, Activity Logs)
- [ ] Set up routing in App.tsx for all pages
- [ ] Implement auth context and protected routes
- [ ] Add theme toggle (dark/light mode) in settings
- [ ] Create responsive mobile navigation

## Dashboard Home Page
- [ ] Display stat cards (Total Applications, Today's Applications, This Week, This Month, Replies, Interviews, Rejected, Pending, Invalid Emails, Duplicate Prevented, Response Rate, Bounce Rate)
- [ ] Build weekly applications chart (Recharts)
- [ ] Build monthly applications chart (Recharts)
- [ ] Build response trend chart (Recharts)
- [ ] Build top domains chart (Recharts)
- [ ] Build top companies chart (Recharts)
- [ ] Create recent activity timeline component
- [ ] Add loading skeletons for all sections

## Applications Module
- [ ] Create applications table with columns: company, hr_email, subject, status, resume_used, date, notes
- [ ] Implement search and filter by status (Sent, Replied, Interview, Rejected, Ghosted)
- [ ] Add sort functionality (date, company, status)
- [ ] Implement pagination
- [ ] Create add/edit application modal
- [ ] Implement delete application with confirmation
- [ ] Add inline notes editing
- [ ] Create duplicate detection logic (Level 1: exact email, Level 2: domain, Level 3: normalized company name)
- [ ] Show duplicate warning dialog before allowing duplicate send
- [ ] Add loading states and empty state UI

## Compose Mail Page
- [ ] Create Tiptap rich text editor component with toolbar (bold, italic, underline, strike, lists, tables, images, links, font size, colors, alignment, hr, undo, redo, emoji, quote, code block)
- [ ] Add recipient field with autocomplete from companies
- [ ] Add subject line field
- [ ] Add template selector dropdown
- [ ] Add resume selector dropdown
- [ ] Add attachments field
- [ ] Implement dynamic variable substitution ({{name}}, {{company}}, {{role}}, {{portfolio}}, {{github}}, {{linkedin}}, {{phone}}, {{email}}, {{resume}}, {{today}})
- [ ] Add preview mode
- [ ] Implement email queue with configurable delay
- [ ] Add "Send" button with duplicate detection check
- [ ] Add "Save Draft" button
- [ ] Create email preview modal
- [ ] Add automatic company name detection from email domain
- [ ] Implement send confirmation dialog

## Email Templates Module
- [ ] Create templates list page with search
- [ ] Implement create template modal (name, category, subject, body)
- [ ] Implement edit template modal
- [ ] Implement delete template with confirmation
- [ ] Add duplicate template functionality
- [ ] Create template preview mode
- [ ] Add category filter (DevOps, Cloud, Platform, SRE, Backend, Internship)
- [ ] Add template variables help text
- [ ] Implement template body editor with Tiptap

## Resume Manager
- [ ] Create resumes list page
- [ ] Implement file upload (PDF/DOCX) to S3
- [ ] Add rename resume functionality
- [ ] Add delete resume with confirmation
- [ ] Implement replace resume functionality
- [ ] Add preview resume button (PDF viewer)
- [ ] Add "Set as Default" button
- [ ] Display file size and upload date
- [ ] Add loading states for upload/delete
- [ ] Implement empty state for no resumes

## Companies Module
- [ ] Create companies list page with search
- [ ] Add company detail page with full history
- [ ] Implement add company modal (name, emails, notes)
- [ ] Implement edit company modal
- [ ] Implement delete company with confirmation
- [ ] Display application count per company
- [ ] Show first/last applied dates
- [ ] Display company status
- [ ] Add inline notes editing
- [ ] Create company timeline showing all applications
- [ ] Show all replies and interactions per company
- [ ] Add loading states and empty state

## Analytics Page
- [ ] Create daily applications chart (Recharts)
- [ ] Create weekly applications chart (Recharts)
- [ ] Create monthly applications chart (Recharts)
- [ ] Create replies chart (Recharts)
- [ ] Create rejections chart (Recharts)
- [ ] Create interviews chart (Recharts)
- [ ] Display response rate metric
- [ ] Display bounce rate metric
- [ ] Create top domains chart (Recharts)
- [ ] Create top companies chart (Recharts)
- [ ] Create application trend chart (Recharts)
- [ ] Add date range selector for filtering
- [ ] Add loading skeletons for all charts

## Activity Log Page
- [ ] Create activity log table with columns: action, description, timestamp
- [ ] Implement search and filter by action type
- [ ] Add pagination
- [ ] Display icons for different action types
- [ ] Add timestamp formatting (relative time)
- [ ] Create empty state for no activities
- [ ] Add loading skeletons

## Settings Page
- [ ] Create profile section (name, email, phone, portfolio, github, linkedin, signature)
- [ ] Add default resume selector
- [ ] Add default subject field
- [ ] Add daily send limit input
- [ ] Add delay between emails input
- [ ] Create Gmail settings section (API key, SMTP settings)
- [ ] Create Google Sheets settings section (spreadsheet ID, worksheet name)
- [ ] Add "Test Connection" button for Gmail
- [ ] Add "Test Connection" button for Google Sheets
- [ ] Add "Sync Now" button for Google Sheets
- [ ] Add "View Sync Logs" button
- [ ] Implement theme toggle (dark/light)
- [ ] Add save/cancel buttons with confirmation
- [ ] Add loading states for settings updates

## Global Search (Ctrl+K Command Palette)
- [ ] Implement command palette component
- [ ] Add Ctrl+K keyboard shortcut
- [ ] Implement search across companies
- [ ] Implement search across HR emails
- [ ] Implement search across statuses
- [ ] Implement search across resumes
- [ ] Implement search across notes
- [ ] Implement search across dates
- [ ] Add fuzzy search functionality
- [ ] Display search results with icons and metadata
- [ ] Add keyboard navigation (arrow keys, enter to select)
- [ ] Add empty state for no results

## System Features
- [ ] Implement activity logging for all actions
- [ ] Create toast notification system
- [ ] Add loading skeletons throughout app
- [ ] Create empty state components for all pages
- [ ] Add error state handling
- [ ] Implement confirmation dialogs for destructive actions
- [ ] Add keyboard shortcuts documentation
- [ ] Implement duplicate detection algorithm
- [ ] Create bounce detection logic (scan Gmail for delivery failures)
- [ ] Implement Google Sheets sync functionality

## Testing & Quality
- [ ] Write vitest tests for database queries
- [ ] Write vitest tests for API endpoints
- [ ] Write vitest tests for duplicate detection logic
- [ ] Write vitest tests for variable substitution
- [ ] Test all forms and validations
- [ ] Test responsive design on mobile
- [ ] Test dark/light mode switching
- [ ] Test keyboard shortcuts
- [ ] Test search functionality
- [ ] Performance testing and optimization

## Deployment & Documentation
- [ ] Create comprehensive README.md
- [ ] Create installation guide
- [ ] Create deployment guide
- [ ] Create environment variables template (.env.example)
- [ ] Create seed data script with sample templates and analytics
- [ ] Optimize build and bundle size
- [ ] Set up CI/CD pipeline
- [ ] Create API documentation
- [ ] Create user guide/help documentation

## Completed Features
(Completed items will be moved here)
