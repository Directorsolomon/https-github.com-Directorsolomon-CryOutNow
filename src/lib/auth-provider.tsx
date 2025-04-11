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

  // Function to preload user avatar
  const preloadUserAvatar = async (userId: string) => {
    try {
      // Check if we already have the avatar URL in cache
      if (imageCache.has(userId)) {
        console.log('Avatar URL found in cache, preloading image...');
        await imageCache.preloadImage(imageCache.get(userId)!);
        return;
      }

      console.log('Fetching user profile to preload avatar...');
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('Error fetching user profile for avatar preloading:', error);
        return;
      }

      if (data && data.avatar_url) {
        console.log('Avatar URL found, caching and preloading image...');
        imageCache.set(userId, data.avatar_url);
        await imageCache.preloadImage(data.avatar_url);
      }
    } catch (error) {
      console.error('Error preloading user avatar:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // If we have a session, ensure profile exists and preload avatar
      if (session?.user) {
        // Ensure user profile exists
        console.log('Initial auth check, ensuring profile exists');
        await ensureUserProfileExists(session.user);

        // Preload user avatar
        preloadUserAvatar(session.user.id);
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

      // If user is signed in, ensure they have a profile
      if (session?.user) {
        // For sign-in events, ensure profile exists
        if (event === 'SIGNED_IN') {
          console.log('User signed in, ensuring profile exists');
          await ensureUserProfileExists(session.user);
        }

        // Preload user avatar when auth state changes
        preloadUserAvatar(session.user.id);
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
