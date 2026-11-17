# SCHOOL_MANAGEMENT_BACKEND

Greenfield backend for the branch-aware school management platform. Built step by step; each step is documented under `docs/steps/`.

**Stack:** PostgreSQL, Hasura (GraphQL + actions), Express (webhooks and privileged writes).

**Principles**

- GraphQL **input/output types** live in Hasura (`hasura/metadata/actions.graphql`).
- Express **webhooks** validate lightly, enforce auth, run transactions, return the Hasura output shape (no extra presenter layer).
- **REST** will be added only where needed later; no duplicate `schemas.js` for Hasura actions.
- Hasura owns action **roles** and GraphQL **input types**; Express validators only cover webhook secret + rules GraphQL cannot express (`hasuraActions.js`).
- Table GraphQL roots: **plural** for lists (`schools`), **singular** for by-PK (`school`) — see [docs/hasura-graphql-naming.md](docs/hasura-graphql-naming.md).

## Quick start (Step 1)

Requires **Docker**, **Node 20+**, and **[Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)**.

```bash
cd SCHOOL_MANAGEMENT_BACKEND
yarn install    # or npm install
yarn setup      # .env, up, migrate, metadata, seed provider
```

| Command | Action |
|---------|--------|
| `yarn setup` | Create `.env`, start stack, migrate, metadata, seed provider |
| `yarn up` | Start all services |
| `yarn down` | Stop services (keep data) |
| `yarn down:clean` | Stop and remove volumes |
| `yarn express:log` | Follow Express (`app`) logs |
| `yarn hasura:log` | Follow Hasura logs |
| `yarn postgres:log` | Follow Postgres logs |
| `yarn console` | Hasura CLI console |
| `yarn dev` | API on host — stop Docker `app` if port 3005 is busy |

- Hasura UI: `http://localhost:8084/console` (admin secret in `.env`)
- API: `http://localhost:3005/health`
- Postgres: `localhost:5434`

See [docs/steps/01-school-registration.md](docs/steps/01-school-registration.md).

## API layout (`api/src`)

| Area | Role |
|------|------|
| `routes/hasura/` | Webhook paths → domain routers (`auth`, `academic`, `finance`, `students`) |
| `controllers/{auth,academic,finance,student}/` | Hasura action handlers (`actions.js` per domain except auth) |
| `services/auth`, `tenant` | Identity, sessions, school provisioning |
| `services/academic` | Years/grades config, placement, section slots |
| `services/enrollment` | Cross-cutting enrollment access (registrar roles) |
| `services/student` | Student registration transactions |
| `services/finance` | Registration fees and quotes |
| `validators/hasuraActions.js` | Joi only where GraphQL cannot express rules |

Full step list: [docs/ROADMAP.md](docs/ROADMAP.md).

Architecture reference: sibling repo `Student_mangement_system_backend/docs/proposed-branch-aware-architecture.md`.
