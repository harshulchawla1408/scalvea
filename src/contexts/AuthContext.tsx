import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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

    const handleUser = async (u: User | null) => {
      if (!mounted) return;
      setUser(u);
      if (u) {
        const admin = await checkAdmin(u.id);
        if (mounted) setIsAdmin(admin);
      } else {
        if (mounted) setIsAdmin(false);
      }
      if (mounted) setLoading(false);
    };

    // Set up listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      handleUser(session?.user ?? null);
    });

    // Then check current session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
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
