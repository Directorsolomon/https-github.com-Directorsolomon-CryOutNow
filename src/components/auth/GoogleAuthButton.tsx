import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';

/**
 * Optimized Google authentication button component
 * Uses a more efficient authentication flow
 */
const GoogleAuthButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Use optimized Google auth with minimal scopes and faster options
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Request minimal permissions for faster auth
          scopes: 'email profile',
          queryParams: {
            // Use select_account to allow users to choose account
            prompt: 'select_account',
            // Use online access type for faster auth
            access_type: 'online',
            // Include profile and email in ID token for faster profile creation
            include_granted_scopes: 'true'
          }
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Exception during Google sign in:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleSignIn}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      <span>Continue with Google</span>
    </Button>
  );
};

export default GoogleAuthButton;
