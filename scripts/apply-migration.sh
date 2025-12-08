#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"
SUPABASE_DIR="$REPO_ROOT/supabase"
CONFIG_FILE="$SUPABASE_DIR/config.toml"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env.local not found at $ENV_FILE"
  exit 1
fi

# Load environment variables
source "$ENV_FILE"

echo "🔧 Applying migrations to Supabase..."

# Check if required environment variables are set
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local"
  exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "📋 Project ID: $PROJECT_ID"

if ! command -v supabase >/dev/null 2>&1; then
  echo "⚠️  Supabase CLI not found. Please install it first:"
  echo "   npm install -g supabase"
  exit 1
fi

if [ ! -d "$SUPABASE_DIR" ] || [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Supabase project not initialized or linked in this repo."
  echo "   Run these steps once to set it up:"
  echo "   1) supabase init"
  echo "   2) supabase link --project-ref $PROJECT_ID  # use your service role key when prompted"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ No migrations found at $MIGRATIONS_DIR."
  echo "   Add your migration SQL files there (e.g., supabase/migrations/<timestamp>_migration.sql)."
  exit 1
fi

echo "🚀 Using Supabase CLI to apply migrations..."
supabase db push --workdir "$REPO_ROOT"

echo "✅ Migration script completed!"
