import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // In production SaaS, missing env vars means admin setup is required.
    console.warn('FinalCode admin setup required: missing Supabase env vars.');
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
