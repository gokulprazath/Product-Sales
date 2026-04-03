import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey  = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example → .env.local and fill in your credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
