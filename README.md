# School Management System

A production-ready, multi-tenant School Management System built with NestJS, Next.js, and PostgreSQL.

## Tech Stack

**Backend:**
- NestJS with TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Role-Based Access Control (RBAC)

**Frontend:**
- Next.js 14 (App Router)
- Material UI
- TanStack Query
- Zustand (State Management)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your database connection string
   DATABASE_URL="postgresql://postgres:password@localhost:5432/sms_dev?schema=public"
   ```

3. **Setup the database:**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Seed the database with demo data:**
   ```bash
   npx prisma db seed
   ```

5. **Start the development servers:**
   ```bash
   # From root directory
   npm run dev
   
   # Or run separately:
   # Backend: cd backend && npm run dev
   # Frontend: cd frontend && npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Swagger Docs: http://localhost:3001/api/docs

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@sms.com | admin123 |
| School Admin | admin@demoschool.edu | admin123 |
| Teacher | teacher@demoschool.edu | admin123 |
| Student | student1@demoschool.edu | admin123 |

## Project Structure

```
SMS/
├── backend/               # NestJS Backend
│   ├── prisma/            # Database schema and migrations
│   └── src/
│       ├── auth/          # Authentication module
│       ├── common/        # Shared utilities, guards, decorators
│       ├── users/         # User management
│       ├── schools/       # Multi-tenant schools
│       ├── students/      # Student management
│       ├── teachers/      # Teacher management
│       ├── classes/       # Class management
│       ├── subjects/      # Subject management
│       ├── enrollment/    # Enrollment tracking
│       ├── attendance/    # Attendance marking
│       ├── exams/         # Exam management
│       ├── grades/        # Grade management
│       ├── fees/          # Fee structures
│       ├── payments/      # Invoices & payments
│       └── reports/       # Academic & financial reports
│
└── frontend/              # Next.js Frontend
    └── src/
        ├── app/           # App router pages
        ├── components/    # Reusable components
        ├── lib/           # API client, store
        └── types/         # TypeScript types
```

## Features

### Multi-Tenant Architecture
- Row-level security via schoolId
- SuperAdmin can manage all schools
- School users isolated to their school

### Role-Based Access Control
- **SuperAdmin**: Full system access
- **SchoolAdmin**: Manage school data
- **Teacher**: Mark attendance, grades
- **Student**: View own data
- **Parent**: View child's data

### Core Modules
1. **Authentication**: JWT with refresh tokens
2. **User Management**: CRUD with role assignment
3. **Student Management**: Enrollment, profiles
4. **Teacher Management**: Assignments, classes
5. **Class Management**: Grades, sections
6. **Subject Management**: Curriculum
7. **Attendance**: Daily marking, bulk entry
8. **Exams**: Multiple types, scheduling
9. **Grades**: Scoring, publishing
10. **Fees**: Structures, invoicing
11. **Payments**: Partial payments, tracking
12. **Reports**: Dashboard, exports

## API Documentation

Full API documentation available at `/api/docs` when the backend is running.

## License

MIT
