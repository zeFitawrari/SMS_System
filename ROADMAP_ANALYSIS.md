# SMS_System — Frontend Roadmap Analysis

## Status: LOGIN/AUTH PHASE COMPLETE ✅
All 15 operations from `01-auth.md` implemented. Frontend build: `vite build` ✅ zero errors.

## All Auth Pages Built
| Page | File | Contract Ops |
|------|------|-------------|
| Login | Login.jsx | Login (email/phone) |
| Logout (global) | App.jsx top nav | Logout (this device) |
| Sessions | SessionManagement.jsx | ListMySessions, RevokeSession, RevokeOtherSessions, Logout (all devices) |
| Context Switcher | ContextSelector.jsx | ListMyContexts, SelectContext (school+branch) |
| Role Management | RoleManagement.jsx | AssignRole (school+branch), RevokeRoleAssignment |
| Register School | RegisterSchool.jsx | RegisterSchool (provider admin) |

## Supporting Files Created
- `frontend/src/graphql/refreshSessionMutation.js` — RefreshSession (silent refresh in apolloClient.js)
- `frontend/src/graphql/selectContextMutation.js` — SelectContext
- `frontend/src/graphql/assignRoleMutation.js` — AssignRole
- `frontend/src/graphql/revokeRoleAssignmentMutation.js` — RevokeRoleAssignment
- `frontend/src/graphql/registerSchoolMutation.js` — RegisterSchool
- `frontend/src/graphql/usersQuery.js` — ListUsers
- `frontend/src/graphql/roleAssignmentsQuery.js` — ListRoleAssignments
- `frontend/src/graphql/availableRolesQuery.js` — ListAvailableRoles
- `frontend/src/lib/apolloClient.js` — Silent refresh error link + refreshClient (anonymous role)
- `frontend/src/components/ErrorBoundary.jsx` — Error catching (no white screens)

## Removed Duplicate Nav Bars
- SessionManagement.jsx — removed duplicate nav + Logout
- StudentRegistration.jsx — removed duplicate nav
- Logout appears ONLY once in App.jsx top navigation

## Responsive Design Applied (All Pages)
Tailwind breakpoints: sm:, md:, lg:, xl:
- Responsive containers: px-3 sm:px-4 md:px-6 lg:px-8
- Responsive grids: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- Responsive tables: overflow-x-auto on mobile
- Consistent card styling: rounded-xl, shadow-sm, border-gray-200
- Consistent buttons: focus:ring-2 focus:ring-blue-500, hover states

## System Running Status (Verified)
- Backend API: `http://localhost:3005/health` → ✅ `{"ok":true,"service":"smb-api"}`
- Hasura: `http://localhost:8084/healthz` → ✅ `OK`
- Frontend: `http://localhost:5173/` → ✅ Vite dev server running
- Provider user seeded: `provider@smb.local` / `ProviderPass123!`

## Contract Gaps to Raise with Backend Developer
- ManageCourse/ManageGradeCourse/ManageSectionCourseTeacher not in 00-common.md Manage pattern
- Registration wizard step 3 (GetRegistrationPaymentQuote) not labeled in contract md files
- Guardian fields (emergency, authorized_pickup) not in contract md files
- No error-code list documented
- No pagination/total-count convention
- `is_current` cascade behavior undefined
- List queries don't filter by school_id (confirm row-level scoping)

## NEXT: Move to 02-academic-setup.md
Build in dependency order:
1. Academic Years (ManageAcademicYear)
2. Grade Levels (ManageGradeLevel)
3. Monthly Fees (ManageGradeMonthlyFee)
4. Section Slots (ManageSectionSlot)
5. Registration Packages (ManageSchoolRegistrationPackage)
6. Setup checklist page (ListAcademicConfig query)
