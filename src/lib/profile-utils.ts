import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

/**
 * Ensures a user profile exists in the profiles table
 * Creates one if it doesn't exist
 * 
 * @param user The authenticated user object
 * @returns Promise<boolean> True if profile exists or was created successfully
 */
export async function ensureUserProfileExists(user: User): Promise<boolean> {
  try {
    if (!user) {
      console.error("Cannot ensure profile exists: No user provided");
      return false;
    }

    console.log("Ensuring profile exists for user:", user.id);
    
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking if profile exists:", checkError);
      return false;
    }
    
    // If profile already exists, return true
    if (existingProfile) {
      console.log("Profile already exists for user:", user.id);
      return true;
    }
    
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
    
    console.log("Creating new profile with data:", {
      id: user.id,
      username,
      fullName,
      hasAvatar: !!avatarUrl
    });
    
    // Create profile
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    if (insertError) {
      console.error("Error creating profile:", insertError);
      return false;
    }
    
    console.log("Successfully created profile for user:", user.id);
    return true;
  } catch (error) {
    console.error("Exception in ensureUserProfileExists:", error);
    return false;
  }
}
