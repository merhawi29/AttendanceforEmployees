# AttendPro - HRMS Enterprise & Attendance Management System

**AttendPro** is a comprehensive, full-stack Human Resource Management System (HRMS) and Employee Attendance Portal. It features dynamic attendance time window validation, Performance KPI Management with multi-tier approval workflows, Corporate Asset Return with physical admin verification, report generation (PDF, Excel, Print), JWT authentication, role-based access control (RBAC), and office IP address restrictions.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod Validation |
| **Database** | MySQL with Prisma ORM |
| **Auth & Security** | JWT (Access + Refresh Tokens), Role-Based Access Control (RBAC), Password Hashing (bcrypt), IP Whitelisting |
| **Reports** | JSPDF, XLSX, Window Print API |

---

## 🌟 Key Modules & Features

### 1. 🕒 Employee Attendance & Dynamic Time Windows
- **Morning Check-In**: Enabled from `06:30 AM` through `08:45 AM` (Early arrivals before 08:30 are allowed and not marked late).
- **Lunch Out**: Available after `12:30 PM`.
- **Lunch Return**: Available after Lunch Out until `01:30 PM`.
- **Final Checkout**: Available after `05:30 PM`.
- **Real-Time Button Sync**: Frontend updates button states every second based on dynamic backend settings.
- **Backend Time Validation**: Enforces exact time-window rules before accepting punch API requests.

### 2. 🎯 Performance Management Module
- **KPI Goal Tracking**: Assign and monitor progress percentage, target dates, and deliverables.
- **Employee Progress Notes**: Submissions support quick percentages (0%, 25%, 50%, 75%, 100%) and accomplishment notes.
- **Completion Request Workflow (`COMPLETION_REQUESTED`)**: Submitting 100% progress **does NOT** automatically complete the goal. It changes the status to `COMPLETION_REQUESTED` and alerts the manager.
- **Manager/Admin Review & Approval**: Authorized managers physically review completion requests with **Approve Completion** (marks `COMPLETED`) or **Reject** (reverts status to `IN_PROGRESS` with feedback).
- **Scope Authorization**: Managers can only review goals for direct reports or employees in their authorized department.
- **Audit Trail History**: Full log of previous progress updates, notes, and approval/rejection feedback (`GoalProgressHistory`).

### 3. 💻 Corporate Asset Management & Return Workflow
- **Inventory & Valuation**: Register laptops, mobile devices, RFID ID cards, monitors, valuation, and serial numbers.
- **Employee Self-Service**: View issued corporate equipment on *My Assigned Corporate Assets*.
- **Physical Asset Return Workflow**:
  - Employee physically returns hardware to Admin/Asset Officer and clicks **Request Return**.
  - Creates a return request with status `PENDING`, assignment status `RETURN_PENDING`, while asset remains `ASSIGNED`.
  - Admin opens **Asset Management → Return Requests** and physically inspects the device.
  - Admin enters verified condition, inspection comments, or mandatory rejection reasons.
  - **Transactional Approval/Rejection**:
    - **Approve Return**: Request = `APPROVED`, Assignment = `RETURNED`, Asset = `AVAILABLE`.
    - **Reject Return**: Request = `REJECTED`, Assignment = `ACTIVE`, Asset = `ASSIGNED` (with mandatory rejection reason displayed to employee).
- **Asset History & Audit Trail**: Complete historical record preserved even when hardware is reassigned.

### 4. 🗂️ Reports & Analytics
- Export attendance, payroll, and asset data directly to **PDF**, **Excel (.xlsx)**, or **Print-ready** formats.

### 5. 🔙 Universal UI & Dark Mode Navigation
- Universal **Back Navigation** button across all 33+ pages in the dashboard layout.
- Seamless Dark/Light theme toggle with persistent user preferences.

---

## 📁 Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & Prisma models
│   │   └── seed.ts             # Seed data generator
│   └── src/
│       ├── config/             # DB & environment configuration
│       ├── controllers/        # Express request controllers
│       ├── middleware/         # Auth, RBAC, IP restriction, rate limiting
│       ├── routes/             # API route definitions
│       ├── services/           # Business logic & database operations
│       ├── types/              # Backend TypeScript interfaces
│       ├── utils/              # JWT, response helpers, time formatters
│       └── validators/         # Zod schemas
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       │   ├── login/          # Login & password reset page
│       │   ├── employee/       # Employee self-service portal
│       │   └── admin/          # Admin dashboard & management pages
│       ├── components/         # UI components & DashboardLayout
│       ├── contexts/           # Auth & Theme providers
│       ├── lib/                # API client, time helpers, report exports
│       └── types/              # Frontend TypeScript interfaces
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: v18+
- **MySQL**: v8.0+
- **npm**: v9+

### 1. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE attendance_db;
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL and JWT secrets in .env

npm install
npx prisma db push
npx prisma generate
npm run db:seed
npm run dev
```
Backend API will start at `http://localhost:4000`.

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local

npm install
npm run dev
```
Frontend Web App will start at `http://localhost:3000`.

---

## 🔑 Demo Credentials

| Role | Email / ID | Password |
|---|---|---|
| **Admin** | `merhawinguse30@gmail.com` | `admin123` |
| **Employee** | `john.doe@company.com` (`EMP002`) | `employee123` |

---

## 🌐 API Endpoint Reference

### Auth & User
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & issue tokens |
| `POST` | `/api/auth/refresh` | Public | Refresh JWT access token |
| `GET` | `/api/auth/me` | Auth | Get current user profile |

### Attendance
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/attendance/check` | Employee | Punch attendance (`MORNING_IN`, `LUNCH_OUT`, `LUNCH_RETURN`, `FINAL_OUT`) |
| `GET` | `/api/attendance/today` | Auth | Get today's attendance & button availability |
| `GET` | `/api/attendance/history` | Auth | View personal attendance log |
| `GET` | `/api/attendance/all` | Admin | View all employee attendance records |

### Performance Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/performance/goals` | Auth | List assigned KPI performance goals |
| `POST` | `/api/performance/goals` | Admin | Create & assign new employee goal |
| `PATCH` | `/api/performance/goals/:goalId/progress` | Employee | Submit progress update & note (100% -> `COMPLETION_REQUESTED`) |
| `POST` | `/api/performance/goals/:goalId/review-completion` | Admin/Manager | Approve (`COMPLETED`) or Reject (`IN_PROGRESS`) request |
| `GET` | `/api/performance/goals/:goalId/history` | Auth | Get goal progress audit trail history |

### Corporate Asset Management & Return
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/assets` | Admin | List corporate asset inventory |
| `POST` | `/api/assets` | Admin | Register new hardware asset |
| `POST` | `/api/assets/assign` | Admin | Issue asset to employee |
| `GET` | `/api/assets/my-assets` | Employee | List employee assigned assets |
| `POST` | `/api/assets/return-requests` | Employee | Create asset return request (`PENDING`) |
| `GET` | `/api/assets/return-requests/my` | Employee | List personal asset return requests |
| `GET` | `/api/assets/return-requests` | Admin | List all pending/processed return requests |
| `POST` | `/api/assets/return-requests/:requestId/approve` | Admin | Approve asset return (`AVAILABLE`) |
| `POST` | `/api/assets/return-requests/:requestId/reject` | Admin | Reject asset return (with mandatory reason) |

---

## 📄 License
Distributed under the **MIT License**.
