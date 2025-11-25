# App Directory

## Overview
This directory contains the core application structure using Next.js 15 App Router. It includes all pages, API routes, and layout configurations for the Campus Placement Portal.

## Structure

### Root Files
- `layout.tsx` - Root layout component that wraps all pages with theme provider, auth context, and global UI elements
- `page.tsx` - Landing page with hero section and feature highlights
- `globals.css` - Global CSS styles and Tailwind directives

### Main Routes

#### `/admin`
Administrative dashboard and management interface.
- `page.tsx` - Main admin dashboard with statistics and reports
- `applications/` - Manage student job applications
- `grievance/` - Handle student grievances and complaints
- `settings/` - Administrative settings and configurations

#### `/applications`
Student view of their job applications and status tracking.

#### `/dashboard`
Student dashboard showing personalized information, upcoming deadlines, and quick actions.

#### `/jobs`
Job listings and application interface.
- `page.tsx` - Browse all available job postings
- `[id]/` - Individual job details and application form

#### `/profile`
Student profile management where users can view and update their personal information, academic details, and resume.

#### `/register`
New student registration flow for completing profile after email verification.

#### `/grievance`
Student interface for submitting and tracking grievances.

#### `/settings`
User settings for account preferences and notifications.

#### `/reset-password`
Password reset interface for users who forgot their credentials.

### Authentication Routes

#### `/auth/callback`
Handles OAuth callbacks and email verification redirects from Supabase.

#### `/auth/verify`
Email verification success page.

### API Routes (`/api`)

#### Admin APIs (`/api/admin`)
- `activities/` - CRUD operations for activity logs
- `application-rounds/` - Manage job application rounds
- `applications/` - View and manage all applications
- `company-report/` - Generate company-wise placement reports
- `grievances/` - Handle grievance submissions
- `jobs/` - Create, update, delete job postings
- `students/` - Manage student records
- `auth/` - Admin authentication
- `clear-cache/` - Cache management endpoint
- `download-student-data/` - Export student data
- `notifications/send/` - Send bulk notifications
- `placement-policy/` - Manage placement policies
- `registrations/` - View pending registrations
- `resume/download/` - Download student resumes
- `setup-activities/` - Initialize activity tracking

#### Student APIs (`/api/student`)
- `profile/` - Get and update student profile
- `applications/` - Student's application history
- `application-rounds/` - Available application rounds
- `settings/` - User preferences

#### General APIs
- `check-user/` - Verify user existence
- `grievance/` - Submit and retrieve grievances
- `notifications/` - User notifications
- `send-email/` - Email service integration
- `health/` - System health check endpoint
- `metrics/` - Performance metrics for monitoring

## Key Features

### Server-Side Rendering
Most pages use server-side rendering for better performance and SEO.

### API Route Handlers
All API routes follow REST conventions with proper error handling and authentication checks.

### Authentication Flow
1. User registers with college email
2. Email verification link sent
3. Complete profile registration
4. Access dashboard and features

### Role-Based Access
- Students: Limited to their own data and applications
- Admins: Full access to all data and management features

## Development Notes

### File Conventions
- `page.tsx` - Route page component
- `layout.tsx` - Shared layout for route segment
- `loading.tsx` - Loading UI for async operations
- `route.ts` - API route handler

### Data Fetching
Uses React Server Components for efficient data fetching without client-side JavaScript overhead.

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations

## Best Practices

1. Keep page components focused on rendering
2. Move business logic to API routes
3. Use server components by default
4. Add "use client" only when needed (forms, interactivity)
5. Implement proper error boundaries
6. Use loading states for better UX
