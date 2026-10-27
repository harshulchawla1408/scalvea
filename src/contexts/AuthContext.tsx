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

const STORAGE_KEY = "sb-dtehgajreecaonqalxlf-auth-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous probe from localStorage on initial render to prevent flash
  const getInitialState = () => {
    if (typeof window === "undefined") {
      return { initialUser: null, initialSession: null, initialAdmin: false };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          const cachedAdmin = window.sessionStorage.getItem(`scalvea_admin_${parsed.user.id}`) === "true";
          return {
            initialUser: parsed.user as User,
            initialSession: parsed as Session,
            initialAdmin: cachedAdmin,
          };
        }
      }
    } catch {}
    return { initialUser: null, initialSession: null, initialAdmin: false };
  };

  const initial = getInitialState();

  const [user, setUser] = useState<User | null>(initial.initialUser);
  const [session, setSession] = useState<Session | null>(initial.initialSession);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    initial.initialUser ? "AUTHENTICATED" : "INITIALIZING"
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(initial.initialAdmin);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  const userRef = useRef<User | null>(initial.initialUser);
  const adminCache = useRef<Record<string, boolean>>(
    initial.initialUser && initial.initialAdmin ? { [initial.initialUser.id]: true } : {}
  );
  const initialProcessed = useRef(false);
  const pendingAdminCheckId = useRef<string | null>(null);

  // Check admin role securely via user_roles table with multi-layer caching
  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    // 1. In-memory cache
    if (adminCache.current[userId] !== undefined) {
      return adminCache.current[userId];
    }
    // 2. SessionStorage cache (preserves verified admin state across page refreshes)
    try {
      if (typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem(`scalvea_admin_${userId}`);
        if (cached === "true") {
          adminCache.current[userId] = true;
          return true;
        }
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.warn("[AuthContext] Admin verification query failed:", error.message);
        // Do not immediately strip admin on transient network error if previously verified in session
        if (typeof window !== "undefined") {
          const cached = window.sessionStorage.getItem(`scalvea_admin_${userId}`);
          if (cached === "true") return true;
        }
        return false;
      }

      const isRoleAdmin = !!data;
      adminCache.current[userId] = isRoleAdmin;

      if (typeof window !== "undefined") {
        try {
          if (isRoleAdmin) {
            window.sessionStorage.setItem(`scalvea_admin_${userId}`, "true");
          } else {
            window.sessionStorage.removeItem(`scalvea_admin_${userId}`);
          }
        } catch {}
      }

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
      const prevUser = userRef.current;

      userRef.current = currentUser;
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        setAuthStatus("AUTHENTICATED");

        // If this is a TOKEN_REFRESHED event for the exact same active user,
        // do not reset admin loading or trigger UI unmounts!
        if (event === "TOKEN_REFRESHED" && prevUser?.id === currentUser.id && adminCache.current[currentUser.id] !== undefined) {
          return;
        }

        // Check if admin status is already verified in memory or sessionStorage
        let cachedAdmin = adminCache.current[currentUser.id];
        if (cachedAdmin === undefined && typeof window !== "undefined") {
          try {
            if (window.sessionStorage.getItem(`scalvea_admin_${currentUser.id}`) === "true") {
              cachedAdmin = true;
              adminCache.current[currentUser.id] = true;
            }
          } catch {}
        }

        if (cachedAdmin !== undefined) {
          setIsAdmin(cachedAdmin);
          setIsAdminLoading(false);
          return;
        }

        setIsAdminLoading(true);
        pendingAdminCheckId.current = currentUser.id;

        // Defer database query outside of auth event loop to prevent deadlocks
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

    // 2. Authoritative initial getSession call
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession }, error }) => {
        if (!isMountedRef.current) return;
        if (error) {
          console.warn("[AuthContext] getSession error on mount:", error.message);
        }
        initialProcessed.current = true;
        applySession(existingSession, "GET_SESSION_INITIAL");
      })
      .catch((err) => {
        console.error("[AuthContext] getSession error:", err);
        if (!initialProcessed.current && isMountedRef.current) {
          initialProcessed.current = true;
          applySession(null, "INITIAL_SESSION_ERROR");
        }
      });

    // 3. Safety timeout: guarantee that initial loading resolves within 5s
    const safetyTimeout = setTimeout(() => {
      if (!initialProcessed.current && isMountedRef.current) {
        initialProcessed.current = true;
        setAuthStatus((prev) => (prev === "INITIALIZING" ? "UNAUTHENTICATED" : prev));
        setIsAdminLoading(false);
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    try {
      const currentId = userRef.current?.id;
      if (currentId && typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(`scalvea_admin_${currentId}`);
        } catch {}
      }
      adminCache.current = {};
      pendingAdminCheckId.current = null;
      userRef.current = null;
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

  // loading is true ONLY while initializing initial session, or while logged-in user awaits admin check
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
