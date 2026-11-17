# Hasura GraphQL naming (project rule)

Non-`public` schemas would default to prefixed roots like `tenancy_schools`. **Every tracked table** must use `configuration.custom_name` and `custom_root_fields` as below.

## Rule

| Access | Root field pattern | Example (`schools` table) |
|--------|--------------------|---------------------------|
| **List / filter / aggregate** | **Plural** — use the table name | `schools`, `schools_aggregate` |
| **By primary key** | **Singular** — one entity | `school(id: …)` |
| **Insert one** | `insert_` + singular | `insert_school` |
| **Update / delete by PK** | `update_` / `delete_` + singular | `update_school`, `delete_school` |
| **Bulk insert / update / delete** | plural where Hasura supports batch | `insert_schools`, `update_schools`, `delete_schools` |

GraphQL **type** name (`custom_name`): match the **table name** (usually plural): `schools`, `users`, `userroles`.

### Singular mapping (by PK / one row)

| Table | List query | By PK query |
|-------|------------|-------------|
| `tenancy.schools` | `schools` | `school` |
| `tenancy.branches` | `branches` | `branch` |
| `identity.users` | `users` | `user` |
| `identity.roles` | `roles` | `role` |
| `identity.userroles` | `userroles` | `userrole` |

When adding a new table, pick a clear singular for PK access (e.g. `student_enrollments` → list `student_enrollments`, pk `student_enrollment`).

## Metadata template (copy for new tables)

Replace `{plural}`, `{singular}`, `{schema}`, `{table}`:

```yaml
table:
  name: {table}
  schema: {schema}
configuration:
  column_config: {}
  custom_column_names: {}
  custom_name: {plural}
  custom_root_fields:
    select: {plural}
    select_by_pk: {singular}
    select_aggregate: {plural}_aggregate
    insert: insert_{plural}
    insert_one: insert_{singular}
    update: update_{plural}
    update_by_pk: update_{singular}
    delete: delete_{plural}
    delete_by_pk: delete_{singular}
```

File name: `{schema}_{table}.yaml` under `hasura/metadata/databases/default/tables/`, and add `!include` in `tables.yaml`.

## Apply

```bash
yarn metadata
```

## Examples

```graphql
query ListSchools {
  schools(where: { status: { _eq: "active" } }) {
    id
    name
  }
}

query OneSchool {
  school(id: "…") {
    id
    name
    branches { code name }
  }
}

query UserWithRoles {
  user(id: "…") {
    email
    userroles { role { name } }
  }
}
```
