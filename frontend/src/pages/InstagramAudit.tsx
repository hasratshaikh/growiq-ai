import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  Globe,
  Link as LinkIcon,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function InstagramAudit() {
  const navigate = useNavigate();

  const [profileUrl, setProfileUrl] = useState("");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasCreditAccess, setHasCreditAccess] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");

  const checkCreditAccess = async () => {
    setAccessLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_credit_access");

      if (error) {
        console.error("Credit access check failed:", error);
        setHasCreditAccess(false);
        setAccessMessage("Unable to verify your plan. Please try again.");
        return;
      }

      const allowed = Boolean(data?.allowed);
      setHasCreditAccess(allowed);
      setAvailableCredits(Number(data?.credits ?? 0));

      if (!allowed) {
        setAccessMessage(
          data?.reason === "INSUFFICIENT_CREDITS"
            ? "You have insufficient credits. Please upgrade your plan."
            : "Your trial has expired or your plan is inactive. Please upgrade your plan."
        );
      } else {
        setAccessMessage("");
      }
    } catch (accessError) {
      console.error("Credit access error:", accessError);
      setHasCreditAccess(false);
      setAccessMessage("Unable to verify your plan. Please try again.");
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    void checkCreditAccess();
  }, []);

  const handleGenerateAudit = async () => {
    if (
      !profileUrl.trim() ||
      !name.trim() ||
      !niche.trim() ||
      !primaryGoal
    ) {
      setErrorMessage(
        "Please complete all required fields before generating your audit.",
      );

      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setErrorMessage(
          "Your session has expired. Please login again.",
        );

        return;
      }

      // Re-check access immediately before charging.
      const { data: accessData, error: accessError } =
        await supabase.rpc("get_credit_access");

      if (accessError || !accessData?.allowed) {
        setHasCreditAccess(false);
        setAvailableCredits(Number(accessData?.credits ?? 0));
        setAccessMessage(
          accessData?.reason === "INSUFFICIENT_CREDITS"
            ? "You need 10 credits to run an Instagram Audit."
            : "Your plan is inactive or your trial has expired. Please upgrade your plan."
        );
        return;
      }

      // Instagram Audit costs 10 credits.
      const { data: creditData, error: creditError } =
        await supabase.rpc("consume_feature_credits", {
          p_feature: "instagram-audit",
        });

      if (creditError) {
        console.error("Instagram Audit credit deduction failed:", creditError);
        setErrorMessage("Unable to process the 10-credit charge. Please try again.");
        return;
      }

      if (!creditData?.allowed) {
        setAvailableCredits(Number(creditData?.credits ?? 0));
        setHasCreditAccess(false);
        setAccessMessage(
          creditData?.reason === "INSUFFICIENT_CREDITS"
            ? "You need 10 credits to run an Instagram Audit."
            : "Your plan is inactive or your trial has expired. Please upgrade your plan."
        );
        return;
      }

      setAvailableCredits(Number(creditData.credits ?? Math.max(availableCredits - 10, 0)));

      const { data, error } =
        await supabase.functions.invoke(
          "instagram-audit",
          {
            body: {
              profileUrl: profileUrl.trim(),
              name: name.trim(),
              niche: niche.trim(),
              primaryGoal: primaryGoal.trim(),
              competitorUrl: competitorUrl.trim(),
              websiteUrl: websiteUrl.trim(),
              additionalNotes: additionalNotes.trim(),
            },
          },
        );

      /*
       * Supabase functions.invoke() can return a generic
       * non-2xx error. Try to extract the actual backend
       * response from error.context.
       */
      if (error) {
        console.error(
          "Instagram Audit Edge Function Error:",
          error,
        );

        let backendMessage = "";

        try {
          const context = error.context;

          if (context instanceof Response) {
            const responseText =
              await context.text();

            console.error(
              "Instagram Audit Backend Response:",
              responseText,
            );

            if (responseText) {
              try {
                const responseJson =
                  JSON.parse(
                    responseText,
                  );

                backendMessage =
                  responseJson?.error ||
                  responseJson?.message ||
                  "";
              } catch {
                backendMessage =
                  responseText;
              }
            }
          }
        } catch (readError) {
          console.error(
            "Unable to read backend error:",
            readError,
          );
        }

        setErrorMessage(
          backendMessage ||
            error.message ||
            "Instagram audit generation failed.",
        );

        return;
      }

      /*
       * Validate successful response.
       */
      if (
        !data?.success ||
        !data?.reportId
      ) {
        setErrorMessage(
          data?.error ||
            "Instagram audit was not generated successfully.",
        );

        return;
      }

      /*
       * Audit successfully generated.
       * Open the actual report page.
       */
      console.log(
        "Instagram audit generated successfully:",
        data,
      );

      navigate(
        `/instagram-audit/report/${data.reportId}`,
      );
    } catch (error) {
      console.error(
        "Unexpected Instagram Audit Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid =
    profileUrl.trim() &&
    name.trim() &&
    niche.trim() &&
    primaryGoal;

  const auditCoverage = [
    "Profile positioning",
    "Bio & CTA",
    "Content strategy",
    "Content quality",
    "Engagement & reach",
    "Instagram SEO & discoverability",
    "Conversion journey",
    "7-day growth action plan",
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#db2777] text-white shadow-sm">
              <Camera size={19} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                Instagram Audit
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Turn your profile into a stronger growth engine
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            AI Ready
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-7">
        {/* Compact Hero */}
        <section className="relative mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#30206d] via-[#50329d] to-[#263f8c] px-6 py-5 text-white shadow-lg sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="pointer-events-none absolute right-[-20px] top-[-65px] h-52 w-52 rounded-full border border-white/10" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-violet-100 backdrop-blur-md">
                <Sparkles
                  size={13}
                  className="text-fuchsia-200"
                />

                AI-Powered Profile Analysis
              </div>

              <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Discover what is holding your Instagram growth
                back.
              </h2>
            </div>

            <div className="relative hidden h-24 w-36 shrink-0 md:block">
              <div className="absolute right-4 top-1/2 flex h-[68px] w-[68px] -translate-y-1/2 rotate-6 items-center justify-center rounded-[20px] bg-gradient-to-br from-fuchsia-400 via-pink-500 to-orange-400 shadow-2xl shadow-fuchsia-900/30">
                <Camera
                  size={29}
                  strokeWidth={1.8}
                />
              </div>

              <div className="absolute bottom-0 right-0 flex h-10 w-[68px] items-end gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-md">
                <span className="h-2.5 w-1.5 rounded-full bg-white/45" />
                <span className="h-4 w-1.5 rounded-full bg-white/55" />
                <span className="h-5.5 w-1.5 rounded-full bg-white/70" />
                <span className="h-7 w-1.5 rounded-full bg-white" />
              </div>

              <Sparkles
                size={14}
                className="absolute left-1 top-2 text-fuchsia-200"
              />
            </div>
          </div>
        </section>

        {/* Main Layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT - FORM */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Start your audit
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Enter your Instagram profile details below.
              </p>
            </div>

            <div className="space-y-5">
              {/* Required fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Instagram Profile */}
                <div>
                  <label
                    htmlFor="instagram-profile"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Instagram Profile
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Camera
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="instagram-profile"
                      type="text"
                      value={profileUrl}
                      onChange={(event) =>
                        setProfileUrl(
                          event.target.value,
                        )
                      }
                      placeholder="@yourusername or profile URL"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-slate-400">
                    @growiqai or instagram.com/growiqai
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Name / Brand Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      placeholder="Your name or brand name"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                {/* Niche */}
                <div>
                  <label
                    htmlFor="niche"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Category / Niche
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="niche"
                    type="text"
                    value={niche}
                    onChange={(event) =>
                      setNiche(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Beauty, Fitness, Fashion, Coach"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                {/* Primary Goal */}
                <div>
                  <label
                    htmlFor="primary-goal"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Primary Goal
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Target
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="primary-goal"
                      value={primaryGoal}
                      onChange={(event) =>
                        setPrimaryGoal(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-10 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">
                        Select your primary goal
                      </option>

                      <option value="Grow Followers">
                        Grow Followers
                      </option>

                      <option value="Generate Leads">
                        Generate Leads
                      </option>

                      <option value="Get More Bookings">
                        Get More Bookings
                      </option>

                      <option value="Build Personal Brand">
                        Build Personal Brand
                      </option>

                      <option value="Increase Engagement">
                        Increase Engagement
                      </option>

                      <option value="Increase Sales">
                        Increase Sales
                      </option>
                    </select>

                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Information */}
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-4 flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Additional Information
                  </h4>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    Optional
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Competitor */}
                  <div>
                    <label
                      htmlFor="competitor"
                      className="mb-1.5 block text-xs font-semibold text-slate-800"
                    >
                      Competitor Profile Link
                    </label>

                    <div className="relative">
                      <LinkIcon
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="competitor"
                        type="text"
                        value={competitorUrl}
                        onChange={(event) =>
                          setCompetitorUrl(
                            event.target.value,
                          )
                        }
                        placeholder="instagram.com/competitor"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label
                      htmlFor="website"
                      className="mb-1.5 block text-xs font-semibold text-slate-800"
                    >
                      Website Link
                    </label>

                    <div className="relative">
                      <Globe
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="website"
                        type="text"
                        value={websiteUrl}
                        onChange={(event) =>
                          setWebsiteUrl(
                            event.target.value,
                          )
                        }
                        placeholder="https://yourwebsite.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label
                    htmlFor="notes"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Additional Notes
                  </label>

                  <div className="relative">
                    <FileText
                      size={16}
                      className="absolute left-3.5 top-3.5 text-slate-400"
                    />

                    <textarea
                      id="notes"
                      value={additionalNotes}
                      onChange={(event) =>
                        setAdditionalNotes(
                          event.target.value,
                        )
                      }
                      rows={2}
                      placeholder="Tell us anything important about your profile, audience or current challenge..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>
              </div>

              {/* Credit / Plan Status */}
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-violet-900">
                      Instagram Audit cost: 10 credits
                    </p>
                    <p className="mt-1 text-[11px] text-violet-700">
                      {accessLoading
                        ? "Checking your plan and credits..."
                        : `${availableCredits} credits available`}
                    </p>
                    {!hasCreditAccess && !accessLoading && accessMessage && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {accessMessage}
                      </p>
                    )}
                  </div>
                  {!hasCreditAccess && !accessLoading && (
                    <button
                      type="button"
                      onClick={() => navigate("/subscription")}
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#4b3a9b] px-4 text-xs font-semibold text-white transition hover:bg-[#3f3185]"
                    >
                      Upgrade Your Plan
                    </button>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleGenerateAudit}
                disabled={
                  !isFormValid ||
                  isGenerating ||
                  accessLoading ||
                  !hasCreditAccess ||
                  availableCredits < 10
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white shadow-md transition hover:bg-[#3f3185] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Generating your audit...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />

                    Generate Instagram Audit (10 Credits)
                  </>
                )}
              </button>

              {/* Backend Error */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-medium leading-5 text-red-600">
                  {errorMessage}
                </div>
              )}

              <p className="text-center text-[10px] text-slate-400">
                Your audit will be generated based on the information
                you provide.
              </p>
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5">
            {/* How it works */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Sparkles size={19} />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  How it works
                </h3>
              </div>

              <div className="space-y-5">
                {[
                  [
                    "01",
                    "Share your profile",
                    "Enter your Instagram profile and basic brand information.",
                  ],
                  [
                    "02",
                    "Set your goal",
                    "Tell GrowIQ what you want to achieve from Instagram.",
                  ],
                  [
                    "03",
                    "Get your report",
                    "Receive structured insights and actionable growth priorities.",
                  ],
                ].map(
                  ([
                    number,
                    title,
                    description,
                  ]) => (
                    <div
                      key={number}
                      className="flex gap-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
                        {number}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {title}
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          {description}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* AI Audit Coverage */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <CheckCircle2 size={19} />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Your AI audit will cover
                </h3>
              </div>

              <div className="grid gap-3">
                {auditCoverage.map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <CheckCircle2
                        size={15}
                        className="mt-0.5 shrink-0 text-violet-600"
                      />

                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* Pro Tip */}
            <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="text-xs font-bold text-violet-900">
                    Pro tip
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-violet-700">
                    Add competitor and website details when available
                    for more contextual recommendations.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}