# AttendPro - Attendance Management System

A full-stack employee attendance management system with morning/afternoon sessions, JWT authentication, role-based access, and IP address restrictions.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Shadcn UI |
| Backend  | Node.js, Express, TypeScript        |
| Database | MySQL with Prisma ORM               |
| Auth     | JWT (access + refresh tokens), role-based access |

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   └── seed.ts             # Demo data
│   └── src/
│       ├── config/             # Environment & database config
│       ├── controllers/        # Request handlers
│       ├── middleware/         # Auth, IP restriction, rate limiting, validation
│       ├── routes/             # API route definitions
│       ├── services/           # Business logic
│       ├── types/              # Shared TypeScript types
│       ├── utils/              # JWT, logging, helpers
│       ├── validators/         # Zod validation schemas
│       ├── app.ts
│       └── server.ts
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       │   ├── login/          # Login page
│       │   ├── employee/       # Employee attendance portal
│       │   └── admin/          # Admin dashboard, users, IPs, records
│       ├── components/         # UI components (Shadcn-style)
│       ├── contexts/           # Auth context provider
│       ├── lib/                # API client & utilities
│       └── types/              # Frontend types
└── README.md
```

## Features

- **Employee Attendance** — Morning and afternoon check-in/check-out sessions
- **Admin Dashboard** — Real-time stats, attendance records, employee & IP management
- **JWT Authentication** — Access tokens with refresh token rotation
- **Role-Based Access** — Separate ADMIN and EMPLOYEE portals
- **IP Restriction** — Attendance only allowed from whitelisted office IPs
- **Late Detection** — Automatic LATE status based on configurable thresholds
- **Session Windows** — Check-in restricted to defined morning/afternoon time windows

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm

## Setup

### 1. Database

```sql
CREATE DATABASE attendance_db;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secrets

npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

API runs at `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local

npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Demo Credentials

| Role     | Email                  | Password       |
|----------|------------------------|----------------|
| Admin    | admin@company.com      | Admin123!      |
| Employee | john.doe@company.com   | Employee123!   |

## API Endpoints

### Auth
| Method | Endpoint            | Access | Description          |
|--------|---------------------|--------|----------------------|
| POST   | /api/auth/login     | Public | Login                |
| POST   | /api/auth/register  | Admin  | Register employee    |
| POST   | /api/auth/refresh   | Public | Refresh access token |
| GET    | /api/auth/me        | Auth   | Current user         |

### Attendance
| Method | Endpoint               | Access   | Description             |
|--------|------------------------|----------|-------------------------|
| POST   | /api/attendance/check  | Employee | Check in/out (IP gated) |
| GET    | /api/attendance/today  | Auth     | Today's attendance      |
| GET    | /api/attendance/history| Auth     | Personal history        |
| GET    | /api/attendance/all    | Admin    | All attendance records  |
| GET    | /api/attendance/stats  | Admin    | Dashboard statistics    |

### Admin
| Method | Endpoint                    | Access | Description        |
|--------|-----------------------------|--------|--------------------|
| GET    | /api/admin/users            | Admin  | List employees     |
| PATCH  | /api/admin/users/:id        | Admin  | Update employee    |
| DELETE | /api/admin/users/:id        | Admin  | Delete employee    |
| GET    | /api/admin/ips              | Admin  | List allowed IPs   |
| POST   | /api/admin/ips              | Admin  | Add allowed IP     |
| PATCH  | /api/admin/ips/:id/toggle   | Admin  | Enable/disable IP  |
| DELETE | /api/admin/ips/:id          | Admin  | Remove IP          |

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=mysql://user:password@localhost:3306/attendance_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=http://localhost:3000
IP_RESTRICTION_ENABLED=true
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## License

MIT
