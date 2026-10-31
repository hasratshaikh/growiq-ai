import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  FileText,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Zap,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type UserProfile = {
  name: string;
  email: string;
  avatar: string;
  credits: number;
  trial_claimed_at: string | null;
  trial_ends_at: string | null;
};

type AITool = {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  border: string;
  hover: string;
};

type GrowthItem = {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  color: string;
};

const aiTools: AITool[] = [
  {
    title: "AI Consultant",
    description: "Get personalized career and growth guidance.",
    path: "/ai-consultant",
    icon: MessageCircle,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    border: "border-violet-200",
    hover: "hover:border-violet-300",
  },
  {
    title: "Instagram Audit",
    description: "Understand your profile and improve your presence.",
    path: "/instagram-audit",
    icon: Camera,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
    border: "border-rose-200",
    hover: "hover:border-rose-300",
  },
  {
    title: "LinkedIn Audit",
    description: "Optimize your professional profile with AI insights.",
    path: "/linkedin-audit",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    border: "border-blue-200",
    hover: "hover:border-blue-300",
  },
  {
    title: "Resume Analyzer",
    description: "Improve your resume for stronger opportunities.",
    path: "/resume-analyzer",
    icon: FileText,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    border: "border-emerald-200",
    hover: "hover:border-emerald-300",
  },
  {
    title: "Content Strategy",
    description: "Build smarter content plans around your goals.",
    path: "/content-strategy",
    icon: TrendingUp,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    border: "border-amber-200",
    hover: "hover:border-amber-300",
  },
  {
    title: "Goal Planner",
    description: "Turn your goals into clear actionable steps.",
    path: "/goal-planner",
    icon: Target,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-700",
    border: "border-cyan-200",
    hover: "hover:border-cyan-300",
  },
];

const growthItems: GrowthItem[] = [
  {
    title: "Reports",
    description: "View your saved AI reports",
    path: "/reports",
    icon: BarChart3,
    bg: "bg-violet-100",
    color: "text-violet-700",
  },
  {
    title: "Subscription",
    description: "Manage credits and your plan",
    path: "/subscription",
    icon: Zap,
    bg: "bg-amber-100",
    color: "text-amber-700",
  },
];

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [pageError, setPageError] = useState("");

  const [profile, setProfile] = useState<UserProfile>({
    name: "User",
    email: "",
    avatar: "",
    credits: 0,
    trial_claimed_at: null,
    trial_ends_at: null,
  });

  const loadUser = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "full_name, email, avatar_url, credits, trial_claimed_at, trial_ends_at"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setPageError(
          "Unable to load your account details. Please refresh the page."
        );
        return;
      }

      if (!profileData) {
        setPageError(
          "Your GrowIQ profile could not be found. Please contact support."
        );
        return;
      }

      const nextProfile: UserProfile = {
        name:
          profileData.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User",
        email: profileData.email || user.email || "",
        avatar:
          profileData.avatar_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          "",
        credits: Number(profileData.credits ?? 0),
        trial_claimed_at: profileData.trial_claimed_at ?? null,
        trial_ends_at: profileData.trial_ends_at ?? null,
      };

      setProfile(nextProfile);
      setShowTrialModal(!nextProfile.trial_claimed_at);
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setPageError("Something went wrong while loading your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const handleActivateTrial = async () => {
    setActivatingTrial(true);
    setPageError("");

    try {
      const { data, error } = await supabase.rpc("claim_free_trial");

      if (error) {
        setPageError(error.message);
        return;
      }

      if (data?.success === false || data?.claimed === false) {
        setPageError(
          data?.message ||
            "Free Trial has already been claimed or is unavailable."
        );
        await loadUser();
        return;
      }

      await loadUser();
      setShowTrialModal(false);
    } catch (error) {
      console.error("Free Trial activation error:", error);
      setPageError("Unable to activate your Free Trial. Please try again.");
    } finally {
      setActivatingTrial(false);
    }
  };

  const firstName = profile.name.split(" ")[0] || "User";
  const trialIsActive =
    Boolean(profile.trial_ends_at) &&
    new Date(profile.trial_ends_at as string).getTime() > Date.now();

  const currentPlan = trialIsActive
    ? "Free Trial"
    : profile.trial_claimed_at
      ? "Trial Expired"
      : "Not Activated";

  const creditPercentage = Math.min(
    Math.max(profile.credits, 0),
    100
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-violet-700" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      {/* First-time Free Trial Activation Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setShowTrialModal(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close Free Trial popup"
            >
              <X size={18} />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Sparkles size={26} />
            </div>

            <div className="mt-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Welcome to GrowIQ AI
              </p>
              <h2
                id="trial-modal-title"
                className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
              >
                Activate your Free Trial
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start your personal growth journey with free AI credits.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
              <div className="flex items-end justify-center gap-2">
                <span className="text-4xl font-bold text-violet-800">100</span>
                <span className="pb-1 text-sm font-semibold text-violet-700">
                  Credits
                </span>
              </div>
              <p className="mt-1 text-center text-sm font-medium text-slate-600">
                15 days of Free Trial access
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3 text-center">
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">₹0</p>
                </div>
                <div className="rounded-xl bg-white p-3 text-center">
                  <p className="text-xs text-slate-400">Validity</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">15 Days</p>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                100 credits added to your account
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                One-time trial activation
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                No payment required
              </li>
            </ul>

            {pageError && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {pageError}
              </p>
            )}

            <button
              type="button"
              onClick={handleActivateTrial}
              disabled={activatingTrial}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f3185] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activatingTrial ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Activating...
                </>
              ) : (
                <>
                  Activate Free Trial
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              Your trial can only be activated once per account.
            </p>
          </div>
        </div>
      )}

      <main className="min-h-screen">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Top Bar */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-sm font-medium text-violet-700">
                Your growth workspace
              </p>

              <h1 className="text-[25px] font-semibold tracking-tight text-slate-900 sm:text-[28px]">
                Good to see you, {firstName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Turn your goals into actionable growth with AI.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                AI services online
              </div>

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={18} className="text-slate-500" />
                )}
              </div>
            </div>
          </div>

          {pageError && !showTrialModal && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          )}

          {/* Hero */}
          <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#3d2878] via-[#4937a3] to-[#263b87] p-5 text-white shadow-[0_18px_45px_rgba(50,40,120,0.20)] sm:p-7">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />
            <div className="absolute -bottom-28 right-20 h-52 w-52 rounded-full bg-blue-300/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur-sm">
                  <Sparkles size={13} />
                  AI-powered growth workspace
                </div>

                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Build a better version of yourself.
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100/85">
                  Analyze your professional presence, create strategies,
                  improve your resume and get personalized guidance.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/ai-consultant")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#43358d] shadow-sm transition hover:bg-slate-100"
                >
                  Explore AI Tools
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Credits Summary */}
              <button
                type="button"
                onClick={() => navigate("/subscription")}
                className="w-full max-w-[280px] rounded-2xl border border-white/15 bg-white/[0.09] p-4 text-left backdrop-blur-md transition hover:bg-white/[0.14] lg:min-w-[250px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-100">
                    Available Credits
                  </span>

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15">
                    <Zap size={15} className="text-amber-300" />
                  </div>
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold">
                    {profile.credits.toLocaleString("en-IN")}
                  </span>
                  <span className="pb-1 text-sm text-indigo-200">credits</span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-indigo-200 transition-all duration-500"
                    style={{ width: `${creditPercentage}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between gap-2 text-[11px] text-indigo-200">
                  <span>{currentPlan}</span>
                  <span>View subscription →</span>
                </div>

                {profile.trial_ends_at && trialIsActive && (
                  <p className="mt-2 text-[11px] text-indigo-100">
                    Trial ends: {formatDate(profile.trial_ends_at)}
                  </p>
                )}
              </button>
            </div>
          </section>

          {/* AI Tools */}
          <section className="mb-9">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  AI Tools
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a tool and start improving.
                </p>
              </div>

              <span className="hidden text-xs font-medium text-slate-400 sm:block">
                6 tools available
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {aiTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <button
                    key={tool.title}
                    type="button"
                    onClick={() => navigate(tool.path)}
                    className={`group flex min-h-[145px] flex-col rounded-2xl border ${tool.border} bg-white p-5 text-left shadow-[0_3px_15px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 ${tool.hover} hover:shadow-[0_8px_25px_rgba(15,23,42,0.07)]`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.iconBg} ${tool.iconColor}`}
                      >
                        <Icon size={19} />
                      </div>

                      <ChevronRight
                        size={17}
                        className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
                      />
                    </div>

                    <div className="mt-5">
                      <h3 className="text-[15px] font-semibold text-slate-800">
                        {tool.title}
                      </h3>

                      <p className="mt-1.5 max-w-[280px] text-xs leading-5 text-slate-500">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* My Growth */}
          <section className="mb-9">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                My Growth
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep track of your progress and activity.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {growthItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.05)]"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={17}
                      className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
                    />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Consultant CTA */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.025)] sm:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <MessageCircle size={20} />
                </div>

                <div>
                  <h3 className="text-[15px] font-semibold text-slate-800">
                    Need help deciding your next move?
                  </h3>

                  <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500">
                    Talk to your AI Consultant and get personalized guidance
                    based on your goals.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/ai-consultant")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#3f3185]"
              >
                Start Conversation
                <ArrowRight size={15} />
              </button>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
            <span>© 2026 GrowIQ AI</span>
            <span>Personal growth, powered by AI.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
