#!/usr/bin/env bash
set -euo pipefail

SMB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export SMB_ROOT

compose() {
  docker compose -f "${SMB_ROOT}/docker/docker-compose.yml" --env-file "${SMB_ROOT}/.env" "$@"
}

log() {
  printf '\033[1;36m[smb]\033[0m %s\n' "$*"
}

die() {
  printf '\033[1;31m[smb error]\033[0m %s\n' "$*" >&2
  exit 1
}

require_docker() {
  command -v docker >/dev/null 2>&1 || die "Docker is required."
  docker info >/dev/null 2>&1 || die "Docker daemon is not running."
}

require_hasura_cli() {
  command -v hasura >/dev/null 2>&1 || die "Hasura CLI is required (https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)."
}

ensure_env_files() {
  if [[ ! -f "${SMB_ROOT}/.env" ]]; then
    cp "${SMB_ROOT}/.env.example" "${SMB_ROOT}/.env"
    log "Created .env from .env.example"
  fi
  if [[ ! -f "${SMB_ROOT}/api/.env" ]]; then
    cp "${SMB_ROOT}/api/.env.example" "${SMB_ROOT}/api/.env"
    log "Created api/.env from api/.env.example"
  fi
  # shellcheck disable=SC1091
  set -a
  source "${SMB_ROOT}/.env"
  set +a
}

wait_for_postgres() {
  local user="${POSTGRES_USER:-smb_user}"
  local db="${POSTGRES_DB:-smb_db}"
  log "Waiting for Postgres..."
  for _ in $(seq 1 60); do
    if compose exec -T postgres pg_isready -U "$user" -d "$db" >/dev/null 2>&1; then
      log "Postgres is ready."
      return 0
    fi
    sleep 2
  done
  die "Postgres did not become ready in time."
}

wait_for_hasura() {
  local port="${HASURA_PUBLISH_PORT:-8084}"
  log "Waiting for Hasura on port ${port}..."
  for _ in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:${port}/healthz" >/dev/null 2>&1; then
      log "Hasura is ready."
      return 0
    fi
    sleep 2
  done
  die "Hasura did not become ready in time."
}

apply_migrations_and_metadata() {
  require_hasura_cli
  log "Applying Hasura migrations..."
  (cd "${SMB_ROOT}" && hasura migrate apply --project hasura --database-name default)
  log "Applying Hasura metadata..."
  (cd "${SMB_ROOT}" && hasura metadata apply --project hasura)
}

print_urls() {
  # shellcheck disable=SC1091
  set -a
  source "${SMB_ROOT}/.env"
  set +a
  local api_port="${API_PUBLISH_PORT:-3005}"
  local hasura_port="${HASURA_PUBLISH_PORT:-8084}"
  local pg_port="${POSTGRES_PUBLISH_PORT:-5434}"
  cat <<EOF

Services:
  API (Express):  http://localhost:${api_port}/health
  Hasura console: http://localhost:${hasura_port}/console
  Postgres:       localhost:${pg_port}

EOF
}
