import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Backend uses the service-role key for admin operations
// (verifying JWTs, managing users, bypassing RLS when needed).
const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export default supabase;