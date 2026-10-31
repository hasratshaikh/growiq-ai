import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Target,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function LinkedInAudit() {
  const navigate = useNavigate();

  const [profileUrl, setProfileUrl] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");
  const [hasCreditAccess, setHasCreditAccess] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");

  const checkCreditAccess = async () => {
    setAccessLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_credit_access");
      if (error) throw error;

      const access = Array.isArray(data) ? data[0] : data;
      const credits = Number(access?.credits ?? 0);
      const allowed = Boolean(access?.allowed) && credits >= 10;

      setAvailableCredits(credits);
      setHasCreditAccess(allowed);
      setAccessMessage(
        allowed
          ? ""
          : access?.reason || (credits < 10
              ? "You need at least 10 credits to generate a LinkedIn Audit."
              : "Your trial has expired or your plan is inactive."),
      );
    } catch (error) {
      console.error("Credit access check failed:", error);
      setHasCreditAccess(false);
      setAccessMessage("Unable to verify your credits. Please refresh and try again.");
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
      !currentRole.trim() ||
      !industry.trim() ||
      !careerGoal
    ) {
      setErrorMessage(
        "Please complete all required fields before generating your audit.",
      );

      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const { data: accessData, error: accessError } =
        await supabase.rpc("get_credit_access");
      if (accessError) throw accessError;

      const access = Array.isArray(accessData) ? accessData[0] : accessData;
      const currentCredits = Number(access?.credits ?? 0);
      if (!access?.allowed || currentCredits < 10) {
        setAvailableCredits(currentCredits);
        setHasCreditAccess(false);
        setAccessMessage(
          access?.reason ||
            (currentCredits < 10
              ? "You need at least 10 credits to generate a LinkedIn Audit."
              : "Your trial has expired or your plan is inactive."),
        );
        setErrorMessage("Upgrade your plan or add credits to continue.");
        return;
      }

      const { data: debitData, error: debitError } =
        await supabase.rpc("consume_feature_credits", {
          p_feature: "linkedin-audit",
        });
      if (debitError) throw debitError;

      const debit = Array.isArray(debitData) ? debitData[0] : debitData;
      if (debit?.success === false || debit?.allowed === false) {
        throw new Error(debit?.message || debit?.reason || "Unable to deduct credits.");
      }

      setAvailableCredits(Math.max(0, currentCredits - 10));
      if (currentCredits - 10 < 10) {
        setHasCreditAccess(currentCredits - 10 > 0);
        setAccessMessage(
          currentCredits - 10 > 0
            ? "You have fewer than 10 credits remaining."
            : "Your credits are exhausted.",
        );
      }

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

      const { data, error } =
        await supabase.functions.invoke(
          "linkedin-audit",
          {
            body: {
              profileUrl:
                profileUrl.trim(),
              currentRole:
                currentRole.trim(),
              industry:
                industry.trim(),
              careerGoal:
                careerGoal.trim(),
              targetRole:
                targetRole.trim(),
              additionalNotes:
                additionalNotes.trim(),
            },
          },
        );

      if (error) {
        console.error(
          "LinkedIn Audit Edge Function Error:",
          error,
        );

        let backendMessage = "";

        try {
          const context =
            error.context;

          if (
            context instanceof Response
          ) {
            const responseText =
              await context.text();

            console.error(
              "LinkedIn Audit Backend Response:",
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
            "Unable to read LinkedIn backend error:",
            readError,
          );
        }

        setErrorMessage(
          backendMessage ||
            error.message ||
            "LinkedIn audit generation failed.",
        );

        return;
      }

      if (
        !data?.success ||
        !data?.reportId
      ) {
        setErrorMessage(
          data?.error ||
            "LinkedIn audit was not generated successfully.",
        );

        return;
      }

      console.log(
        "LinkedIn audit generated successfully:",
        data,
      );

      navigate(
        `/linkedin-audit/report/${data.reportId}`,
      );
    } catch (error) {
      console.error(
        "Unexpected LinkedIn Audit Error:",
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
    currentRole.trim() &&
    industry.trim() &&
    careerGoal;

  const auditCoverage = [
    "Career positioning",
    "Professional profile strength",
    "Headline & profile messaging",
    "Recruiter discoverability",
    "Professional credibility",
    "Career opportunity gaps",
    "Content & professional presence",
    "7-day priority action plan",
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

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-sm">
              <BriefcaseBusiness size={19} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                LinkedIn Audit
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Strengthen your professional profile and career positioning
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
        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#172554] via-[#1e40af] to-[#2563eb] px-6 py-5 text-white shadow-lg sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-100 backdrop-blur-md">
                <Sparkles
                  size={13}
                  className="text-blue-200"
                />

                AI-Powered Career Profile Analysis
              </div>

              <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Turn your LinkedIn profile into a stronger career asset.
              </h2>
            </div>

            <div className="relative hidden h-24 w-36 shrink-0 md:block">
              <div className="absolute right-4 top-1/2 flex h-[68px] w-[68px] -translate-y-1/2 rotate-6 items-center justify-center rounded-[20px] bg-white/15 shadow-2xl backdrop-blur-md">
                <BriefcaseBusiness
                  size={29}
                  strokeWidth={1.8}
                />
              </div>

              <div className="absolute bottom-0 right-0 flex h-10 w-[68px] items-end gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-md">
                <span className="h-2.5 w-1.5 rounded-full bg-white/40" />
                <span className="h-4 w-1.5 rounded-full bg-white/55" />
                <span className="h-5.5 w-1.5 rounded-full bg-white/70" />
                <span className="h-7 w-1.5 rounded-full bg-white" />
              </div>

              <Sparkles
                size={14}
                className="absolute left-1 top-2 text-blue-200"
              />
            </div>
          </div>
        </section>

        {/* Main Layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* FORM */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Start your audit
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Tell GrowIQ where you are professionally and where you want to go.
              </p>
            </div>

            <div className="space-y-5">
              {/* Required */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* LinkedIn Profile */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="linkedin-profile"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    LinkedIn Profile
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <LinkIcon
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="linkedin-profile"
                      type="text"
                      value={profileUrl}
                      onChange={(event) =>
                        setProfileUrl(
                          event.target.value,
                        )
                      }
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Example: linkedin.com/in/yourprofile
                  </p>
                </div>

                {/* Current Role */}
                <div>
                  <label
                    htmlFor="current-role"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Current Job Title / Role
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <BriefcaseBusiness
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="current-role"
                      type="text"
                      value={currentRole}
                      onChange={(event) =>
                        setCurrentRole(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Full Stack Developer"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label
                    htmlFor="industry"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Industry
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="industry"
                    type="text"
                    value={industry}
                    onChange={(event) =>
                      setIndustry(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. IT & Software"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* Career Goal */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="career-goal"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Primary Career Goal
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
                      id="career-goal"
                      value={careerGoal}
                      onChange={(event) =>
                        setCareerGoal(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-10 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">
                        Select your primary career goal
                      </option>

                      <option value="Get a New Job">
                        Get a New Job
                      </option>

                      <option value="Get Promoted">
                        Get Promoted
                      </option>

                      <option value="Switch Career">
                        Switch Career
                      </option>

                      <option value="Attract Recruiters">
                        Attract Recruiters
                      </option>

                      <option value="Get Freelance Clients">
                        Get Freelance Clients
                      </option>

                      <option value="Build Professional Brand">
                        Build Professional Brand
                      </option>

                      <option value="Grow Network">
                        Grow Network
                      </option>
                    </select>

                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional */}
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-4 flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Additional Information
                  </h4>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    Optional
                  </span>
                </div>

                {/* Target Role */}
                <div>
                  <label
                    htmlFor="target-role"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Target Job Title
                  </label>

                  <div className="relative">
                    <Target
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="target-role"
                      type="text"
                      value={targetRole}
                      onChange={(event) =>
                        setTargetRole(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Senior Full Stack Developer"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
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
                      placeholder="Tell us about your current career challenge or what you want to improve..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Credit balance and access */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      LinkedIn Audit cost: 10 credits
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {accessLoading
                        ? "Checking your credit balance..."
                        : `Available credits: ${availableCredits}`}
                    </p>
                  </div>
                  {!accessLoading && !hasCreditAccess && (
                    <Link
                      to="/subscription"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      Upgrade Your Plan
                    </Link>
                  )}
                </div>
                {!accessLoading && accessMessage && (
                  <p className="mt-2 text-[11px] text-amber-700">{accessMessage}</p>
                )}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={
                  handleGenerateAudit
                }
                disabled={
                  !isFormValid ||
                  isGenerating ||
                  accessLoading ||
                  !hasCreditAccess
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 text-xs font-semibold text-white shadow-md transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Generating your audit...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />

                    Generate LinkedIn Audit
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-medium leading-5 text-red-600">
                  {errorMessage}
                </div>
              )}

              <p className="text-center text-[10px] text-slate-400">
                Your audit will be generated based on the information you provide.
              </p>
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-5">
            {/* How it works */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
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
                    "Enter your LinkedIn profile and current professional role.",
                  ],
                  [
                    "02",
                    "Set your career goal",
                    "Tell GrowIQ what you want to achieve professionally.",
                  ],
                  [
                    "03",
                    "Get your report",
                    "Receive career-focused profile insights and priority fixes.",
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
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
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

            {/* Coverage */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
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
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* Pro Tip */}
            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="text-xs font-bold text-blue-900">
                    Pro tip
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-blue-700">
                    Add your target job title if you are preparing for a specific career move.
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
