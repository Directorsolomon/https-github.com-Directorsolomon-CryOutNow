import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

/**
 * Ensures a user profile exists in the profiles table
 * Creates one if it doesn't exist
 *
 * @param user The authenticated user object
 * @returns Promise<boolean> True if profile exists or was created successfully
 */
// Cache of user IDs that we've already checked/created profiles for
const profileCache = new Set<string>();

export async function ensureUserProfileExists(user: User): Promise<boolean> {
  try {
    if (!user) {
      console.error("Cannot ensure profile exists: No user provided");
      return false;
    }

    // Check cache first to avoid unnecessary database queries
    if (profileCache.has(user.id)) {
      return true;
    }

    console.log("Ensuring profile exists for user:", user.id);

    // Use upsert instead of separate check and insert for better performance
    // This will either update an existing profile or create a new one

    // Extract user information from metadata
    const fullName = user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Anonymous";

    // Generate username from email or name
    let username = user.email?.split("@")[0] ||
      user.user_metadata?.preferred_username ||
      user.user_metadata?.name?.replace(/\\s+/g, "") ||
      "user";

    // Get avatar URL if available from Google
    const avatarUrl = user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    // Use upsert to create or update profile in a single operation
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (upsertError) {
      console.error("Error upserting profile:", upsertError);
      return false;
    }

    // Add to cache to avoid future checks
    profileCache.add(user.id);

    console.log("Successfully ensured profile exists for user:", user.id);
    return true;
  } catch (error) {
    console.error("Exception in ensureUserProfileExists:", error);
    return false;
  }
}
