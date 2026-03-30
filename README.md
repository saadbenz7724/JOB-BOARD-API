# 💼 Job Board REST API

A production-ready Job Board REST API built with **NestJS**, **MySQL**, and **Redis**. Supports two roles — Recruiter and Candidate — with full job posting, application tracking, and pipeline management.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| NestJS + Node.js | Backend framework |
| MySQL + TypeORM | Database & ORM |
| Redis + ioredis | Caching layer |
| JWT + bcryptjs | Authentication & security |
| Passport.js | Auth strategies |
| class-validator | Request validation |

---

## ✨ Key Features

- **JWT Authentication** with refresh token rotation
- **Role Based Access Control** — Recruiter and Candidate roles
- **Job posting** with filters — location, type, salary, experience, skills
- **Pagination** on all list endpoints
- **Application pipeline** — applied → shortlisted → interview → offered → rejected
- **Pipeline transition validation** — invalid jumps blocked
- **Recruiter dashboard** — job stats, application stats, pipeline overview
- **Candidate dashboard** — application summary, status breakdown
- **Redis caching** on both dashboards with automatic cache invalidation
- **Global exception filter** — consistent error format across all endpoints
- **Request logging** — every request logged with response time

---

## 📁 Project Structure
```
src/
├── auth/               # JWT auth, refresh tokens, login, register
├── users/              # User entity with recruiter/candidate roles
├── jobs/               # Job CRUD with filters and pagination
├── applications/       # Apply, pipeline tracking, withdraw
├── dashboard/          # Recruiter and candidate dashboards
├── redis/              # Redis service wrapper
└── common/
    ├── decorators/     # @CurrentUser(), @Roles()
    ├── guards/         # JwtAuthGuard, RolesGuard
    ├── filters/        # Global exception filter
    └── interceptors/   # Response + logging interceptors
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MySQL 8+
- Redis

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-username/job-board-api.git
cd job-board-api
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your MySQL password and secrets
```

**4. Create the database**
```sql
CREATE DATABASE job_board;
```

**5. Start the server**
```bash
npm run start:dev
```

Server runs at `http://localhost:4000/api/v1`

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Recruiter** | Post jobs, update jobs, close jobs, view applications, move pipeline |
| **Candidate** | Search jobs, apply to jobs, track applications, withdraw |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register as recruiter or candidate |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ❌ | Logout |
| GET | `/auth/me` | ✅ | Get current user |

### Jobs
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/jobs` | ✅ Both | Get all active jobs with filters |
| GET | `/jobs/:id` | ✅ Both | Get single job |
| POST | `/jobs` | 🔵 Recruiter | Create job |
| GET | `/jobs/my-jobs` | 🔵 Recruiter | Get my posted jobs |
| PATCH | `/jobs/:id` | 🔵 Recruiter | Update job |
| PATCH | `/jobs/:id/close` | 🔵 Recruiter | Close job |
| DELETE | `/jobs/:id` | 🔵 Recruiter | Delete job |

### Jobs — Query Params
```
?search=backend developer
?jobType=full_time|part_time|internship|contract|remote
?experienceLevel=fresher|junior|mid|senior
?location=Delhi
?skills=Node.js
?salaryMin=300000&salaryMax=800000
?page=1&limit=10
```

### Applications
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/applications` | 🟢 Candidate | Apply to job |
| GET | `/applications/my-applications` | 🟢 Candidate | My applications |
| DELETE | `/applications/:id/withdraw` | 🟢 Candidate | Withdraw application |
| GET | `/applications/job/:jobId` | 🔵 Recruiter | Job applications + pipeline |
| PATCH | `/applications/:id/status` | 🔵 Recruiter | Update application status |
| GET | `/applications/:id` | ✅ Both | Get single application |

### Application Pipeline
```
applied → shortlisted → interview → offered
                    ↘           ↘         ↘
                   rejected   rejected  rejected
```

### Dashboard
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/dashboard/recruiter` | 🔵 Recruiter | Recruiter stats (Redis cached) |
| GET | `/dashboard/candidate` | 🟢 Candidate | Candidate stats (Redis cached) |

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "path": "/api/v1/jobs",
  "timestamp": "2025-03-30T10:00:00.000Z",
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied. Required role: recruiter",
  "errors": null,
  "path": "/api/v1/jobs",
  "method": "POST",
  "timestamp": "2025-03-30T10:00:00.000Z"
}
```

---

## ⚡ Redis Caching Strategy

| Endpoint | Cache TTL | Invalidated When |
|---|---|---|
| `/dashboard/recruiter` | 5 minutes | Application created/updated/withdrawn |
| `/dashboard/candidate` | 3 minutes | Application created/updated/withdrawn |

---

## 🛡️ Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT refresh token rotation** — old token revoked on every refresh
- **Role based access** — recruiters and candidates blocked from each other's routes
- Request body sanitized with **whitelist validation**

---

## 🗄️ Database Schema
```
users         → id, full_name, email, password, role, skills, experience, location
refresh_tokens → id, token, user_id, expires_at, is_revoked
jobs          → id, title, description, company, location, job_type, experience_level,
                salary_min, salary_max, skills, status, total_applications, recruiter_id
applications  → id, status, cover_letter, recruiter_note, applied_at,
                status_updated_at, candidate_id, job_id
```

---