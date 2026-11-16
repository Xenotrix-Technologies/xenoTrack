# Xenotrack — Institute Management System

A full-stack, local-first institute management system for tuition centres, gyms, sports academies, dance classes, and any membership or class-based organisation.

---

## Architectural Overview

Xenotrack is engineered with two modern architectural patterns:
1. **Frontend**: **Feature-Based + Layered Architecture**
2. **Backend**: **Modular Monolith + Clean Architecture (Controller -> Service -> Repository)**

---

## Features

| Module | Capabilities |
|---|---|
| **Auth** | JWT login, refresh tokens, role-based access (Admin / Staff), bcrypt passwords |
| **Dashboard** | Metrics, dynamic charts (Recharts), recent activity, attendance trends |
| **Members** | Full CRUD, search, status filters, member profile, enrollment history |
| **Programs** | Create and manage academic / training programs with default fee plans |
| **Groups** | Batch & group management with schedules, assigned staff, capacities |
| **Attendance** | Session-based marking, batch entry, edit window, attendance history |
| **Fee Plans** | Configurable billing cycles, late fee grace periods, discounts |
| **Fee Records** | Auto-calculated balances, status tracking, overdue monitoring |
| **Payments** | Full/partial payments, printable receipts, reversible audit transactions |
| **Reports** | Attendance, fee collections, outstanding balances with CSV export |
| **Settings** | Institute configuration, custom fields, audit activity logs |
| **Security** | Rate limiting, parameterized SQL queries, JWT verification, RBAC |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite |
| **Frontend Architecture** | Feature-Based + Layered Architecture (`features/`, `shared/`) |
| **Routing & State** | React Router v7, React Context API (`AuthContext`) |
| **UI & Styling** | Custom CSS Design System (`styles/global.css`) + React Icons + Recharts |
| **HTTP Client** | Axios with automated token refresh interceptors |
| **Backend Framework** | Node.js + Express.js |
| **Backend Architecture** | Modular Monolith + Clean Architecture (3-Tier Layering) |
| **Database** | PostgreSQL 15+ (Default) / MySQL 8+ |
| **Auth** | JWT (15m access token + 7d refresh token) + bcryptjs |
| **Validation** | express-validator |
| **Testing** | Jest + Supertest (Backend unit and integration tests) |

---

## Project Structure

```
xenoTrack/
├── backend/
│   ├── src/
│   │   ├── app.js                          # Express app configuration & modular route mounting
│   │   ├── server.js                       # Server entry point & DB connection check
│   │   ├── core/                           # Shared cross-cutting concerns & foundational layer
│   │   │   ├── config/                     # Database pool (PostgreSQL/MySQL), JWT configuration
│   │   │   ├── database/                   # Centralized database interface
│   │   │   ├── middleware/                 # auth, validate, errorHandler
│   │   │   └── utils/                      # activityLogger, helpers
│   │   └── modules/                        # Domain feature modules (Modular Monolith)
│   │       ├── auth/                       # controller, service, repository, routes
│   │       ├── dashboard/                  # controller, service, repository, routes
│   │       ├── members/                    # controller, service, repository, routes
│   │       ├── programs/                   # controller, service, repository, routes
│   │       ├── groups/                     # controller, service, repository, routes (groups & enrollments)
│   │       ├── staff/                      # controller, service, repository, routes
│   │       ├── attendance/                 # controller, service, repository, routes
│   │       ├── fees/                       # controller, service, repository, routes
│   │       ├── payments/                   # controller, service, repository, routes
│   │       ├── reports/                    # controller, service, repository, routes
│   │       └── settings/                   # controller, service, repository, routes
│   ├── __tests__/                          # Jest test suites (auth, calculations)
│   ├── .env.example                        # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                         # Main router & route guard definitions
│   │   ├── main.jsx                        # Application root render & toast container
│   │   ├── features/                       # Feature-sliced modules
│   │   │   ├── auth/                       # pages (LoginPage), services, index
│   │   │   ├── dashboard/                  # pages (AdminDashboard, StaffDashboard), services, index
│   │   │   ├── members/                    # pages (MembersPage, MemberProfile), services, index
│   │   │   ├── programs/                   # pages (ProgramsPage), services, index
│   │   │   ├── groups/                     # pages (GroupsPage, GroupDetail), services, index
│   │   │   ├── staff/                      # pages (StaffPage, ProfilePage), services, index
│   │   │   ├── attendance/                 # pages (AttendancePage, MarkAttendance), services, index
│   │   │   ├── fees/                       # pages (FeePlansPage, FeeRecordsPage), services, index
│   │   │   ├── payments/                   # pages (PaymentsPage, ReceiptPage), services, index
│   │   │   ├── reports/                    # pages (AttendanceReport, CollectionReport, OutstandingReport), services, index
│   │   │   └── settings/                   # pages (SettingsPage, ActivityLogsPage), services, index
│   │   ├── shared/                         # Reusable shared layer
│   │   │   ├── api/                        # Axios instance with interceptors
│   │   │   ├── components/
│   │   │   │   ├── layout/                 # AppLayout, Sidebar, Topbar
│   │   │   │   └── ui/                     # Reusable UI primitives (Modal)
│   │   │   ├── context/                    # AuthContext & useAuth hook
│   │   │   └── pages/                      # NotFoundPage
│   │   ├── services/                       # Centralized feature service re-exports
│   │   └── styles/                         # Global theme & typography styles (global.css)
│   ├── .env.example                        # Frontend environment template
│   ├── vite.config.js                      # Vite config with local proxy to :5000
│   └── package.json
│
├── database/
│   ├── postgres/                           # PostgreSQL schema and seed
│   │   ├── schema.sql                      # 17 PostgreSQL tables with relational integrity
│   │   └── seed.sql                        # Default local development demo data
│   ├── mysql/                              # MySQL schema and seed
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── schema.sql                          # Primary database schema (PostgreSQL)
│   └── seed.sql                            # Primary seed data (PostgreSQL)
│
├── docker-compose.yml                      # Optional local MySQL container
├── package.json                            # Root orchestration scripts
└── README.md
```

---

## Prerequisites

- **Node.js**: ≥ 18
- **PostgreSQL**: 15+ (Default local database)

---

## Quick Start (Local Setup)

### 1. Database Setup (PostgreSQL)

Create the local database and run the schema and seed scripts:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE xenotrack;"

# Run schema and seed
psql -U postgres -d xenotrack -f database/postgres/schema.sql
psql -U postgres -d xenotrack -f database/postgres/seed.sql
```

*(Alternatively, use `database/schema.sql` and `database/seed.sql` which default to PostgreSQL).*

---

### 2. Configure Environment Files

**Backend:**
Copy `backend/.env.example` to `backend/.env` (configured for PostgreSQL on port 5432 with default user `postgres` / password `root`).

**Frontend:**
Copy `frontend/.env.example` to `frontend/.env` (configured for `http://localhost:5000/api`).

---

### 3. Install Dependencies & Start Services

You can install and run both servers from the project root or individually:

#### Option A: From Root
```bash
# Install dependencies for both backend and frontend
npm run install:all

# In terminal 1: Start backend
npm run start:backend

# In terminal 2: Start frontend
npm run start:frontend
```

#### Option B: Individually
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

- Backend API: **http://localhost:5000**
- Frontend Client: **http://localhost:3000**

---

## Demo Credentials (Local Development)

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@xenotrack.com | 12345xeno |
| **Staff** | staff@xenotrack.local | Staff@1234 |

---

## Running Verification & Tests

### Backend Unit & Integration Tests
```bash
npm run test:backend
# or: cd backend && npm test
```
All 17 test suites verify authentication, calculations, permissions, and database operations.

### Frontend Production Build
```bash
npm run build:frontend
# or: cd frontend && npm run build
```
Compiles with Vite with zero errors.

---

## API Endpoints

| Module | Route | Methods |
|---|---|---|
| **Auth** | `/api/auth` | `POST /login`, `POST /logout`, `POST /refresh`, `GET /me`, `POST /change-password` |
| **Dashboard** | `/api/dashboard` | `GET /admin`, `GET /staff` |
| **Members** | `/api/members` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `PATCH /:id/status` |
| **Programs** | `/api/programs` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Groups** | `/api/groups` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `POST /:id/staff`, `DELETE /:id/staff/:staffId` |
| **Enrollments** | `/api/enrollments` | `POST /`, `PATCH /:id` |
| **Staff** | `/api/staff` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `POST /:id/reset-password` |
| **Attendance** | `/api/attendance` | `GET /sessions`, `POST /sessions`, `GET /sessions/:id`, `POST /records/bulk`, `PUT /records/:id` |
| **Fees** | `/api/fees` | `GET /plans`, `POST /plans`, `PUT /plans/:id`, `GET /records`, `POST /records`, `PUT /records/:id` |
| **Payments** | `/api/payments` | `GET /`, `POST /`, `GET /:id/receipt`, `POST /:id/reverse` |
| **Reports** | `/api/reports` | `GET /attendance`, `GET /collections`, `GET /outstanding-fees` |
| **Settings** | `/api/settings` | `GET /`, `PUT /`, `GET /activity-logs` |
| **Health** | `/api/health` | `GET /` |

---

## Security Features

- **bcrypt Hashing**: Passwords stored as salted bcrypt hashes.
- **Dual-Token JWT**: Short-lived access tokens (15m) + secure rotating refresh tokens (7d).
- **Brute-Force Protection**: Rate limiting on sensitive authentication routes (`express-rate-limit`).
- **Parameterized SQL Queries**: Complete protection against SQL injection.
- **RBAC & Multi-Tenant Scoping**: Role (`admin`/`staff`) and institute-level scoping enforced on all routes.
- **Financial Audit Logging**: Non-destructive payment reversals and full activity trail.

---

## License

MIT
