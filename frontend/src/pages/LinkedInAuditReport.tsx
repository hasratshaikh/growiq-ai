import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type AuditSection = {
  score?: number;
  observation?: string;
  current_positioning?: string;
  goal_alignment?: string;
  current_headline?: string;
  what_works?: string[];
  what_needs_improvement?: string[];
  recommended_headline?: string;
  existing_skills?: string[];
  important_keywords?: string[];
  keyword_gaps?: string[];
  evidence?: string[];
  gaps?: string[];
  profile_signals?: string[];
  keyword_strategy?: string[];
  recommendation?: string;
};

type ContentPillar = {
  pillar?: string;
  purpose?: string;
  example_topics?: string[];
};

type CareerGap = {
  gap?: string;
  evidence?: string;
  impact_on_goal?: string;
  action?: string;
  priority?: string;
};

type Funnel = {
  profile_visit?: string;
  profile_understanding?: string;
  credibility?: string;
  cta_or_next_step?: string;
  opportunity?: string;
  lead_or_opportunity_conversion?: string;
};

type ActionPlan = {
  day?: number;
  action?: string;
  reason?: string;
};

type GrowthBlueprint = {
  fix_first?: string[];
  build_next?: string[];
  then_optimize?: string[];
  next_audit?: string;
};

type LinkedInResult = {
  overall_score?: number;

  sub_scores?: {
    career_positioning?: number;
    profile_strength?: number;
    recruiter_discoverability?: number;
    professional_credibility?: number;
    opportunity_conversion?: number;
  };

  executive_summary?: string;

  career_positioning?: AuditSection;
  headline_audit?: AuditSection;
  about_section_audit?: AuditSection;
  experience_audit?: AuditSection;
  skills_keywords?: AuditSection;
  featured_section?: AuditSection;
  professional_credibility?: AuditSection;
  recruiter_discoverability?: AuditSection;

  career_conversion_funnel?: Funnel;

  content_professional_presence?: AuditSection & {
    recommended_content_pillars?: ContentPillar[];
    content_patterns?: string[];
  };

  career_gap_analysis?: CareerGap[];

  seven_day_priority_action_plan?: ActionPlan[];

  final_career_growth_blueprint?: GrowthBlueprint;
};

type ReportRow = {
  id: string;
  title: string;
  status: string;
  input_data: {
    profileUrl?: string;
    currentRole?: string;
    industry?: string;
    careerGoal?: string;
    targetRole?: string;
    additionalNotes?: string;
  };
  result_data: LinkedInResult | null;
  created_at: string;
};

function scoreLabel(score = 0) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Needs Improvement";
  if (score >= 40) return "Weak";
  return "Critical";
}

function scoreBarClass(score = 0) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function priorityClass(priority?: string) {
  const value = priority?.toLowerCase();

  if (value === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}


function ScoreCircle({
  score = 0,
}: {
  score?: number;
}) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0),
  );

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white/10">
      <div className="absolute inset-2 rounded-full border-[8px] border-white/15" />

      <div
        className="absolute inset-2 rounded-full border-[8px] border-transparent border-t-white border-r-white"
        style={{
          transform: `rotate(${safeScore * 3.6 - 45}deg)`,
        }}
      />

      <div className="relative text-center text-white">
        <div className="text-4xl font-bold leading-none">
          {Math.round(safeScore)}
        </div>

        <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-100">
          / 100
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score = 0,
}: {
  label: string;
  score?: number;
}) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0),
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-700">
          {label}
        </span>

        <span className="text-xs font-bold text-slate-900">
          {Math.round(safeScore)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${scoreBarClass(
            safeScore,
          )}`}
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  text = "Data unavailable.",
}: {
  text?: string;
}) {
  return (
    <p className="text-xs leading-6 text-slate-500">
      {text}
    </p>
  );
}

function BulletList({
  items,
}: {
  items?: string[];
}) {
  if (!items || items.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-2 text-xs leading-5 text-slate-600"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AuditCard({
  title,
  icon,
  item,
}: {
  title: string;
  icon?: React.ReactNode;
  item?: AuditSection;
}) {
  if (!item) return null;

  const score = Number(item.score ?? 0);

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon || <TrendingUp size={19} />}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500">
              AI-powered analysis and recommendations.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">
            {Math.round(score)}
          </div>

          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {scoreLabel(score)}
          </div>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${scoreBarClass(score)}`}
          style={{
            width: `${Math.max(0, Math.min(100, score))}%`,
          }}
        />
      </div>

      {item.current_positioning && (
        <div className="mb-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Current Positioning
          </p>

          <p className="mt-2 text-xs leading-6 text-slate-700">
            {item.current_positioning}
          </p>
        </div>
      )}

      {item.current_headline && (
        <div className="mb-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Current Headline
          </p>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
            {item.current_headline}
          </p>
        </div>
      )}

      {item.observation && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Observation
          </p>

          <p className="mt-1.5 text-xs leading-6 text-slate-600">
            {item.observation}
          </p>
        </div>
      )}

      {item.goal_alignment && (
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            Goal Alignment
          </p>

          <p className="mt-1.5 text-xs leading-6 text-blue-800">
            {item.goal_alignment}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(item.what_works?.length || 0) > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              What's Working
            </p>

            <BulletList items={item.what_works} />
          </div>
        )}

        {(item.what_needs_improvement?.length || 0) > 0 && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-red-700">
              What Needs Improvement
            </p>

            <BulletList
              items={item.what_needs_improvement}
            />
          </div>
        )}
      </div>

      {(item.existing_skills?.length || 0) > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Existing Skills
          </p>

          <div className="flex flex-wrap gap-2">
            {item.existing_skills?.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {(item.important_keywords?.length || 0) > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Important Keywords
          </p>

          <div className="flex flex-wrap gap-2">
            {item.important_keywords?.map(
              (keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-medium text-blue-700"
                >
                  {keyword}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {(item.keyword_gaps?.length || 0) > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Keyword Gaps
          </p>

          <BulletList items={item.keyword_gaps} />
        </div>
      )}

      {(item.evidence?.length || 0) > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Evidence
          </p>

          <BulletList items={item.evidence} />
        </div>
      )}

      {(item.gaps?.length || 0) > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Gaps
          </p>

          <BulletList items={item.gaps} />
        </div>
      )}

      {(item.profile_signals?.length || 0) > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Profile Signals
          </p>

          <BulletList items={item.profile_signals} />
        </div>
      )}

      {item.recommendation && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            Recommendation
          </p>

          <p className="mt-1.5 text-xs leading-6 text-blue-800">
            {item.recommendation}
          </p>
        </div>
      )}

      {item.recommended_headline && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            Recommended Headline
          </p>

          <p className="mt-1.5 text-sm font-semibold leading-6 text-blue-900">
            {item.recommended_headline}
          </p>
        </div>
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa] px-5">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 text-sm font-medium text-slate-700">
          Loading your LinkedIn report...
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
    <div className="min-h-screen bg-[#f5f6fa] px-5 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <FileText size={24} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-slate-900">
          Unable to load report
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <Link
          to="/linkedin-audit"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          <ArrowLeft size={15} />
          Back to LinkedIn Audit
        </Link>
      </div>
    </div>
  );
}

export default function LinkedInAuditReport() {
  const { reportId } = useParams();

  const [report, setReport] =
    useState<ReportRow | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setError("Report ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError(
            "Your session has expired. Please login again.",
          );
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
          .eq("id", reportId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (reportError) {
          console.error(
            "Report loading error:",
            reportError,
          );

          setError(
            "Unable to load your LinkedIn audit report.",
          );

          return;
        }

        if (!data) {
          setError(
            "This report does not exist or you do not have access to it.",
          );

          return;
        }

        setReport(data as ReportRow);
      } catch (loadError) {
        console.error(
          "Unexpected report loading error:",
          loadError,
        );

        setError(
          "Something went wrong while loading the report.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
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

  if (
    report.status !== "completed" ||
    !report.result_data
  ) {
    return (
      <ErrorState
        message={
          report.status === "processing"
            ? "Your audit is still being generated. Please try again shortly."
            : "This audit could not be completed."
        }
      />
    );
  }

  const result = report.result_data;
  const input = report.input_data || {};

  const overallScore = Number(
    result.overall_score ?? 0,
  );

  const subScores =
    result.sub_scores || {};

  const funnel =
    result.career_conversion_funnel;

  const content =
    result.content_professional_presence;

  const gaps =
    result.career_gap_analysis || [];

  const actionPlan =
    result.seven_day_priority_action_plan ||
    [];

  const blueprint =
    result.final_career_growth_blueprint;

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/linkedin-audit"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-sm">
              <BriefcaseBusiness size={19} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                LinkedIn Audit Report
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Your AI-powered career profile analysis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* HERO */}
        <section className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#172554] via-[#2443a6] to-[#2563eb] p-7 text-white shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-8 lg:flex-row">
            <ScoreCircle score={overallScore} />

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-50">
                <Sparkles size={14} />
                AI Career Profile Analysis
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Your LinkedIn Career Profile Score
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                {result.executive_summary ||
                  "Your personalized LinkedIn career analysis is ready."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {input.currentRole && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold">
                    {input.currentRole}
                  </span>
                )}

                {input.industry && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold">
                    {input.industry}
                  </span>
                )}

                {input.careerGoal && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold">
                    Goal: {input.careerGoal}
                  </span>
                )}

                {input.targetRole && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold">
                    Target: {input.targetRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SCORE BREAKDOWN */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Score Breakdown
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                How your career profile is positioned across key areas.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ScoreBar
              label="Career Positioning"
              score={
                subScores.career_positioning
              }
            />

            <ScoreBar
              label="Profile Strength"
              score={
                subScores.profile_strength
              }
            />

            <ScoreBar
              label="Recruiter Discoverability"
              score={
                subScores.recruiter_discoverability
              }
            />

            <ScoreBar
              label="Professional Credibility"
              score={
                subScores.professional_credibility
              }
            />

            <ScoreBar
              label="Opportunity Conversion"
              score={
                subScores.opportunity_conversion
              }
            />
          </div>
        </section>

        {/* EXECUTIVE SUMMARY */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Executive Career Summary
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                The most important takeaway from your audit.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm leading-7 text-slate-700">
              {result.executive_summary ||
                "Data unavailable."}
            </p>
          </div>
        </section>

        {/* AUDIT SECTIONS */}
        <AuditCard
          title="Career Positioning"
          icon={<Target size={19} />}
          item={result.career_positioning}
        />

        <AuditCard
          title="Headline Audit"
          icon={<Sparkles size={19} />}
          item={result.headline_audit}
        />

        <AuditCard
          title="About Section Audit"
          item={result.about_section_audit}
        />

        <AuditCard
          title="Experience Audit"
          item={result.experience_audit}
        />

        <AuditCard
          title="Skills & Keywords"
          item={result.skills_keywords}
        />

        <AuditCard
          title="Featured Section"
          item={result.featured_section}
        />

        <AuditCard
          title="Professional Credibility"
          item={result.professional_credibility}
        />

        <AuditCard
          title="Recruiter Discoverability"
          item={result.recruiter_discoverability}
        />

        {/* CONTENT / PROFESSIONAL PRESENCE */}
        {content && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp size={19} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Content & Professional Presence
                </h2>

                <p className="mt-1 text-[11px] text-slate-500">
                  How your professional content can support your career goal.
                </p>
              </div>

              <div className="ml-auto text-right">
                <div className="text-xl font-bold text-slate-900">
                  {Math.round(
                    Number(content.score ?? 0),
                  )}
                </div>

                <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  {scoreLabel(
                    Number(content.score ?? 0),
                  )}
                </div>
              </div>
            </div>

            {content.observation && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs leading-6 text-slate-600">
                  {content.observation}
                </p>
              </div>
            )}

            {content.content_patterns &&
              content.content_patterns.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Content Patterns
                  </p>

                  <BulletList
                    items={content.content_patterns}
                  />
                </div>
              )}

            {content.recommended_content_pillars &&
              content.recommended_content_pillars.length >
                0 && (
                <div className="mt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Recommended Content Pillars
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    {content.recommended_content_pillars.map(
                      (pillar, index) => (
                        <div
                          key={`${pillar.pillar}-${index}`}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <h3 className="text-sm font-bold text-slate-900">
                            {pillar.pillar ||
                              "Content Pillar"}
                          </h3>

                          {pillar.purpose && (
                            <p className="mt-2 text-xs leading-5 text-slate-600">
                              {pillar.purpose}
                            </p>
                          )}

                          {pillar.example_topics &&
                            pillar.example_topics.length >
                              0 && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Example Topics
                                </p>

                                <ul className="mt-2 space-y-1.5">
                                  {pillar.example_topics.map(
                                    (
                                      topic,
                                      topicIndex,
                                    ) => (
                                      <li
                                        key={`${topic}-${topicIndex}`}
                                        className="text-xs text-slate-600"
                                      >
                                        • {topic}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {content.recommendation && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  Recommendation
                </p>

                <p className="mt-1.5 text-xs leading-6 text-blue-800">
                  {content.recommendation}
                </p>
              </div>
            )}
          </section>
        )}

        {/* CAREER GAP ANALYSIS */}
        {gaps.length > 0 && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Career Gap Analysis
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                The most important gaps affecting your current career goal.
              </p>
            </div>

            <div className="space-y-4">
              {gaps.map((gap, index) => (
                <div
                  key={`${gap.gap}-${index}`}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      {gap.gap ||
                        `Career Gap ${index + 1}`}
                    </h3>

                    {gap.priority && (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorityClass(
                          gap.priority,
                        )}`}
                      >
                        {gap.priority}
                      </span>
                    )}
                  </div>

                  {gap.evidence && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Evidence
                      </p>

                      <p className="mt-1.5 text-xs leading-6 text-slate-600">
                        {gap.evidence}
                      </p>
                    </div>
                  )}

                  {gap.impact_on_goal && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Impact on Goal
                      </p>

                      <p className="mt-1.5 text-xs leading-6 text-slate-600">
                        {gap.impact_on_goal}
                      </p>
                    </div>
                  )}

                  {gap.action && (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                        Recommended Action
                      </p>

                      <p className="mt-1.5 text-xs leading-6 text-blue-800">
                        {gap.action}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CAREER CONVERSION FUNNEL */}
        {funnel && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Career Opportunity Funnel
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                How a profile visitor can move from discovery to opportunity.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "Profile Visit",
                  funnel.profile_visit,
                ],
                [
                  "Profile Understanding",
                  funnel.profile_understanding,
                ],
                [
                  "Credibility",
                  funnel.credibility,
                ],
                [
                  "CTA / Next Step",
                  funnel.cta_or_next_step,
                ],
                [
                  "Opportunity",
                  funnel.opportunity,
                ],
                [
                  "Lead / Opportunity Conversion",
                  funnel.lead_or_opportunity_conversion,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {value || "Data unavailable."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7 DAY PLAN */}
        {actionPlan.length > 0 && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Your 7-Day Priority Action Plan
                </h2>

                <p className="text-[11px] text-slate-500">
                  One focused career improvement action for each day.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {actionPlan.map(
                (item, index) => (
                  <div
                    key={`day-${item.day ?? index}`}
                    className="flex gap-4 rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                      D{item.day ?? index + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.action ||
                          "Action item"}
                      </h3>

                      <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        {item.reason ||
                          "Reason not provided."}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* GROWTH BLUEPRINT */}
        {blueprint && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Final Career Growth Blueprint
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                What to fix first, what to build next and when to audit again.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-800">
                  Fix First
                </h3>

                <ul className="mt-3 space-y-2.5">
                  {(blueprint.fix_first || []).map(
                    (item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex gap-2 text-xs leading-5 text-red-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-blue-800">
                  Build Next
                </h3>

                <ul className="mt-3 space-y-2.5">
                  {(blueprint.build_next || []).map(
                    (item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex gap-2 text-xs leading-5 text-blue-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <h3 className="text-sm font-bold text-emerald-800">
                  Then Optimize
                </h3>

                <ul className="mt-3 space-y-2.5">
                  {(blueprint.then_optimize || []).map(
                    (item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex gap-2 text-xs leading-5 text-emerald-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            {blueprint.next_audit && (
              <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Next Audit
                </p>

                <p className="mt-2 text-xs leading-6 text-slate-200">
                  {blueprint.next_audit}
                </p>
              </div>
            )}
          </section>
        )}

        {/* FOOTER */}
        <div className="pb-8 text-center text-[10px] leading-5 text-slate-400">
          This audit is based on the information available to GrowIQ AI.
          LinkedIn profile content and metrics are not assumed to be
          verified unless explicitly available through the data source.
        </div>
      </main>
    </div>
  );
}