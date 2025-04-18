import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { session, signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Check if we have a session
      if (session) {
        navigate("/home");
        return;
      }

      // Check for access token in URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");

      if (accessToken) {
        try {
          console.log("Found access token in URL, attempting to set session");

          // Set the session using the access token
          const {
            data: { session: newSession },
            error,
          } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });

          if (error) {
            console.error("Error setting session:", error);
            toast({
              title: "Authentication Error",
              description: `Failed to authenticate: ${error.message}`,
              variant: "destructive",
            });
            return;
          }

          if (newSession) {
            console.log("Successfully set session, redirecting to home");
            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname);
            // Redirect to home
            navigate("/home");
          }
        } catch (error) {
          console.error("Exception during authentication:", error);
          toast({
            title: "Authentication Error",
            description: "An unexpected error occurred during authentication.",
            variant: "destructive",
          });
        }
      }
    };

    handleAuth();
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        navigate("/home");
      } else {
        await signUp(email, password, username);
        toast({
          title: "✉️ Verification Email Sent",
          description: (
            <div className="flex flex-col gap-2">
              <p>
                We've sent a verification link to{" "}
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the link to verify your
                account.
              </p>
            </div>
          ),
          duration: 6000,
        });
        // Switch to sign in mode after successful signup
        setMode("signin");
        // Clear the form
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Auth Form */}
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-[400px] shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Optimized Google Auth Button */}
              <GoogleAuthButton />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-11 text-black"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 text-black"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Loading..."
                    : mode === "signin"
                      ? "Sign In"
                      : "Sign Up"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-black font-medium"
                  onClick={() =>
                    setMode(mode === "signin" ? "signup" : "signin")
                  }
                >
                  {mode === "signin"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
