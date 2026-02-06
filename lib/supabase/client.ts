import { createClient } from "@supabase/supabase-js";

// Types for our Supabase client
import type { SupabaseClient } from "@supabase/supabase-js";

// Public keys – safe to expose in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // This will surface clearly in the browser/console during development
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  );
}

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client for use in client components.
 * Usage:
 *   const supabase = getSupabaseBrowserClient();
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    });
  }

  return browserClient;
}

