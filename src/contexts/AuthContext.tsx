import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AuthStatus = "INITIALIZING" | "AUTHENTICATED" | "UNAUTHENTICATED";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authStatus: AuthStatus;
  isAdmin: boolean;
  isAdminLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("INITIALIZING");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const isMountedRef = useRef(true);
  const adminCache = useRef<Record<string, boolean>>({});
  const initialProcessed = useRef(false);
  const pendingAdminCheckId = useRef<string | null>(null);

  // Check admin role securely via user_roles table
  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    if (adminCache.current[userId] !== undefined) {
      return adminCache.current[userId];
    }
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.warn("[AuthContext] Admin verification query failed:", error.message);
        return false;
      }
      const isRoleAdmin = !!data;
      adminCache.current[userId] = isRoleAdmin;
      return isRoleAdmin;
    } catch (err) {
      console.error("[AuthContext] Unexpected error during admin verification:", err);
      return false;
    }
  }, []);

  // Safely apply session and trigger deferred admin verification
  const applySession = useCallback(
    (currentSession: Session | null, event: string) => {
      if (!isMountedRef.current) return;

      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        setAuthStatus("AUTHENTICATED");
        setIsAdminLoading(true);
        pendingAdminCheckId.current = currentUser.id;

        // CRITICAL: Defer the async database query outside of onAuthStateChange
        // to prevent client-side lock deadlocks during session transitions.
        setTimeout(async () => {
          if (!isMountedRef.current) return;
          if (pendingAdminCheckId.current !== currentUser.id) return;

          const isRoleAdmin = await checkAdminRole(currentUser.id);
          if (isMountedRef.current && pendingAdminCheckId.current === currentUser.id) {
            setIsAdmin(isRoleAdmin);
            setIsAdminLoading(false);
          }
        }, 0);
      } else {
        setAuthStatus("UNAUTHENTICATED");
        setIsAdmin(false);
        setIsAdminLoading(false);
        pendingAdminCheckId.current = null;
      }
    },
    [checkAdminRole]
  );

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Subscribe to all Supabase auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      initialProcessed.current = true;
      applySession(newSession, event);
    });

    // 2. Initial session check on mount with safety fallback
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession }, error }) => {
        if (!isMountedRef.current) return;
        if (error) {
          console.warn("[AuthContext] getSession error on mount:", error.message);
        }
        // Only apply if onAuthStateChange hasn't already fired INITIAL_SESSION
        if (!initialProcessed.current) {
          initialProcessed.current = true;
          applySession(existingSession, "INITIAL_SESSION_FALLBACK");
        }
      })
      .catch((err) => {
        console.error("[AuthContext] getSession threw an error:", err);
        if (!initialProcessed.current && isMountedRef.current) {
          initialProcessed.current = true;
          applySession(null, "INITIAL_SESSION_ERROR");
        }
      });

    // 3. Safety timeout: guarantee that initial loading resolves within 4s max
    // even on extreme network throttling or offline states
    const safetyTimeout = setTimeout(() => {
      if (!initialProcessed.current && isMountedRef.current) {
        initialProcessed.current = true;
        setAuthStatus((prev) => (prev === "INITIALIZING" ? "UNAUTHENTICATED" : prev));
        setIsAdminLoading(false);
      }
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    try {
      adminCache.current = {};
      pendingAdminCheckId.current = null;
      setIsAdmin(false);
      setIsAdminLoading(false);
      setUser(null);
      setSession(null);
      setAuthStatus("UNAUTHENTICATED");
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] Error during signOut:", err);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (isMountedRef.current) {
        applySession(data.session, "MANUAL_REFRESH");
      }
    } catch (err) {
      console.warn("[AuthContext] Error manually refreshing session:", err);
    }
  }, [applySession]);

  // loading is true while initializing, or while a logged-in user is awaiting admin role verification
  const loading = authStatus === "INITIALIZING" || (!!user && isAdminLoading);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authStatus,
        isAdmin,
        isAdminLoading,
        signOut,
        refreshSession,
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
