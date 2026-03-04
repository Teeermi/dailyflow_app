#!/bin/sh
set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
until mysqladmin ping -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" --ssl=FALSE --silent 2>/dev/null; do
  sleep 2
done
echo "MySQL is ready."

echo "Running migrations..."
node node_modules/.bin/typeorm migration:run -d dist/database/data-source.js
echo "Migrations complete."

echo "Starting API..."
exec node dist/main
