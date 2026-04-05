import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate("/account", { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
        navigate("/account");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "Please check your email to confirm your account." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="h-8 w-32 mx-auto bg-muted animate-pulse" />
            <div className="h-11 w-full bg-muted animate-pulse" />
            <div className="h-11 w-full bg-muted animate-pulse" />
            <div className="h-12 w-full bg-muted animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-light tracking-[0.04em] text-center mb-8">
            {isLogin ? "Sign In" : "Create Account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase"
            >
              {loading ? "..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
