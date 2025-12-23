import { createClient } from '@supabase/supabase-js';
import { config } from './env';

/**
 * Supabase admin client with service role key
 * Has full access to all data and can bypass RLS policies
 * Use with caution - only in server-side code
 */
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Verify Supabase connection
 * Uses auth.getUser() which doesn't require any tables
 */
export async function verifySupabaseConnection() {
  try {
    // Try to verify the connection by checking if we can make an auth request
    // This doesn't require any database tables to exist
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });

    console.log('✓ Supabase connection established');
    return true;
  } catch (error) {
    console.error('✗ Supabase connection failed:', error);
    return false;
  }
}
