import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Check for access token in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        
        if (!accessToken) {
          setError("No access token found in URL");
          toast({
            title: "Authentication Error",
            description: "No access token found. Please try signing in again.",
            variant: "destructive",
          });
          return;
        }
        
        console.log("Processing authentication callback with access token");
        
        // Set the session using the access token
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });
        
        if (sessionError) {
          console.error("Error setting session:", sessionError);
          setError(sessionError.message);
          toast({
            title: "Authentication Error",
            description: `Failed to authenticate: ${sessionError.message}`,
            variant: "destructive",
          });
          return;
        }
        
        if (session) {
          console.log("Successfully authenticated, redirecting to home");
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
          // Redirect to home
          navigate("/home");
        } else {
          setError("No session created");
          toast({
            title: "Authentication Error",
            description: "Failed to create a session. Please try again.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Exception during authentication callback:", err);
        setError("An unexpected error occurred");
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleAuthCallback();
  }, [navigate, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">
          {isProcessing ? "Processing Authentication..." : error ? "Authentication Error" : "Authentication Successful"}
        </h1>
        
        {isProcessing && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-center text-muted-foreground">
              Please wait while we complete your sign-in...
            </p>
          </div>
        )}
        
        {error && (
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
