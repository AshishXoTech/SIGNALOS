#!/bin/bash
# ============================================================
# DATABASE MIGRATION RUNNER
# Usage: ./scripts/run_migrations.sh
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting Database Migration...${NC}"

# Load env vars
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-disaster_ai}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASSWORD:-postgres}"

echo -e "  Host: ${DB_HOST}:${DB_PORT}"
echo -e "  DB:   ${DB_NAME}"
echo -e "  User: ${DB_USER}"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
until PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
    echo -e "  ... PostgreSQL not ready, retrying in 2s"
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Run migration
echo -e "${YELLOW}📦 Running init_db.sql...${NC}"
PGPASSWORD=$DB_PASS psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f migrations/init_db.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi

# Verify tables
echo ""
echo -e "${YELLOW}📊 Verifying tables...${NC}"
PGPASSWORD=$DB_PASS psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -c "
    SELECT table_name, 
           (SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = t.table_name) as columns
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    ORDER BY table_name;
    "

echo -e "${GREEN}🎉 Database is fully initialized and ready!${NC}"