# Frontend API docs (copy-paste GraphQL)

**Endpoint:** `POST http://localhost:8084/v1/graphql` (adjust for your env)

**After login**, send on every request:

```http
Authorization: Bearer <access_token>
```

Optional: `x-hasura-role: SCHOOL_ADMIN` (when the JWT lists multiple roles).

Replace placeholders:

| Placeholder | Meaning |
|-------------|---------|
| `00000000-0000-0000-0000-000000000001` | Example UUID — use real ids from your DB / prior responses |
| `your-password` | Real password |
| `your-session-token` | From `Login` / `RefreshSession` |

## Files by feature

| File | Contents |
|------|----------|
| [00-common.md](./00-common.md) | Headers, Manage pattern, JWT context |
| [01-auth.md](./01-auth.md) | Login, refresh, logout, sessions, contexts, roles, RegisterSchool |
| [02-academic-setup.md](./02-academic-setup.md) | ManageAcademicYear, grades, fees, sections, packages + list queries |
| [03-student-registration.md](./03-student-registration.md) | Wizard + RegisterStudent + section update + quote query |
| [04-staff.md](./04-staff.md) | ManageUser (staff/teachers) + list queries |
| [05-data-reads.md](./05-data-reads.md) | Hasura table queries (no actions) |
| [06-courses.md](./06-courses.md) | ManageCourse, grade courses, section teachers + list query |

Overview (shorter): [../frontend-graphql-api.md](../frontend-graphql-api.md).
