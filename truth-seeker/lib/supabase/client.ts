import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if credentials are provided
export const supabase =
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// For server-side operations that need elevated permissions
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !supabaseUrl || !supabaseUrl.startsWith('http')) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey);
}
