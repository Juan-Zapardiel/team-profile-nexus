import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// This client should ONLY be used in server-side code
// DO NOT use this in frontend components
export const supabaseAdmin = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'supabase.admin'
    }
  }
); 