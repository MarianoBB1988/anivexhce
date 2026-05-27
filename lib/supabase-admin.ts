// ─── Supabase Admin Client (Service Role) ─────────────────────────────────────
// RUNS ON: Server-side only (API routes, server components, server actions)
// Uses the SUPABASE_SERVICE_ROLE_KEY to bypass RLS for admin operations.
// NEVER import this module in client components or browser code.
// NEVER expose the service role key to the client.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
