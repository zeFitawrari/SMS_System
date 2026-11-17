# Implementation roadmap (greenfield)

This repo implements the target design in small, reviewable steps. Do not copy the legacy monolith wholesale; port behavior when a step requires it.

## Step 01 — School registration (current)

- Docker: Postgres + Hasura + API
- DDL: `tenancy.schools`, `tenancy.branches`, `identity.users`, `identity.roles`, `identity.role_assignments`
- Hasura mutation `RegisterSchool` → Express webhook → single transaction
- Provider-only action permission + Express double-check
- Optional separate `SCHOOL_OWNER` user; required `SCHOOL_ADMIN`

## Step 02 — Sessions (**done**)

- `Login`, `RefreshSession`, `logout` actions — see [steps/02-login-session.md](steps/02-login-session.md)
- `identity.sessions` (server-side auth sessions)
- JWT with role list (context selection in Step 03)

## Step 03 — Authorization model (**done**)

- Single school per user (`users.school_id`) — **no** `school_memberships`
- `identity.role_assignments` (SCHOOL / BRANCH scope) — see [steps/03-role-assignments.md](steps/03-role-assignments.md)
- Session active context + `SelectContext`, `AssignRole`, `RevokeRoleAssignment`; legacy `userroles` dropped

## Step 04 — Student registration (**done**)

- Schemas `student`, `academic`, `finance` (registration slice)
- Action **RegisterStudent** (transactional) — see [steps/04-student-registration.md](steps/04-student-registration.md)
- Hasura read permissions + restricted health data

## Step 05 — Staff provisioning (**started**)

- `ManageUser` action — create / update / delete teachers and staff — see [steps/05-staff-manage-user.md](steps/05-staff-manage-user.md)
- `staff.staff_profiles` + `identity.users` + role assignments

## Step 06 — Hasura data plane (next)

- Broader domain tables (attendance, timetable, …) with same tenant rules

Later steps follow `Student_mangement_system_backend/docs/rebuild-roadmap.md` phases 4–9.
