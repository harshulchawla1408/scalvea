import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";
import { toast } from "@/hooks/use-toast";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute
 * Guards administrative routes (/admin/*).
 * Critical guarantees:
 * 1. Waits for session recovery AND admin privilege verification to complete before any routing decision.
 * 2. Does NOT unmount or redirect during token refresh because AuthContext preserves cached admin status.
 * 3. Safely redirects unauthenticated users to /auth with returnTo, and unauthorized customers to home with an alert.
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, authStatus, isAdmin, isAdminLoading } = useAuth();
  const location = useLocation();

  const isResolving =
    authStatus === "INITIALIZING" ||
    (loading && !user) ||
    (user !== null && isAdminLoading);

  useEffect(() => {
    // Only alert if we have verified the user is authenticated but definitely lacks admin privileges
    if (!isResolving && user && !isAdmin) {
      toast({
        title: "Access denied",
        description: "Admin privileges required.",
        variant: "destructive",
      });
    }
  }, [isResolving, user, isAdmin]);

  if (isResolving) {
    return <PageLoader />;
  }

  if (authStatus === "UNAUTHENTICATED" || (!user && !loading)) {
    const returnPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnPath}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
