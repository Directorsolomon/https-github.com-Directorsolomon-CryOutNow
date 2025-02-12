import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import LandingPage from "./components/LandingPage";
import AuthForm from "./components/auth/AuthForm";
import { AuthProvider, useAuth } from "./lib/auth";
import routes from "tempo-routes";
import { Toaster } from "./components/ui/toaster";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  // Redirect to home if authenticated and trying to access auth page
  if (session && window.location.pathname === "/auth") {
    return <Navigate to="/home" replace />;
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { session } = useAuth();
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <Suspense fallback={<p>Loading...</p>}>
      {tempoRoutes}
      <Routes>
        <Route
          path="/"
          element={session ? <Navigate to="/home" replace /> : <LandingPage />}
        />
        <Route
          path="/auth"
          element={session ? <Navigate to="/home" replace /> : <AuthForm />}
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <AppRoutes />
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
