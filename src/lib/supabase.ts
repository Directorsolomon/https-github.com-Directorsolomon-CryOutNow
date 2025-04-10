import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
    console.error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
    console.error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

// Log the values to verify they're not empty (first few characters only for security)
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : "Not set");

// Create the Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
