import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { authManager } from "@/lib/auth/AuthManager";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authManager: typeof authManager;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  authManager,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const adminCache = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async (userId: string) => {
      if (adminCache.current[userId] !== undefined) {
        return adminCache.current[userId];
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      const result = !!data;
      adminCache.current[userId] = result;
      return result;
    };

    const handleUser = async (u: User | null, event?: string) => {
      if (!mounted) return;
      setUser(u);
      
      if (u) {
        // Register the device on login or session restore
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          await authManager.registerTrustedDevice();
        }
        
        const admin = await checkAdmin(u.id);
        if (mounted) setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
      if (mounted) setLoading(false);
    };

    // Set up a single listener for the entire app
    const { data: { subscription } } = authManager.onAuthStateChange((event, session) => {
      // Supabase automatically broadcasts SIGNED_IN/SIGNED_OUT across tabs via local storage
      handleUser(session?.user ?? null, event);
    });

    // Check initial session
    authManager.getSession().then(({ data: { session } }) => {
      handleUser(session?.user ?? null, "INITIAL_SESSION");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, authManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
