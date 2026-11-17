# SMS System — Complete Project Report & Testing Guide

## Part 1: Project Report

### 1. Project Overview

**SMS System** (School Management System) — A full-stack application for managing school operations.

| Layer | Technology | Version | Port |
|-------|-----------|---------|------|
| Frontend | React 18.3.1 + Vite 5.3.0 + Tailwind CSS 3.4.3 | — | 5173 |
| Backend | Node.js / Express | — | 3005 |
| GraphQL Engine | Hasura v2.36.0 | — | 8084 |
| Database | PostgreSQL 15 | — | 5434 |
| State | Zustand 5.0.0 | — | — |
| GraphQL Client | @apollo/client 3.11.0 | — | — |
| Auth | JWT (HS256) + server sessions | — | — |

---

### 2. Work Completed (All Phases)

#### Phase 1: Infrastructure & Auth Foundation ✅

| Task | Description | Status |
|------|-------------|--------|
| Tailwind/PostCSS fix | `main.jsx` imports `index.css`; Tailwind utilities compiled | ✅ |
| Apollo Client | Auth link, silent token refresh, Vite proxy to `/v1/graphql` | ✅ |
| Zustand auth store | `accessToken`, `roles`, `schoolId`, `logout`, `loading` | ✅ |
| ProtectedRoute + LoadingSpinner + ErrorBoundary | Auth gating, loading states, error catching | ✅ |
| `vite build` | Zero errors | ✅ |

#### Phase 2: Authentication — 01-auth.md (15/15 operations ✅)

| Operation | Frontend File | Page |
|-----------|--------------|------|
| Login (email/phone) | `loginMutation.js` | `Login.jsx` |
| RefreshSession | `refreshSessionMutation.js` | `apolloClient.js` (silent) |
| Logout (this device) | `logoutMutation.js` | `Dashboard.jsx` |
| Logout (all devices) | `logoutAllMutation.js` | — |
| ListMySessions | `sessionsQuery.js` | `SessionManagement.jsx` |
| RevokeSession | `revokeSessionMutation.js` | `SessionManagement.jsx` |
| RevokeOtherSessions | `revokeOtherSessionsMutation.js` | `SessionManagement.jsx` |
| ListMyContexts | `contextsQuery.js` | `ContextSelector.jsx` |
| SelectContext | `selectContextMutation.js` | `ContextSelector.jsx` |
| AssignRole | `assignRoleMutation.js` | `RoleManagement.jsx` |
| RevokeRoleAssignment | `revokeRoleAssignmentMutation.js` | `RoleManagement.jsx` |
| RegisterSchool | `registerSchoolMutation.js` | `RegisterSchool.jsx` |
| ListUsers | `usersQuery.js` | `RoleManagement.jsx` / `SchoolUsers.jsx` |
| ListAvailableRoles | `availableRolesQuery.js` | (covers StaffRoleIds) |
| ListRoleAssignments | `roleAssignmentsQuery.js` | `RoleAssignments.jsx` |

#### Phase 3: Academic Setup — 02-academic-setup.md ✅

| Operation | Frontend File | Page |
|-----------|--------------|------|
| ManageAcademicYear (C/U/D) | `manageAcademicYearMutation.js` | `AcademicYears.jsx` |
| ManageGradeLevel (C/U/D) | `manageGradeLevelMutation.js` | `GradeLevels.jsx` |
| ManageGradeMonthlyFee (C/U/D) | `manageGradeMonthlyFeeMutation.js` | `GradeMonthlyFees.jsx` |
| ManageSectionSlot (C/U/D) | `manageSectionSlotMutation.js` | `SectionSlots.jsx` |
| ManageSchoolRegistrationPackage (C/U/D) | `manageSchoolRegistrationPackageMutation.js` | `RegistrationPackages.jsx` |
| ListAcademicConfig (combined) | `listAcademicConfigQuery.js` | `AcademicSetupChecklist.jsx` |

#### Phase 4: Student Registration — 03-student-registration.md ✅

| Operation | Frontend File | Page |
|-----------|--------------|------|
| RegisterStudent (all-in-one) | `registerStudentMutation.js` | `StudentRegistration.jsx` (5-step wizard) |
| CreateStudentProfile | `createStudentProfileMutation.js` | — |
| SetStudentGuardians | `setStudentGuardiansMutation.js` | — |
| CompleteStudentRegistration | `completeStudentRegistrationMutation.js` | — |
| GetRegistrationPaymentQuote | `getRegistrationPaymentQuoteQuery.js` | — |
| UpdateEnrollmentSection | `updateEnrollmentSectionMutation.js` | `EnrollmentSection.jsx` |

#### Phase 5: Data Reads — 05-data-reads.md (7/7 pages ✅)

| Page | Query File |
|------|-----------|
| MyBranches | `myBranchesQuery.js` |
| MySchool | `mySchoolQuery.js` |
| StudentsList | `studentsListQuery.js` |
| StudentDetail | `studentByIdQuery.js` |
| EnrollmentsForYear | `enrollmentsForYearQuery.js` |
| RegistrationPayments | `registrationPaymentsQuery.js` |
| SchoolUsers | `usersQuery.js` |
| RoleAssignments | `roleAssignmentsQuery.js` |

#### Phase 6: Staff Management — 04-staff.md ✅ (Frontend complete)

| Operation | Frontend File | Page |
|-----------|--------------|------|
| StaffRoleIds | `availableRolesQuery.js` | `StaffManagement.jsx` |
| ManageUser (C/U/D) | `manageUserMutation.js` | `StaffManagement.jsx` |
| ListStaff | `listStaffQuery.js` | `StaffManagement.jsx` |

#### Phase 7: Courses — 06-courses.md ✅ (Frontend complete)

| Operation | Frontend File | Page |
|-----------|--------------|------|
| ManageCourse (C/U/D) | `manageCourseMutation.js` | `CourseManagement.jsx` |
| ManageGradeCourse (C/U/D) | `manageGradeCourseMutation.js` | `GradeCourseAssignment.jsx` |
| ManageSectionCourseTeacher (C/U/D) | `manageSectionCourseTeacherMutation.js` | `SectionCourseTeacherAssignment.jsx` |
| CourseSetup list | `courseSetupQuery.js` | (used by course pages) |
| MySectionCourses list | `mySectionCoursesQuery.js` | `TeacherClasses.jsx` |

#### Phase 8: Navigation — App.jsx

23 pages wired into top navigation. All pages use responsive Tailwind design, role-based guards, and consistent UI patterns.

---

### 3. Backend Status

#### Implemented (Hasura metadata + Express webhooks)

| Step | Feature | Status |
|------|---------|--------|
| Step 01 | School registration (`RegisterSchool`) | ✅ |
| Step 02 | Sessions (`Login`, `RefreshSession`, `Logout`) | ✅ |
| Step 03 | Authorization model (`SelectContext`, `AssignRole`, `RevokeRoleAssignment`) | ✅ |
| Step 04 | Student registration (`RegisterStudent` transactional) | ✅ |
| Step 05 | Staff provisioning (`ManageUser`) | ✅ |

#### NOT Implemented (Backend Gap)

| Feature | Frontend Ready | Backend Status |
|---------|---------------|----------------|
| `ManageCourse` | ✅ | ❌ Not in `actions.graphql` |
| `ManageGradeCourse` | ✅ | ❌ Not in `actions.graphql` |
| `ManageSectionCourseTeacher` | ✅ | ❌ Not in `actions.graphql` |

Per `ROADMAP.md`, Step 06 (courses/data plane) is marked as **"next"** — not yet implemented.

---

### 4. Known Issues / Technical Debt

| # | Issue | Severity |
|---|-------|----------|
| 1 | Course actions missing on backend (`ManageCourse`, `ManageGradeCourse`, `ManageSectionCourseTeacher`) | Critical |
| 2 | `.env` files committed with secrets | Critical |
| 3 | No database migration SQL files (`hasura/migrations/default/` empty) | High |
| 4 | Empty `hasura/seeds/` directory | High |
| 5 | No pagination on list endpoints | Medium |
| 6 | No error-code list documented | Medium |
| 7 | `is_current` cascade behavior undefined | Medium |
| 8 | No integration tests for Express webhooks | Medium |
| 9 | In-memory rate limiter (should use Redis) | Medium |
| 10 | No post-login redirect | Low |

---

### 5. File Inventory

**Frontend GraphQL files:** 42 files  
**Frontend pages:** 26 pages  
**Components:** 3 (ErrorBoundary, LoadingSpinner, ProtectedRoute)  
**Store:** 1 (authStore)  
**Lib:** 1 (apolloClient)

---

## Part 2: How to Test Everything From Scratch

This guide walks through a complete end-to-end test of the SMS System from a clean slate.

---

### Prerequisites

Before starting, ensure you have:

- Docker installed and running (Docker Desktop or Docker Engine)
- Docker Compose available
- Node.js (v20+) and yarn installed
- A terminal/command prompt

---

### Step 1: Start the Backend Stack

#### 1.1 Navigate to the backend directory

```bash
cd /home/melese/SMS_System/SMS_Backend
```

#### 1.2 Verify `.env` files are correct

The ports should already match Docker Compose (`3005/5434/8084`). Verify:

**`SMS_Backend/.env`:**

```env
PORT=3005
DATABASE_URL=postgres://smb_user:smb_pass@localhost:5434/smb_db
ACCESS_TOKEN_SECRET=smb_access_token_secret_min_32_chars
ACTION_SECRET=smb_action_secret
HASURA_GRAPHQL_ADMIN_SECRET=smb_hasura_admin_secret
HASURA_ACTION_BASE_URL=http://app:3005
POSTGRES_PUBLISH_PORT=5434
HASURA_PUBLISH_PORT=8084
API_PUBLISH_PORT=3005
```

**`SMS_Backend/api/.env`:**

```env
PORT=3005
DATABASE_URL=postgres://smb_user:smb_pass@localhost:5434/smb_db
ACCESS_TOKEN_SECRET=smb_access_token_secret_min_32_chars
ACTION_SECRET=smb_action_secret
CORS_ORIGIN=http://localhost:5173
```

#### 1.3 Start the full stack

```bash
yarn setup
```

This will:
- Build and start Docker containers (Postgres, Hasura, Express API)
- Wait for Postgres and Hasura to be healthy
- Apply Hasura metadata
- Seed the provider user

#### 1.4 Verify services are running

```bash
# API health check
curl http://localhost:3005/health
# Expected: {"ok":true,"service":"smb-api"}

# Hasura health check
curl http://localhost:8084/healthz
# Expected: OK
```

You should see output like:

```
Services:
  API (Express):  http://localhost:3005/health
  Hasura console: http://localhost:8084/console
  Postgres:       localhost:5434
```

The seed script will print a provider user JWT and password:

```
Provider user already exists: provider@smb.local
Password: ProviderPass123!
```

---

### Step 2: Start the Frontend

#### 2.1 Navigate to the frontend directory

```bash
cd /home/melese/SMS_System/frontend
```

#### 2.2 Install dependencies (if not already installed)

```bash
yarn install
# or: npm install
```

#### 2.3 Start the dev server

```bash
yarn dev
# or: npm run dev
```

#### 2.4 Verify frontend is running

Open your browser to: **http://localhost:5173**

You should be redirected to the Login page (since no auth token exists yet).

---

### Step 3: Test Authentication (01-auth.md)

#### 3.1 Login as Provider Admin

1. Open http://localhost:5173
2. Enter email: `provider@smb.local`
3. Enter password: `ProviderPass123!`
4. Click **Login**

**Expected:** Successful login, redirected to Dashboard. You should see your name and role in the header.

#### 3.2 Test Logout

1. Click **Logout** in the top navigation
2. **Expected:** You are redirected to the Login page. Local storage is cleared.

#### 3.3 Test Session Management

1. Login again as provider
2. Click **Sessions** in the navigation
3. **Expected:** You see your active session(s) listed
4. Test **Revoke Session** (if multiple sessions exist)

#### 3.4 Test Context Switching

1. Click **Switch Context** in navigation
2. **Expected:** You see available school/branch contexts you can switch to
3. Select a context and verify the token updates

#### 3.5 Test Role Management

1. Click **Role Management** in navigation
2. **Expected:** You see a form to assign roles and a table of current assignments
3. Try assigning a role to a user (requires users to exist in the system)

---

### Step 4: Test School Registration (Provider Only)

#### 4.1 Register a New School

1. Login as `provider@smb.local` / `ProviderPass123!`
2. Click **Register School** in navigation
3. Fill in:
   - School Name: `Test School`
   - School Address: `Addis Ababa`
   - Main Branch Name: `Main Branch`
   - Admin Email: `admin@testschool.local`
   - Admin Phone: `251911223344`
   - Admin Password: `AdminPass123!`
   - Admin First Name: `Test`
   - Admin Last Name: `Admin`
4. Click **Register School**

**Expected:** School created successfully. You receive an access token and are logged in as the school admin.

#### 4.2 Login as School Admin

1. Logout from provider
2. Login with: `admin@testschool.local` / `AdminPass123!`
3. **Expected:** You are logged in with `SCHOOL_OWNER` role for the test school

---

### Step 5: Test Academic Setup (02-academic-setup.md)

#### 5.1 Create Academic Year

1. Login as school admin
2. Click **Academic Years** in navigation
3. Click **Add Academic Year**
4. Fill in:
   - Year Name: `2026/2027`
   - Year Code: `2026-27`
   - Starts On: `2026-09-01`
   - Ends On: `2027-06-30`
   - Current Academic Year: ✅ checked
5. Click **Save Academic Year**

**Expected:** Academic year appears in the table.

#### 5.2 Create Grade Levels

1. Click **Grade Levels** in navigation
2. Create grades:
   - `Grade 1` (code: `G1`, sort_order: `1`)
   - `Grade 2` (code: `G2`, sort_order: `2`)
3. **Expected:** Grades appear in the table.

#### 5.3 Create Monthly Fees

1. Click **Monthly Fees** in navigation
2. Select an academic year and grade level
3. Enter monthly amount (e.g., `2500.00`)
4. Click save
5. **Expected:** Fee appears in the list.

#### 5.4 Create Section Slots

1. Click **Section Slots** in navigation
2. Select academic year, branch, grade level
3. Enter section name (e.g., `A`), max capacity (e.g., `40`)
4. Click save
5. **Expected:** Section slot appears.

#### 5.5 Create Registration Packages

1. Click **Packages** in navigation
2. Create packages (e.g., `QUARTERLY`, `TEN_MONTH`)
3. **Expected:** Packages appear in the list.

#### 5.6 View Setup Checklist

1. Click **Setup Checklist** in navigation
2. **Expected:** You see a summary of all academic configuration (years, grades, fees, sections, packages, branches)

---

### Step 6: Test Student Registration (03-student-registration.md)

#### 6.1 Register a Student

1. Click **Register Student** in navigation
2. Complete all 5 steps:

**Step 1 — Student Info:**
- First Name, Middle Name, Last Name
- Date of Birth
- Sex (male/female)
- Email, Phone

**Step 2 — Guardians:**
- Add at least 1 guardian with relationship, phone, contact flags

**Step 3 — Academic Placement:**
- Select branch, academic year, grade level, section
- Enter enrollment date

**Step 4 — Payment:**
- Select package code
- Select payment method (CASH or BANK_TRANSFER)
- If BANK_TRANSFER, enter transfer reference

**Step 5 — Review & Submit:**
- Review all information
- Click **Submit**

**Expected:** Registration succeeds. You see student ID, registration ID, enrollment ID, payment status, and amounts.

#### 6.2 View Student List

1. Click **Students List** in navigation
2. **Expected:** You see the registered student in the table.

#### 6.3 View Student Detail

1. Click on a student in the list (or **Student Detail**)
2. **Expected:** You see full student details including guardians, health, address, and enrollments.

#### 6.4 View Registration Payments

1. Click **Registration Payments** in navigation
2. **Expected:** You see payment records for registered students.

#### 6.5 Update Enrollment Section

1. Click **Enrollment Sections** in navigation
2. Select an enrollment and change its section
3. **Expected:** Section is updated.

---

### Step 7: Test Staff Management (04-staff.md)

#### 7.1 Access Staff Management

1. Login as school admin (`admin@testschool.local`)
2. Click **Staff Management** in navigation

**Expected:** You see the staff management page with a form and staff directory table.

#### 7.2 Create a Staff Member

1. Click **Add New Staff Member**
2. Fill in:
   - Role: Select from dropdown (TEACHER, RECEPTIONIST, FINANCE, etc.)
   - Scope Type: School-wide or Branch-scoped
   - Branch: (if Branch-scoped selected)
   - First Name, Last Name, Email
   - Phone, Employee Code, Job Title, Hired On
   - Password (for new accounts)
3. If role is TEACHER, additional fields appear:
   - Education Level, Employment Type, Field of Study
   - Academic Background, Years of Experience
   - Teaching License Number
4. Click **Create Staff**

**Expected:** Staff member created and appears in the directory table.

#### 7.3 Edit a Staff Member

1. Click **Edit** on a staff member in the table
2. Modify details (job title, name, etc.)
3. Click **Update Staff**

**Expected:** Staff member details are updated.

#### 7.4 Reset Password

1. Click **Reset Password** on a staff member
2. Confirm the reset
3. **Expected:** Password is reset to a default value.

#### 7.5 Deactivate Staff

1. Click **Deactivate** on a staff member
2. Confirm deactivation
3. **Expected:** Staff member is deactivated (marked as deleted/inactive).

---

### Step 8: Test Courses (06-courses.md) — Frontend Only

⚠️ **Note:** These pages are built on the frontend, but the backend actions (`ManageCourse`, `ManageGradeCourse`, `ManageSectionCourseTeacher`) are **not yet implemented** on the backend. Testing these will fail at the API level until the backend implements them.

#### 8.1 Course Management

1. Click **Courses** in navigation
2. Click **Add Course**
3. Select academic year, enter code (e.g., `MATH`), name (e.g., `Mathematics`), description
4. Click **Create Course**

**Expected (once backend implemented):** Course created and appears in table.

#### 8.2 Grade Course Assignment

1. Click **Grade Courses** in navigation
2. Select academic year
3. Select section
4. Click **Assign Course to Grade**
5. Select grade level, course, sort order, required flag
6. Click **Create Assignment**

**Expected (once backend implemented):** Assignment created.

#### 8.3 Section Teacher Assignment

1. Click **Section Teachers** in navigation
2. Select academic year, then section
3. Click **Assign Teacher to Course**
4. Select course (filtered by section's grade level), select teacher
5. Click **Assign Teacher**

**Expected (once backend implemented):** Teacher assigned to course in section.

#### 8.4 My Classes (Teacher View)

1. Login as a teacher (or a user with TEACHER role)
2. Click **My Classes** in navigation
3. **Expected (once backend implemented):** You see your assigned courses and sections.

---

### Step 9: Test Data Reads (05-data-reads.md)

#### 9.1 View All Data Read Pages

| Page | Navigation Label | What to Verify |
|------|-----------------|----------------|
| Branches & School | Branches & School | Lists active branches |
| Students List | Students List | Lists all students |
| Student Detail | Student Detail | Shows individual student |
| Enrollments by Year | Enrollments by Year | Lists enrollments for a year |
| Registration Payments | Registration Payments | Lists payment records |
| Users Directory | School Users | Lists all users |
| Role Assignments | Role Assignments | Lists role assignments |

Click each navigation item and verify the table loads without errors.

---

### Step 10: Full End-to-End Scenario

Complete this scenario to verify the entire system works together:

1. **Register a school** as provider (`Register School`)
2. **Login as school admin** with the new school credentials
3. **Setup academic year** (`Academic Years`)
4. **Create grade levels** (`Grade Levels`)
5. **Create section slots** (`Section Slots`)
6. **Register a student** (`Register Student`) — complete all 5 steps
7. **Create a staff member** (`Staff Management`) — create a teacher
8. **View the student** in `Students List`
9. **View payments** in `Registration Payments`
10. **Logout** and verify you're redirected to Login

---

### Step 11: Verify Production Build

```bash
cd /home/melese/SMS_System/frontend
yarn build
# or: npm run build
```

**Expected:** Build completes with zero errors. Output in `dist/` folder.

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend can't connect to backend | Verify backend is running on port 3005; check `CORS_ORIGIN` in `api/.env` |
| Login fails | Verify backend is running; check credentials; ensure seed was run |
| Pages show empty tables | Ensure data exists in database; run seed script |
| Course pages fail with API error | Backend actions `ManageCourse`, `ManageGradeCourse`, `ManageSectionCourseTeacher` not yet implemented — this is expected |
| Build fails | Run `yarn install` in frontend directory, then `yarn build` |

---

### Summary Checklist

Before considering testing complete, verify:

- [ ] Backend stack starts (`yarn setup`)
- [ ] API health endpoint returns OK
- [ ] Hasura health endpoint returns OK
- [ ] Frontend starts on port 5173
- [ ] Login works with seeded provider credentials
- [ ] School registration works
- [ ] Academic setup (years, grades, fees, sections, packages) works
- [ ] Student registration 5-step wizard works
- [ ] Staff management CRUD works
- [ ] Data reads pages load without errors
- [ ] Frontend production build passes
- [ ] Course pages are built but will fail until backend actions are implemented

---

**Report generated:** Tue Nov 17 2026  
**Project:** SMS System — School Management System  
**Frontend Status:** ~95% complete (all contract docs covered)  
**Backend Status:** Steps 01–05 complete; Step 06 (courses) pending implementation  