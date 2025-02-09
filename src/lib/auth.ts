import {
  AuthProvider as AuthProviderComponent,
  useAuth,
  AuthContext,
} from "./auth.tsx";

export const AuthProvider = AuthProviderComponent;
export { useAuth, AuthContext };
