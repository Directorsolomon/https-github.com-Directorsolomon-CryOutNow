import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Session, User, AuthError } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case "User already registered":
      return "This email is already registered. Please sign in instead.";
    case "Invalid login credentials":
      return "Invalid email or password. Please try again.";
    case "Email not confirmed":
      return "Please verify your email before signing in.";
    case "Invalid email":
      return "Please enter a valid email address.";
    case "Password should be at least 6 characters":
      return "Password must be at least 6 characters long.";
    default:
      return error.message;
  }
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Create profile for OAuth users if it doesn't exist
      if (session?.user && session.user.app_metadata.provider === "google") {
        const createProfile = async () => {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select()
            .eq("id", session.user.id)
            .single();

          if (!existingProfile) {
            const username = session.user.email.split("@")[0];
            let finalUsername = username;
            let counter = 1;

            // Keep trying with numbered usernames until we find an available one
            while (true) {
              const { data: exists } = await supabase
                .from("profiles")
                .select()
                .eq("username", finalUsername)
                .single();

              if (!exists) break;
              finalUsername = `${username}${counter}`;
              counter++;
            }

            await supabase.from("profiles").insert([
              {
                id: session.user.id,
                username: finalUsername,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                avatar_url: session.user.user_metadata.avatar_url,
              },
            ]);
          }
        };
        createProfile();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Redirect to home if authenticated
      if (session?.user && window.location.pathname === "/auth") {
        window.location.href = "/";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(getErrorMessage(error));
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: "email profile",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        if (error.message.includes("provider is not enabled")) {
          throw new Error(
            "Google sign in is not configured. Please contact support.",
          );
        }
        throw new Error(getErrorMessage(error));
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // First check if username exists
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select()
      .eq("username", username)
      .single();

    if (existingUsername) {
      throw new Error(
        "This username is already taken. Please choose another one.",
      );
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          username,
        },
      },
    });

    if (error) throw new Error(getErrorMessage(error));
    if (!data.user) throw new Error("No user created");

    // Create the profile using the newly created user data
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
      },
    ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw new Error("Failed to create user profile");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(getErrorMessage(error));
  };

  return (
    <AuthContext.Provider
      value={{ session, user, signIn, signInWithGoogle, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
