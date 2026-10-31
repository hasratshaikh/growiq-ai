
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21.35 12.23c0-.78-.07-1.53-.22-2.23H12v4.22h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.38Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
        fill="#34A853"
      />
      <path
        d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.08.31-1.58V7.89H3.3A9.5 9.5 0 0 0 2.5 12c0 1.53.37 2.98 1.02 4.11l3.02-2.53Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.39c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.47 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.02 2.53C7.09 8.11 9.24 6.39 12 6.39Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();

  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Session check error:", error);
      }

      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingSession(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMessage("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafd]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="mt-4 text-sm text-gray-500">
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafd]">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-200/40 blur-[130px]" />
        <div className="absolute bottom-[-200px] left-[-100px] h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-[120px]" />
      </div>

      {/* HEADER */}
      <header className="relative z-10">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/20">
              <Sparkles size={17} />
            </span>

            <span>
              GrowIQ<span className="text-violet-600"> AI</span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-black"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>
      </header>

      {/* AUTH */}
      <main className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-[30px] border border-black/[0.07] bg-white p-7 shadow-2xl shadow-violet-900/[0.08] sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Sparkles size={25} />
            </div>

            <div className="mt-7 text-center">
              <h1 className="text-3xl font-bold tracking-[-0.035em]">
                Welcome to GrowIQ
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                Your personal AI growth workspace for career, content,
                personal branding and goals.
              </p>
            </div>

            {/* GOOGLE BUTTON */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-black/20 hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {loading ? "Connecting..." : "Continue with Google"}
            </button>

            {errorMessage && (
              <p className="mt-3 text-center text-sm text-red-600">
                {errorMessage}
              </p>
            )}

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-black/7" />
              <span className="text-xs font-medium text-gray-400">
                Secure sign in
              </span>
              <div className="h-px flex-1 bg-black/7" />
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Simple & secure
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    We use Google authentication to keep your account secure.
                    No passwords to remember.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-7 text-center text-xs leading-5 text-gray-400">
              By continuing, you agree to GrowIQ AI's Terms of Service and
              Privacy Policy.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} GrowIQ AI
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
