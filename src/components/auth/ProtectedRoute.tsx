import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute
 * Guards routes that require a signed-in customer or admin.
 * Critical guarantees:
 * 1. Never redirects while auth is INITIALIZING (prevents false-positive sign-outs on reload).
 * 2. Remembers returnTo so users return directly to where they were after signing in.
 * 3. Shows PageLoader during session resolution to prevent flicker or premature redirect.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === "INITIALIZING" || (loading && !user)) {
    return <PageLoader />;
  }

  if (authStatus === "UNAUTHENTICATED" || (!user && !loading)) {
    const returnPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnPath}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
