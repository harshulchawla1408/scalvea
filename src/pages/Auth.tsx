import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/contexts/CountryContext";
import { toast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";

// Import beauty/lifestyle assets
import hero3 from "@/assets/hero3.png";
import client1 from "@/assets/client-1.jpg";
import client4 from "@/assets/client-4.jpg";
import about1 from "@/assets/about1.png";

// Rotating images array
const images = [hero3, client1, client4, about1];

// Monochrome Google Icon for luxury brand aesthetic
const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

// Floating subtle particles overlay
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.25; }
          90% { opacity: 0.25; }
          100% { transform: translateY(-110vh) scale(0.6); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 12 }).map((_, i) => {
        const size = Math.random() * 2 + 1;
        const left = Math.random() * 100;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * -25;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-neutral-400/60"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: `-20px`,
              animation: `floatUp ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

// Luxury Input Component with floating labels and focus animations
const LuxuryInput = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  required = false,
  minLength,
  showPasswordToggle = false,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  showPasswordToggle?: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPasswordToggle && showPassword ? "text" : type;

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className="peer w-full h-[52px] pt-5 pb-1 px-4 text-xs font-light bg-neutral-50/20 backdrop-blur-sm border border-neutral-200 outline-none transition-all duration-300 focus:border-neutral-900 focus:bg-white text-neutral-800 rounded-none placeholder-transparent"
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-[17px] pointer-events-none transition-all duration-300 uppercase tracking-[0.12em] text-[9px] text-neutral-400 peer-placeholder-shown:text-[10px] peer-placeholder-shown:top-[17px] peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-neutral-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[8px] peer-[:not(:placeholder-shown)]:text-neutral-500"
      >
        {label}
      </label>

      {isPassword && showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
};

// Animated text logo component with tracking letter-spacing animation on mount
const LogoAnimation = () => {
  const word = "SCALVEA";
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center py-4 select-none"
    >
      <motion.div
        variants={{
          hidden: { letterSpacing: "0.15em" },
          visible: {
            letterSpacing: "0.3em",
            transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
          }
        }}
        className="flex items-center text-xl md:text-2xl font-light tracking-[0.25em] uppercase text-foreground relative py-1"
      >
        {word.split("").map((letter, idx) => (
          <motion.span
            key={idx}
            variants={{
              hidden: { opacity: 0, filter: "blur(6px)", y: 6 },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: { duration: 1.2, delay: idx * 0.06, ease: [0.25, 1, 0.5, 1] }
              }
            }}
            className="inline-block"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
};

const Auth = () => {
  useSEO({
    title: "Sign In / Register",
    description: "Access your Scalvea account to manage orders and billing.",
    noindex: true
  });

  const [view, setView] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Left panel mouse tracking (parallax + lighting)
  const [leftParallax, setLeftParallax] = useState({ x: 0, y: 0 });
  const [leftLightPos, setLeftLightPos] = useState({ x: 50, y: 50 });

  // Right panel mouse-following glow
  const [rightLightPos, setRightLightPos] = useState({ x: 0, y: 0 });
  const [rightLightOpacity, setRightLightOpacity] = useState(0);

  // Carousel index
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const { user, loading: authLoading } = useAuth();
  const { currency } = useCountry();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected currency display
  const displayCurrency = currency === "INR" ? "INR" : currency === "AUD" ? "AUD" : "USD";

  // Check URL parameters for recovery link or handle initial load checks
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    const isRecovery = params.get("type") === "recovery" || hashParams.get("type") === "recovery" || location.hash.includes("type=recovery");
    if (isRecovery) {
      setView("reset");
    }

    // Load saved email for remember me
    const savedEmail = localStorage.getItem("scalvea_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [location]);

  // Handle redirect if logged in, unless in recovery mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const isRecovery = params.get("type") === "recovery" || hashParams.get("type") === "recovery" || location.hash.includes("type=recovery");

    if (!authLoading && user && !isRecovery) {
      navigate("/account", { replace: true });
    }
  }, [authLoading, user, navigate, location]);

  // Rotate background images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Left panel mouse movements
  const handleLeftMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLeftLightPos({ x, y });

    // Slow inverse parallax
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * -12;
    const py = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setLeftParallax({ x: px, y: py });
  };

  // Right panel mouse movements for glow
  const handleRightMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRightLightPos({ x, y });
    setRightLightOpacity(0.045); // Subtle intensity
  };

  const handleRightMouseLeave = () => {
    setRightLightOpacity(0);
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  // Handle Form Submit (Signin, Signup, Forgot, Reset)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem("scalvea_remember_email", email);
        } else {
          localStorage.removeItem("scalvea_remember_email");
        }

        toast({ title: "Welcome back!" });
        navigate("/account");
      } else if (view === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });
        if (error) throw error;

        setSuccessMessage("Your account has been created. Please check your email to verify and activate your account.");
        toast({ title: "Account created", description: "Verification link sent." });
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;

        setSuccessMessage("We've sent a password recovery link to your email. Check your inbox to complete the process.");
        toast({ title: "Email sent", description: "Password recovery link sent." });
      } else if (view === "reset") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        toast({ title: "Password updated successfully" });
        setView("signin");
        navigate("/auth", { replace: true });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 noise-bg opacity-[0.02] pointer-events-none" />
        <div className="space-y-6 w-full max-w-sm text-center">
          <div className="h-6 w-24 bg-neutral-200/60 animate-pulse mx-auto" />
          <div className="space-y-3">
            <div className="h-[52px] bg-neutral-200/40 animate-pulse" />
            <div className="h-[52px] bg-neutral-200/40 animate-pulse" />
            <div className="h-[52px] bg-neutral-900/10 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden relative bg-[#FAF9F6] selection:bg-neutral-200 selection:text-neutral-900">
      {/* Global Grain/Noise Overlay */}
      <div className="absolute inset-0 noise-bg opacity-[0.015] pointer-events-none z-10" />

      {/* MOBILE FULLSCREEN BACKGROUND IMAGE */}
      <div className="absolute inset-0 md:hidden z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImgIndex}
            src={images[currentImgIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover filter blur-[1px]"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-white/35 backdrop-blur-[2px]" />
      </div>

      {/* LEFT SIDE: Cinematic Media Panel (Desktop Only) */}
      <div
        onMouseMove={handleLeftMouseMove}
        className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-neutral-950 text-white select-none"
      >
        {/* Carousel Image container */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImgIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 1.6, ease: [0.25, 1, 0.5, 1] }}
              style={{
                transform: `translate3d(${leftParallax.x}px, ${leftParallax.y}px, 0)`,
                transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={images[currentImgIndex]}
                alt="Scalvea Clean Beauty Aesthetic"
                className="w-full h-full object-cover opacity-85 filter contrast-[1.02] brightness-90"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Soft luxury lighting spot overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-300"
          style={{
            background: `radial-gradient(circle 420px at ${leftLightPos.x}% ${leftLightPos.y}%, rgba(255, 255, 255, 0.09) 0%, rgba(0, 0, 0, 0) 100%)`,
          }}
        />

        {/* Top-down and bottom-up cinematic vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/45 pointer-events-none z-10" />

        {/* Typography Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-12 lg:p-16">
          {/* Top Logo Watermark */}
          <div className="text-[10px] tracking-[0.25em] uppercase font-light opacity-60">
            SCALVEA · LABS
          </div>

          {/* Central Editorial Heading */}
          <div className="space-y-4 max-w-md">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl lg:text-5xl font-light leading-tight text-neutral-100 editorial-heading"
            >
              Nothing To Hide
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs uppercase tracking-[0.15em] text-neutral-300/80 font-light leading-relaxed"
            >
              Science-backed hair care designed for real results.
            </motion.p>
          </div>

          {/* Bottom Captions */}
          <div className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 font-light flex justify-between items-center border-t border-white/10 pt-6">
            <span>Australia + India</span>
            <span>Est. 2026</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form (Responsive Viewports) */}
      <div
        onMouseMove={handleRightMouseMove}
        onMouseLeave={handleRightMouseLeave}
        className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-16 relative z-10 min-h-screen bg-transparent md:bg-[#FAF9F6]"
      >
        {/* Mouse Follow Glow spot on Desktop */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-600 hidden md:block"
          style={{
            opacity: rightLightOpacity,
            background: `radial-gradient(400px circle at ${rightLightPos.x}px ${rightLightPos.y}px, rgba(0, 0, 0, 0.06), transparent 85%)`
          }}
        />

        {/* Dynamic Subtle Floating Particles */}
        <FloatingParticles />

        {/* TOP HEADER: Centered Logo & Currency indicator */}
        <div className="w-full flex items-center justify-between z-10 relative">
          <Link to="/" className="text-neutral-400 hover:text-neutral-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Subtle Region display */}
          <div className="text-[9px] tracking-[0.2em] text-neutral-400 font-mono select-none px-2.5 py-1 border border-neutral-200 bg-neutral-50/50 backdrop-blur-md">
            {displayCurrency}
          </div>
        </div>

        {/* MAIN CARD CONTAINER */}
        <div className="my-auto w-full max-w-[420px] mx-auto z-10 relative bg-white/75 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-8 md:p-0 border border-white/30 md:border-none shadow-xl md:shadow-none transition-all duration-300">
          
          {/* Logo Animation */}
          <div className="mb-6 md:mb-8">
            <LogoAnimation />
          </div>

          <AnimatePresence mode="wait">
            {successMessage ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6 py-6"
              >
                <div className="mx-auto w-12 h-12 rounded-none border border-neutral-300 flex items-center justify-center text-neutral-800 mb-2">
                  <Check className="h-4 w-4 stroke-[1.5]" />
                </div>
                <h3 className="text-sm tracking-[0.15em] uppercase text-neutral-800 font-light">
                  Email Confirmed / Sent
                </h3>
                <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-[300px] mx-auto">
                  {successMessage}
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSuccessMessage(null);
                      setView("signin");
                    }}
                    className="text-[10px] tracking-[0.18em] uppercase text-neutral-800 font-light underline underline-offset-4 hover:opacity-65 transition-opacity"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="w-full">
                {/* 1. SIGN IN VIEW */}
                {view === "signin" && (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-light tracking-[0.06em] text-neutral-800">
                        Welcome Back
                      </h2>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 font-light">
                        Continue your hair growth journey.
                      </p>
                    </div>

                    {/* Google Login above email */}
                    <div className="space-y-4">
                      <motion.button
                        whileHover={{ y: -1.5, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                        whileTap={{ scale: 0.995 }}
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full h-[52px] bg-white border border-neutral-200 hover:border-neutral-900 transition-all duration-300 text-[10px] tracking-[0.15em] uppercase font-light flex items-center justify-center relative px-6 text-neutral-800 rounded-none"
                      >
                        <div className="absolute left-6 text-neutral-700">
                          <GoogleIcon />
                        </div>
                        <span>Continue with Google</span>
                      </motion.button>

                      <div className="flex items-center justify-center gap-4 py-1 w-full select-none">
                        <div className="h-[1px] bg-neutral-200/80 flex-1" />
                        <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400 font-light whitespace-nowrap">
                          or continue with email
                        </span>
                        <div className="h-[1px] bg-neutral-200/80 flex-1" />
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <LuxuryInput
                        label="Email Address"
                        id="email-signin"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />

                      <div className="space-y-2">
                        <LuxuryInput
                          label="Password"
                          id="password-signin"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          showPasswordToggle
                        />
                        
                        <div className="flex items-center justify-between px-1 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="w-3.5 h-3.5 border border-neutral-300 bg-transparent rounded-none appearance-none checked:bg-black checked:border-black relative flex items-center justify-center cursor-pointer transition-colors focus:ring-0 focus:outline-none after:content-[''] after:w-1 after:h-2 after:border-r-[1.5px] after:border-b-[1.5px] after:border-white after:rotate-45 after:-translate-y-[0.5px] after:opacity-0 checked:after:opacity-100"
                            />
                            <span className="text-[9px] tracking-[0.1em] uppercase text-neutral-400 font-light">
                              Remember email
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setView("forgot")}
                            className="text-[9px] tracking-[0.1em] uppercase text-neutral-400 hover:text-neutral-800 transition-colors font-light underline underline-offset-2"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.005, backgroundColor: "#171717" }}
                        whileTap={{ scale: 0.995 }}
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] bg-black text-white transition-all duration-300 text-[10px] tracking-[0.2em] uppercase font-light flex items-center justify-center select-none rounded-none"
                      >
                        {loading ? "Processing..." : "Sign In"}
                      </motion.button>
                    </form>

                    <div className="text-center pt-2 select-none">
                      <button
                        onClick={() => setView("signup")}
                        className="text-[10px] tracking-[0.12em] uppercase text-neutral-400 hover:text-neutral-800 transition-colors font-light relative group inline-block"
                      >
                        Don't have an account? Create one
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-neutral-800 transition-all duration-300 group-hover:w-full" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 2. SIGN UP VIEW */}
                {view === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-light tracking-[0.06em] text-neutral-800">
                        Create Your Account
                      </h2>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 font-light">
                        Join the SCALVEA community.
                      </p>
                    </div>

                    {/* Google Signup above email */}
                    <div className="space-y-4">
                      <motion.button
                        whileHover={{ y: -1.5, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                        whileTap={{ scale: 0.995 }}
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full h-[52px] bg-white border border-neutral-200 hover:border-neutral-900 transition-all duration-300 text-[10px] tracking-[0.15em] uppercase font-light flex items-center justify-center relative px-6 text-neutral-800 rounded-none"
                      >
                        <div className="absolute left-6 text-neutral-700">
                          <GoogleIcon />
                        </div>
                        <span>Continue with Google</span>
                      </motion.button>

                      <div className="flex items-center justify-center gap-4 py-1 w-full select-none">
                        <div className="h-[1px] bg-neutral-200/80 flex-1" />
                        <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400 font-light whitespace-nowrap">
                          or continue with email
                        </span>
                        <div className="h-[1px] bg-neutral-200/80 flex-1" />
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <LuxuryInput
                        label="Full Name"
                        id="name-signup"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />

                      <LuxuryInput
                        label="Email Address"
                        id="email-signup"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />

                      <LuxuryInput
                        label="Password"
                        id="password-signup"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        showPasswordToggle
                      />

                      <LuxuryInput
                        label="Confirm Password"
                        id="confirm-signup"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        showPasswordToggle
                      />

                      <motion.button
                        whileHover={{ scale: 1.005, backgroundColor: "#171717" }}
                        whileTap={{ scale: 0.995 }}
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] bg-black text-white transition-all duration-300 text-[10px] tracking-[0.2em] uppercase font-light flex items-center justify-center select-none rounded-none"
                      >
                        {loading ? "Creating..." : "Create Account"}
                      </motion.button>
                    </form>

                    <div className="text-center pt-2 select-none">
                      <button
                        onClick={() => setView("signin")}
                        className="text-[10px] tracking-[0.12em] uppercase text-neutral-400 hover:text-neutral-800 transition-colors font-light relative group inline-block"
                      >
                        Already have an account? Sign in
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-neutral-800 transition-all duration-300 group-hover:w-full" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. FORGOT PASSWORD VIEW */}
                {view === "forgot" && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-light tracking-[0.06em] text-neutral-800">
                        Recover Password
                      </h2>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 font-light">
                        Enter your email to receive a recovery link.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <LuxuryInput
                        label="Email Address"
                        id="email-forgot"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />

                      <motion.button
                        whileHover={{ scale: 1.005, backgroundColor: "#171717" }}
                        whileTap={{ scale: 0.995 }}
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] bg-black text-white transition-all duration-300 text-[10px] tracking-[0.2em] uppercase font-light flex items-center justify-center select-none rounded-none"
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </motion.button>
                    </form>

                    <div className="text-center pt-2 select-none">
                      <button
                        onClick={() => setView("signin")}
                        className="text-[10px] tracking-[0.12em] uppercase text-neutral-400 hover:text-neutral-800 transition-colors font-light flex items-center justify-center gap-1.5 mx-auto hover:underline underline-offset-2"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 4. RESET PASSWORD VIEW */}
                {view === "reset" && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-light tracking-[0.06em] text-neutral-800">
                        Reset Password
                      </h2>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 font-light">
                        Create a new secure password for your account.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <LuxuryInput
                        label="New Password"
                        id="password-reset"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        showPasswordToggle
                      />

                      <LuxuryInput
                        label="Confirm New Password"
                        id="confirm-reset"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        showPasswordToggle
                      />

                      <motion.button
                        whileHover={{ scale: 1.005, backgroundColor: "#171717" }}
                        whileTap={{ scale: 0.995 }}
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] bg-black text-white transition-all duration-300 text-[10px] tracking-[0.2em] uppercase font-light flex items-center justify-center select-none rounded-none"
                      >
                        {loading ? "Updating..." : "Update Password"}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM FOOTER: Legal terms */}
        <div className="w-full text-center z-10 relative pt-8 md:pt-0 select-none">
          <div className="flex justify-center gap-4 text-[9px] tracking-[0.2em] text-neutral-400 uppercase font-light">
            <Link to="/privacy-policy" className="hover:text-neutral-700 transition-colors">Privacy</Link>
            <span>·</span>
            <Link to="/terms-of-service" className="hover:text-neutral-700 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
