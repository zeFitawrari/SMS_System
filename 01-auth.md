# Auth — actions (copy-paste)

No Bearer token for **Login** and **RefreshSession** (Hasura role `anonymous`).

---

## Login (email)

```graphql
mutation Login {
  Login(object: {
    email: "admin@school.local"
    password: "your-password"
  }) {
    id
    access_token
    token
    session_id
    session_token
    email
    phone
    first_name
    last_name
    school_id
    roles
    active_role
    active_branch_id
  }
}
```

## Login (phone)

```graphql
mutation LoginByPhone {
  Login(object: {
    phone: "251911223344"
    password: "your-password"
  }) {
    access_token
    token
    session_id
    session_token
    school_id
    roles
  }
}
```

## Refresh session

```graphql
mutation Refresh {
  RefreshSession(object: {
    session_token: "your-session-token"
  }) {
    access_token
    token
    session_id
    session_token
    roles
    active_role
    active_branch_id
  }
}
```

## Logout (this device)

```graphql
mutation Logout {
  Logout(object: {
    session_token: "your-session-token"
  }) {
    status
    message
  }
}
```

## Logout (all devices — use Bearer only, empty body token)

```graphql
mutation LogoutAll {
  Logout(object: {}) {
    status
    message
  }
}
```

---

## Query — list role contexts you can switch to

```graphql
query ListMyContexts {
  ListMyContexts {
    contexts {
      assignment_id
      role
      scope_type
      branch_id
      branch_name
      branch_code
    }
  }
}
```

## Select context (school-wide role)

```graphql
mutation SelectSchoolAdmin {
  SelectContext(object: {
    role: "SCHOOL_ADMIN"
  }) {
    access_token
    token
    active_role
    active_branch_id
    school_id
    session_id
    roles
  }
}
```

## Select context (branch-scoped role)

```graphql
mutation SelectTeacher {
  SelectContext(object: {
    role: "TEACHER"
    branch_id: "00000000-0000-0000-0000-000000000001"
  }) {
    access_token
    token
    active_role
    active_branch_id
    school_id
    roles
  }
}
```

---

## Query — list my sessions

```graphql
query ListMySessions {
  ListMySessions(object: {
    include_inactive: false
  }) {
    sessions {
      session_id
      created_at
      last_active_at
      expires_at
      is_active
      is_current
      user_agent
      client_ip
    }
  }
}
```

## Revoke one session

```graphql
mutation RevokeSession {
  RevokeSession(object: {
    session_id: "00000000-0000-0000-0000-000000000001"
  }) {
    status
    message
    revoked_session_id
  }
}
```

## Revoke all other sessions

```graphql
mutation RevokeOtherSessions {
  RevokeOtherSessions(object: {
    current_session_id: "00000000-0000-0000-0000-000000000001"
  }) {
    status
    message
    revoked_count
  }
}
```

---

## Assign role (school admin)

```graphql
mutation AssignRoleSchoolScope {
  AssignRole(object: {
    user_id: "00000000-0000-0000-0000-000000000001"
    role: "RECEPTIONIST"
    scope_type: SCHOOL
  }) {
    status
    user_id
    role
    scope_type
    school_id
  }
}
```

## Assign role (branch scope)

```graphql
mutation AssignRoleBranchScope {
  AssignRole(object: {
    user_id: "00000000-0000-0000-0000-000000000001"
    role: "BRANCH_ADMIN"
    scope_type: BRANCH
    branch_id: "00000000-0000-0000-0000-000000000002"
  }) {
    status
    user_id
    role
    scope_type
    branch_id
    school_id
  }
}
```

## Revoke role assignment

```graphql
mutation RevokeRoleAssignment {
  RevokeRoleAssignment(object: {
    assignment_id: "00000000-0000-0000-0000-000000000001"
  }) {
    status
    message
    assignment_id
    user_id
  }
}
```

---

## Register school (provider admin only)

```graphql
mutation RegisterSchool {
  RegisterSchool(object: {
    school_name: "Demo School"
    school_address: "Bole"
    admin_email: "admin@demo.local"
    admin_phone: "251911223344"
    admin_password: "ChangeMeNow123!"
    admin_first_name: "Admin"
    admin_last_name: "User"
  }) {
    school_id
    main_branch_id
    admin_id
    access_token
    token
    session_id
    session_token
  }
}
```
