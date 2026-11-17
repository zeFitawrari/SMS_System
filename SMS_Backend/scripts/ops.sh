#!/usr/bin/env bash
#
# Local stack operations. Use via package.json: yarn setup | yarn up | yarn down | …
#
set -euo pipefail
source "$(dirname "$0")/lib/init.sh"

usage() {
  cat <<'EOF'
Usage: ops.sh <command>

  setup          Create .env files, start stack, migrate, metadata, seed provider
  up             Start all Docker services (build if needed)
  down           Stop containers (keep volumes)
  down-clean     Stop containers and remove volumes
  logs [service] Follow logs: app | hasura | postgres | (default: all)
  migrate        Apply Hasura migrations + metadata (stack must be running)
  metadata       Apply Hasura metadata only (stack must be running)
  seed           Seed provider user + print dev JWT
  console        Open Hasura CLI console (port from hasura/config.yaml)
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  setup)
    require_docker
    ensure_env_files
    log "Starting full stack..."
    compose up -d --build
    wait_for_postgres
    wait_for_hasura
    apply_migrations_and_metadata
    log "Seeding provider user..."
    (cd "${SMB_ROOT}/api" && node scripts/seed-provider.mjs)
    print_urls
    log "Setup complete. Hasura console is enabled at /console (see URL above)."
    ;;
  up)
    require_docker
    ensure_env_files
    compose up -d --build
    wait_for_postgres
    wait_for_hasura
    print_urls
    ;;
  down)
    require_docker
    compose down
    log "Stack stopped (volumes kept)."
    ;;
  down-clean)
    require_docker
    compose down -v
    log "Stack stopped and volumes removed."
    ;;
  logs)
    require_docker
    local_service="${1:-}"
    if [[ -z "$local_service" || "$local_service" == "all" ]]; then
      compose logs -f --tail=100
    else
      compose logs -f --tail=100 "$local_service"
    fi
    ;;
  migrate)
    require_docker
    ensure_env_files
    wait_for_postgres
    wait_for_hasura
    apply_migrations_and_metadata
    log "Migrate complete."
    ;;
  metadata)
    require_docker
    ensure_env_files
    wait_for_hasura
    require_hasura_cli
    log "Applying Hasura metadata..."
    (cd "${SMB_ROOT}" && hasura metadata apply --project hasura)
    log "Metadata apply complete."
    ;;
  seed)
    ensure_env_files
    (cd "${SMB_ROOT}/api" && node scripts/seed-provider.mjs)
    ;;
  console)
    require_hasura_cli
    ensure_env_files
    (cd "${SMB_ROOT}" && hasura console --project hasura)
    ;;
  -h | --help | help | "")
    usage
    [[ -n "$cmd" ]] || exit 0
    ;;
  *)
    usage >&2
    die "Unknown command: ${cmd}"
    ;;
esac
