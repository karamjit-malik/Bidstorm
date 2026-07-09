#!/usr/bin/env bash
#
# Runs all BidStorm migrations in order, then (optionally) the seed files.
#
# Usage:
#   ./run_migrations.sh              # migrations only
#   ./run_migrations.sh --seed       # migrations + seeds
#
# Configuration is read from environment variables (defaults shown):
#   DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_NAME=bidstorm
#   DB_PASSWORD=...        (or export MYSQL_PWD to avoid it appearing in args)
#   MYSQL_BIN=mysql        (path to the mysql client; override on Windows)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-bidstorm}"
MYSQL_BIN="${MYSQL_BIN:-mysql}"

# Prefer MYSQL_PWD (keeps the password out of the process list / argv).
if [[ -n "${DB_PASSWORD:-}" && -z "${MYSQL_PWD:-}" ]]; then
  export MYSQL_PWD="$DB_PASSWORD"
fi

mysql_exec() {
  # $1 = database name ("" for none), reads SQL from stdin
  local db="$1"
  if [[ -n "$db" ]]; then
    "$MYSQL_BIN" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$db"
  else
    "$MYSQL_BIN" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER"
  fi
}

echo "==> Ensuring database '$DB_NAME' exists"
echo "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | mysql_exec ""

echo "==> Running migrations"
for f in "$SCRIPT_DIR"/migrations/*.sql; do
  echo "    - $(basename "$f")"
  mysql_exec "$DB_NAME" < "$f"
done

if [[ "${1:-}" == "--seed" ]]; then
  echo "==> Running seeds"
  for f in "$SCRIPT_DIR"/seeds/*.sql; do
    echo "    - $(basename "$f")"
    mysql_exec "$DB_NAME" < "$f"
  done
fi

echo "==> Done."
