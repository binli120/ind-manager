#!/bin/bash

source .env.local

# npx supabase login --debug
npx supabase gen types typescript --project-id=$PROJECT_ID --schema=public > lib/supabase/schema.d.ts
