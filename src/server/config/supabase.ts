import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY!;

// Service-role client for server-side storage operations (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

export const STORAGE_BUCKET = 'felovy';

export default supabase;
