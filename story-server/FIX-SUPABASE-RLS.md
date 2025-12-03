# Fixing Supabase Update Issues (NULL values persisting)

## Problem
Story server logs show "✅ Supabase updated successfully!" but `ip` and `tx_hash` columns remain NULL.

## Root Cause
**Row Level Security (RLS) policies** are blocking the UPDATE operation.

---

## Solution 1: Use SERVICE_ROLE_KEY (Recommended)

The SERVICE_ROLE_KEY bypasses RLS policies.

### Steps:
1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (under "Project API keys")
3. Add to `story-server/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

⚠️ **IMPORTANT**: Keep this key SECRET - it has full database access!

---

## Solution 2: Disable RLS (Quick fix for development)

### Steps:
1. Go to Supabase Dashboard → Table Editor
2. Select `images` table
3. Click the shield icon or go to RLS settings
4. Click "Disable RLS" button

⚠️ **WARNING**: Only do this for development! Production should use RLS with proper policies.

---

## Solution 3: Create Proper RLS Policy (Production)

If you want to keep RLS enabled:

### Steps:
1. Go to Supabase Dashboard → Authentication → Policies
2. Click on `images` table
3. Add a new policy:

```sql
-- Policy name: Allow service role to update ip and tx_hash
-- Operation: UPDATE
-- Target roles: authenticated, service_role

CREATE POLICY "Allow updates to ip and tx_hash"
ON public.images
FOR UPDATE
USING (true)
WITH CHECK (true);
```

Or more restrictive:

```sql
-- Only allow updating ip and tx_hash columns
CREATE POLICY "Allow IP registration updates"
ON public.images
FOR UPDATE
USING (true)
WITH CHECK (
  -- Only allow updating these specific columns
  (ip IS NOT NULL OR tx_hash IS NOT NULL)
);
```

---

## Verify the Fix

After applying one of the solutions, run:

```bash
cd story-server
node check-supabase.js
```

This will test the connection and verify the columns are accessible.

Then capture a new image and the `ip` and `tx_hash` should be populated!

---

## Quick Check: Which Key Am I Using?

Check `story-server/.env`:

```env
# ✅ GOOD (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ LIMITED (subject to RLS)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The server will use `SERVICE_ROLE_KEY` if available, otherwise falls back to `ANON_KEY`.

