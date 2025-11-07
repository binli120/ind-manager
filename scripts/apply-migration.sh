#!/bin/bash

# Load environment variables
source .env.local

echo "🔧 Applying section_locks migration to Supabase..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local"
    exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "📋 Project ID: $PROJECT_ID"

# Apply the migration using Supabase CLI
if command -v supabase &> /dev/null; then
    echo "🚀 Using Supabase CLI to apply migration..."
    supabase db push --project-ref $PROJECT_ID
else
    echo "⚠️  Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo ""
    echo "📝 Alternatively, you can manually run the SQL in your Supabase dashboard:"
    echo "   1. Go to your Supabase project dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Copy and paste the contents of supabase/migrations/001_create_section_locks.sql"
    echo "   4. Execute the SQL"
fi

echo "✅ Migration script completed!" 