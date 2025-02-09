import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Session, User, AuthError } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

function getErrorMessage(error: AuthError): string {
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
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

  const signUp = async (email: string, password: string) => {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select()
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error(
        "This email is already registered. Please sign in instead.",
      );
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) throw new Error(getErrorMessage(error));
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(getErrorMessage(error));
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut }}>
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
