import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { imageCache } from "./image-cache";
import { ensureUserProfileExists } from "./profile-utils";
import { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Function to preload user avatar - non-blocking version
  const preloadUserAvatar = (userId: string) => {
    // Use a non-blocking approach with Promise
    const preloadPromise = new Promise<void>(async (resolve) => {
      try {
        // Check if we already have the avatar URL in cache
        if (imageCache.has(userId)) {
          console.log('Avatar URL found in cache, preloading image...');
          // Don't await here - let it happen in background
          imageCache.preloadImage(imageCache.get(userId)!)
            .catch(err => console.error('Error preloading cached avatar:', err));
          resolve();
          return;
        }

        // Try to get avatar URL directly from user metadata first if available
        // This is much faster than a database query
        if (user?.user_metadata?.avatar_url || user?.user_metadata?.picture) {
          const avatarUrl = user.user_metadata.avatar_url || user.user_metadata.picture;
          console.log('Avatar URL found in user metadata, using it directly');
          imageCache.set(userId, avatarUrl);
          imageCache.preloadImage(avatarUrl)
            .catch(err => console.error('Error preloading avatar from metadata:', err));
          resolve();
          return;
        }

        // As a last resort, fetch from database
        console.log('Fetching user profile to preload avatar...');
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching user profile for avatar preloading:', error);
              resolve();
              return;
            }

            if (data && data.avatar_url) {
              console.log('Avatar URL found in database, caching and preloading...');
              imageCache.set(userId, data.avatar_url);
              imageCache.preloadImage(data.avatar_url)
                .catch(err => console.error('Error preloading avatar from database:', err));
            }
            resolve();
          })
          .catch(error => {
            console.error('Error in avatar preload database query:', error);
            resolve();
          });
      } catch (error) {
        console.error('Error in preloadUserAvatar:', error);
        resolve(); // Always resolve to prevent blocking
      }
    });

    // Return immediately, don't wait for the promise
    return preloadPromise;
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // If we have a session, preload avatar and ensure profile exists in background
      if (session?.user) {
        // Preload user avatar immediately
        preloadUserAvatar(session.user.id);

        // Ensure user profile exists in the background
        // This won't block the UI
        setTimeout(() => {
          ensureUserProfileExists(session.user)
            .catch(err => console.error('Error ensuring profile exists:', err));
        }, 100);
      }

      // If we have a session but are on the landing page, redirect to home
      if (session && window.location.pathname === "/") {
        window.location.href = "/home";
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth state changed: ${event}`);
      setSession(session);
      setUser(session?.user ?? null);

      // If user is signed in, handle profile and avatar
      if (session?.user) {
        // Preload user avatar immediately when auth state changes
        preloadUserAvatar(session.user.id);

        // For sign-in events, ensure profile exists in the background
        if (event === 'SIGNED_IN') {
          console.log('User signed in, ensuring profile exists in background');
          // Use setTimeout to make this non-blocking
          setTimeout(() => {
            ensureUserProfileExists(session.user)
              .catch(err => console.error('Error ensuring profile exists:', err));
          }, 0);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
        data: {
          username,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    // Use scopes to request minimal permissions for faster auth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile', // Request only what we need
        queryParams: {
          prompt: 'select_account', // Allow users to select account each time
          access_type: 'online' // Don't request offline access which is slower
        }
      },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
