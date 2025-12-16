# Daily Work Report Management Application

## Overview
This project is a daily work report management system for employees and administrators. It enables employees to create detailed daily reports with operation entries (client work, work orders, time tracking), while administrators can review, approve, and export these reports. The system features a mobile-first design for employees and a comprehensive desktop interface for administrators, aiming to streamline work tracking and reporting processes.

## User Preferences
Preferred communication style: Simple, everyday language.
Date format: DD/MM/YYYY (Italian format) for all date displays in the application.

## System Architecture

### Frontend
- **Technology**: React 18+ with TypeScript, Shadcn/ui (built on Radix UI), Tailwind CSS for styling (with light/dark mode), Wouter for routing.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **Design**: Mobile-first responsive design for employees; desktop-optimized for administrators.
- **Forms**: React Hook Form with Zod validation.

### Backend
- **Technology**: Express.js with TypeScript.
- **Database**: PostgreSQL (Neon serverless) via Drizzle ORM.
- **Data Model**: Includes Users (employee/admin roles), Clients, Work Orders, Daily Reports, and Operations (individual work entries).
- **PDF/Word Generation**: PDFMake for PDF exports, Docx for Word exports (with image support via Sharp).
- **Session Management**: Express sessions with PostgreSQL store.
- **Authentication**: Simple username/password login with role-based access control.
- **Multi-tenancy**: Strict `organizationId` filtering at all data access and export layers to ensure data isolation.
- **Push Notifications**: Browser-native push notifications for employees, reminding them to submit daily reports, scheduled daily at 19:00.
- **Performance**: Database indexes for common queries, optimized API calls for report submission, and UI-level duplicate submission prevention.

### Key Features
- **Daily Report Creation**: Employees can create reports with detailed operations including time and work types.
- **Report Approval Workflow**: Administrators can review and approve daily reports.
- **Data Export**: Reports can be exported as PDF or Word documents.
- **Photo Upload**: Supports uploading up to 5 photos per operation, integrated into Word exports, with camera capture capabilities.
- **Automated Reminders**: Push notification system to remind employees to submit reports.

## External Dependencies

### Core Technologies
- **Frontend**: React, TypeScript, Vite.
- **Backend**: Express.js, Node.js.

### Database & ORM
- **Database**: Neon (PostgreSQL).
- **ORM**: Drizzle ORM, Drizzle Kit.

### UI & Styling
- **Component Libraries**: Radix UI, Shadcn/ui.
- **Styling**: Tailwind CSS.
- **Icons**: Lucide React.

### Form & Validation
- **Form Management**: React Hook Form.
- **Validation**: Zod, Hookform Resolvers.

### Utilities
- **Server State**: TanStack Query.
- **Date Handling**: Date-fns.
- **CSS Utilities**: Class Variance Authority, clsx, Tailwind Merge.
- **Scheduling**: Node-cron.

### Document Generation & Image Processing
- **Word Export**: Docx.
- **Image Processing**: Sharp.
- **PDF Export**: PDFMake.

### Push Notifications
- **Library**: Web-push.

### Development Tools
- TSX, ESBuild, PostCSS.

## Data Migration & Backup

### Export Script
Per esportare tutti i dati dal database in formato SQL:
```bash
npx tsx scripts/export-data.ts > backup_$(date +%Y%m%d).sql
```

### Import su altro database
```bash
psql "postgresql://user:password@host:5432/database?sslmode=require" < backup.sql
```

### Tabelle gestite (in ordine di export/import)
1. organizations
2. clients
3. users
4. work_types
5. materials
6. work_orders
7. vehicles
8. daily_reports
9. operations
10. attendance_entries
11. hours_adjustments
12. fuel_refills
13. fuel_tank_loads

### Note sulla migrazione
- Lo script rispetta le foreign key constraints
- I caratteri speciali (apostrofi, newline) sono gestiti correttamente
- L'import è transazionale (BEGIN/COMMIT)
- Prima dell'import vengono cancellati i dati esistenti