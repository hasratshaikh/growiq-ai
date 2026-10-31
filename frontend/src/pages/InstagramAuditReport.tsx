import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ScoreBlock = {
  score?: number;
  observation?: string;
  recommendation?: string;
};

type Improvement = {
  category?: string;
  score?: number;
  observation?: string;
  whats_good?: string;
  problem?: string;
  recommendation?: string;
  priority?: string;
};

type AuditResult = {
  overall_score?: number;

  sub_scores?: {
    profile?: number;
    content?: number;
    conversion?: number;
  };

  executive_summary?: string;

  whats_working?: string[];

  what_needs_improvement?: Improvement[];

  detailed_audit?: {
    profile_positioning?: ScoreBlock;
    profile_photo_logo?: ScoreBlock;
    username_name?: ScoreBlock;
    bio?: ScoreBlock;
    cta?: ScoreBlock;
    link?: ScoreBlock;
    highlights?: ScoreBlock;
    content_quality?: ScoreBlock;
    content_strategy?: ScoreBlock;
    engagement?: ScoreBlock;
    reach_views?: ScoreBlock;
    instagram_seo?: ScoreBlock;
    competitor_comparison?: ScoreBlock;
    conversion_journey?: ScoreBlock;
  };

  content_strategy?: {
    recommended_content_mix?: string[];

    content_pillars?: {
      pillar?: string;
      purpose?: string;
      suggested_percentage?: number;
    }[];
  };

  competitor_gap?: {
    available?: boolean;
    observation?: string;
    gaps?: string[];
  };

  conversion_funnel?: {
    stage?: string;
    recommendation?: string;
  }[];

  seven_day_action_plan?: {
    day?: number;
    action?: string;
    reason?: string;
  }[];

  growth_blueprint?: {
    fix_first?: string[];
    build_next?: string[];
    optimize_later?: string[];
    next_audit?: string;
  };
};

type Report = {
  id: string;
  title: string;
  status: string;

  input_data: {
    profileUrl?: string;
    name?: string;
    niche?: string;
    primaryGoal?: string;
    competitorUrl?: string;
    websiteUrl?: string;
    additionalNotes?: string;
  };

  result_data: AuditResult | null;

  created_at: string;
};

const auditLabels: Record<string, string> = {
  profile_positioning: "Profile Positioning",
  profile_photo_logo: "Profile Photo / Logo",
  username_name: "Username & Name",
  bio: "Bio",
  cta: "CTA",
  link: "Profile Link",
  highlights: "Highlights",
  content_quality: "Content Quality",
  content_strategy: "Content Strategy",
  engagement: "Engagement",
  reach_views: "Reach & Views",
  instagram_seo: "Instagram SEO",
  competitor_comparison: "Competitor Comparison",
  conversion_journey: "Conversion Journey",
};

function getScoreColor(score = 0) {
  if (score >= 80) {
    return "text-emerald-600";
  }

  if (score >= 60) {
    return "text-amber-600";
  }

  return "text-red-600";
}

function getScoreBg(score = 0) {
  if (score >= 80) {
    return "bg-emerald-50 border-emerald-100";
  }

  if (score >= 60) {
    return "bg-amber-50 border-amber-100";
  }

  return "bg-red-50 border-red-100";
}

function getPriorityStyle(priority = "") {
  const value = priority.toLowerCase();

  if (value === "high") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (value === "medium") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function ScoreCircle({
  score,
}: {
  score: number;
}) {
  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-[10px] border-white/20">
      <div className="text-center">
        <div className="text-4xl font-bold text-white">
          {score}
        </div>

        <div className="text-sm text-white/70">
          / 100
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function AuditItem({
  label,
  data,
}: {
  label: string;
  data?: ScoreBlock;
}) {
  const [open, setOpen] = useState(false);

  if (!data) {
    return null;
  }

  const score = Number(
    data.score ?? 0,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${getScoreBg(
              score,
            )} ${getScoreColor(score)}`}
          >
            {score}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {label}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              {score >= 80
                ? "Strong area"
                : score >= 60
                  ? "Needs improvement"
                  : "Priority area"}
            </p>
          </div>
        </div>

        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Observation
              </p>

              <p className="text-sm leading-6 text-slate-700">
                {data.observation ||
                  "Insufficient information provided."}
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f5ff] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6a55b5]">
                Recommendation
              </p>

              <p className="text-sm leading-6 text-slate-700">
                {data.recommendation ||
                  "No recommendation available."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e4defb] border-t-[#4b3a9b]" />

        <h2 className="text-lg font-semibold text-slate-900">
          Loading your Instagram audit
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Preparing your personalized growth report...
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <XCircle className="h-6 w-6" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          Unable to load report
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <Link
          to="/instagram-audit"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Instagram Audit
        </Link>
      </div>
    </div>
  );
}

function InstagramAuditReport() {
  const { reportId } =
    useParams();

  const [report, setReport] =
    useState<Report | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const loadReport = async () => {
      if (!reportId) {
        if (mounted) {
          setError(
            "Report ID is missing.",
          );
          setLoading(false);
        }

        return;
      }

      try {
        const {
          data: {
            session,
          },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (
          sessionError ||
          !session
        ) {
          if (mounted) {
            setError(
              "Your session has expired. Please login again.",
            );
          }

          return;
        }

        const {
          data,
          error: reportError,
        } = await supabase
          .from("reports")
          .select(
            `
              id,
              title,
              status,
              input_data,
              result_data,
              created_at
            `,
          )
          .eq(
            "id",
            reportId,
          )
          .eq(
            "user_id",
            session.user.id,
          )
          .maybeSingle();

        if (reportError) {
          console.error(
            "Report loading error:",
            reportError,
          );

          if (mounted) {
            setError(
              "Unable to load your audit report.",
            );
          }

          return;
        }

        if (!data) {
          if (mounted) {
            setError(
              "This report does not exist or you do not have access to it.",
            );
          }

          return;
        }

        if (mounted) {
          setReport(
            data as Report,
          );
        }
      } catch (loadError) {
        console.error(
          "Unexpected report loading error:",
          loadError,
        );

        if (mounted) {
          setError(
            "Something went wrong while loading the report.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      mounted = false;
    };
  }, [reportId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !report) {
    return (
      <ErrorState
        message={
          error ||
          "Report could not be loaded."
        }
      />
    );
  }

  const result =
    report.result_data;

  if (
    report.status !== "completed" ||
    !result
  ) {
    return (
      <ErrorState
        message={
          report.status ===
          "processing"
            ? "Your audit is still being generated. Please try again shortly."
            : "This audit could not be completed."
        }
      />
    );
  }

  const overallScore = Number(
    result.overall_score ?? 0,
  );

  const subScores =
    result.sub_scores ?? {};

  const workingItems =
    result.whats_working ?? [];

  const improvements =
    result.what_needs_improvement ??
    [];

  const detailedAudit =
    result.detailed_audit ?? {};

  const contentStrategy =
    result.content_strategy ?? {};

  const competitorGap =
    result.competitor_gap ?? {};

  const funnel =
    result.conversion_funnel ?? [];

  const actionPlan =
    result.seven_day_action_plan ??
    [];

  const blueprint =
    result.growth_blueprint ?? {};

  const auditEntries =
    Object.entries(
      detailedAudit,
    ) as [
      string,
      ScoreBlock | undefined,
    ][];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:static">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/instagram-audit"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <h1 className="text-sm font-bold text-slate-900">
                Instagram Audit Report
              </h1>

              <p className="text-xs text-slate-500">
                Generated{" "}
                {formatDate(
                  report.created_at,
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex print:hidden"
          >
            <Download className="h-4 w-4" />
            Save / Print
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3d2878] via-[#4937a3] to-[#263b87] p-6 text-white shadow-lg lg:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                <TrendingUp className="h-3.5 w-3.5" />
                AI-Powered Instagram Growth Audit
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {report.input_data
                  .name ||
                  "Your Instagram Profile"}
              </h2>

              <p className="mt-2 text-sm text-white/70">
                {report.input_data
                  .niche ||
                  "Instagram Profile"}{" "}
                ·{" "}
                {report.input_data
                  .primaryGoal ||
                  "Growth"}
              </p>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/80">
                {result.executive_summary ||
                  "Your personalized Instagram growth audit is ready."}
              </p>
            </div>

            <ScoreCircle
              score={overallScore}
            />
          </div>
        </section>

        {/* Scores */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Profile",
              score: Number(
                subScores.profile ??
                  0,
              ),
              icon: (
                <FileText className="h-4 w-4 text-[#5b45a5]" />
              ),
            },
            {
              label: "Content",
              score: Number(
                subScores.content ??
                  0,
              ),
              icon: (
                <BarChart3 className="h-4 w-4 text-[#5b45a5]" />
              ),
            },
            {
              label: "Conversion",
              score: Number(
                subScores.conversion ??
                  0,
              ),
              icon: (
                <Target className="h-4 w-4 text-[#5b45a5]" />
              ),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                {item.icon}
                {item.label}
              </div>

              <div className="flex items-end justify-between">
                <span
                  className={`text-3xl font-bold ${getScoreColor(
                    item.score,
                  )}`}
                >
                  {item.score}
                </span>

                <span className="text-xs text-slate-400">
                  / 100
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Executive Summary */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <Lightbulb className="h-5 w-5" />
            }
            title="Executive Summary"
          />

          <p className="max-w-4xl text-sm leading-7 text-slate-600">
            {result.executive_summary ||
              "No executive summary was generated."}
          </p>
        </section>

        {/* What's Working */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            title="What's Working"
            description="Areas identified as positive or strategically useful."
          />

          {workingItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {workingItems.map(
                (item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <p className="text-sm leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No specific positive observations were generated.
            </p>
          )}
        </section>

        {/* Improvements */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <CircleAlert className="h-5 w-5" />
            }
            title="What Needs Improvement"
            description="Prioritized areas identified by the AI audit."
          />

          <div className="space-y-4">
            {improvements.length >
            0 ? (
              improvements.map(
                (item, index) => {
                  const score =
                    Number(
                      item.score ??
                        0,
                    );

                  return (
                    <div
                      key={`${item.category}-${index}`}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-bold ${getScoreBg(
                              score,
                            )} ${getScoreColor(
                              score,
                            )}`}
                          >
                            {score}
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900">
                              {item.category ||
                                "Improvement Area"}
                            </h3>

                            <p className="text-xs text-slate-500">
                              Score out of 100
                            </p>
                          </div>
                        </div>

                        {item.priority && (
                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                              item.priority,
                            )}`}
                          >
                            {item.priority}{" "}
                            Priority
                          </span>
                        )}
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Observation
                          </p>

                          <p className="text-sm leading-6 text-slate-600">
                            {item.observation ||
                              "Insufficient information provided."}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                            What's Good
                          </p>

                          <p className="text-sm leading-6 text-slate-600">
                            {item.whats_good ||
                              "Insufficient information provided."}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Problem
                          </p>

                          <p className="text-sm leading-6 text-slate-600">
                            {item.problem ||
                              "No specific problem identified."}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#f7f5ff] p-4">
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#6a55b5]">
                            Recommendation
                          </p>

                          <p className="text-sm leading-6 text-slate-700">
                            {item.recommendation ||
                              "No recommendation available."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                },
              )
            ) : (
              <p className="text-sm text-slate-500">
                No improvement areas were generated.
              </p>
            )}
          </div>
        </section>

        {/* Detailed Audit */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <FileText className="h-5 w-5" />
            }
            title="Detailed Audit"
            description="Expand each area to see observations and recommendations."
          />

          <div className="space-y-3">
            {auditEntries.map(
              ([key, value]) => (
                <AuditItem
                  key={key}
                  label={
                    auditLabels[key] ||
                    key
                      .replace(
                        /_/g,
                        " ",
                      )
                      .replace(
                        /\b\w/g,
                        (letter) =>
                          letter.toUpperCase(),
                      )
                  }
                  data={value}
                />
              ),
            )}
          </div>
        </section>

        {/* Content Strategy */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <BarChart3 className="h-5 w-5" />
            }
            title="Content Strategy"
            description="Recommended direction for your content."
          />

          {contentStrategy
            .recommended_content_mix
            ?.length ? (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Recommended Content Mix
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                {contentStrategy.recommended_content_mix.map(
                  (item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {contentStrategy
            .content_pillars
            ?.length ? (
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Content Pillars
              </h3>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {contentStrategy.content_pillars.map(
                  (
                    pillar,
                    index,
                  ) => (
                    <div
                      key={`${pillar.pillar}-${index}`}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-slate-900">
                          {pillar.pillar ||
                            "Content Pillar"}
                        </h4>

                        {pillar.suggested_percentage !==
                          undefined && (
                          <span className="rounded-full bg-[#eeeafd] px-2.5 py-1 text-xs font-bold text-[#4b3a9b]">
                            {
                              pillar.suggested_percentage
                            }
                            %
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {pillar.purpose ||
                          "No purpose provided."}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* Competitor Gap */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <Target className="h-5 w-5" />
            }
            title="Competitor Gap"
          />

          {competitorGap.available ? (
            <>
              <div className="rounded-xl bg-[#f7f5ff] p-4">
                <p className="text-sm leading-6 text-slate-700">
                  {competitorGap.observation ||
                    "No competitor observation available."}
                </p>
              </div>

              {competitorGap.gaps
                ?.length ? (
                <div className="mt-4 space-y-2">
                  {competitorGap.gaps.map(
                    (gap, index) => (
                      <div
                        key={`${gap}-${index}`}
                        className="flex gap-3 rounded-xl border border-slate-100 p-4"
                      >
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#5b45a5]" />

                        <p className="text-sm leading-6 text-slate-700">
                          {gap}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-800">
                Competitor comparison is unavailable because
                verified competitor data was not available to
                the AI during this audit.
              </p>
            </div>
          )}
        </section>

        {/* Conversion Funnel */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <TrendingUp className="h-5 w-5" />
            }
            title="Conversion Funnel"
            description="How profile visitors can move toward becoming leads."
          />

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {funnel.map(
              (item, index) => (
                <div
                  key={`${item.stage}-${index}`}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#eeeafd] text-xs font-bold text-[#4b3a9b]">
                    {index + 1}
                  </div>

                  <h3 className="font-bold text-slate-900">
                    {item.stage ||
                      "Funnel Stage"}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.recommendation ||
                      "No recommendation available."}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* 7 Day Plan */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <Clock3 className="h-5 w-5" />
            }
            title="7-Day Priority Action Plan"
            description="Focus on execution rather than trying to fix everything at once."
          />

          <div className="space-y-3">
            {actionPlan.map(
              (item, index) => (
                <div
                  key={`${item.day}-${index}`}
                  className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4b3a9b] text-sm font-bold text-white">
                    {item.day ??
                      index + 1}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {item.action ||
                        "Action"}
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {item.reason ||
                        "No reason provided."}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Growth Blueprint */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <SectionTitle
            icon={
              <TrendingUp className="h-5 w-5" />
            }
            title="Final Growth Blueprint"
            description="Recommended sequence for your next stage of growth."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-red-50 p-5">
              <h3 className="font-bold text-red-800">
                Fix First
              </h3>

              <ul className="mt-3 space-y-2">
                {(
                  blueprint.fix_first ??
                  []
                ).map(
                  (item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-2 text-sm leading-6 text-red-900/80"
                    >
                      <span>•</span>
                      <span>
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-amber-50 p-5">
              <h3 className="font-bold text-amber-800">
                Build Next
              </h3>

              <ul className="mt-3 space-y-2">
                {(
                  blueprint.build_next ??
                  []
                ).map(
                  (item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-2 text-sm leading-6 text-amber-900/80"
                    >
                      <span>•</span>
                      <span>
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-[#f0edff] p-5">
              <h3 className="font-bold text-[#4b3a9b]">
                Optimize Later
              </h3>

              <ul className="mt-3 space-y-2">
                {(
                  blueprint.optimize_later ??
                  []
                ).map(
                  (item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-2 text-sm leading-6 text-slate-700"
                    >
                      <span>•</span>
                      <span>
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {blueprint.next_audit && (
            <div className="mt-5 rounded-2xl border border-[#ddd5ff] bg-[#f7f5ff] p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6a55b5]">
                Next Audit
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {blueprint.next_audit}
              </p>
            </div>
          )}
        </section>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Ready to work on your growth?
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Use your 7-day action plan as your next execution checklist.
            </p>
          </div>

          <Link
            to="/instagram-audit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
          >
            <ArrowLeft className="h-4 w-4" />
            New Audit
          </Link>
        </div>
      </main>
    </div>
  );
}

export default InstagramAuditReport;