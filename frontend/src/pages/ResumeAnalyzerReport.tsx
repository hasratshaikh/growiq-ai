import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  FileText,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

type ReportStatus =
  | "processing"
  | "completed"
  | "failed";

type AuditSection = {
  score?: number | null;
  strengths?: string[];
  problems?: string[];
  recommendations?: string[];
};

type ScoreBreakdown = {
  keyword_match?: number;
  job_alignment?: number;
  experience_relevance?: number;
  skills_match?: number;
  resume_structure?: number;
};

type PriorityFix = {
  priority?: string;
  issue?: string;
  why_it_matters?: string;
  recommendation?: string;
};

type ActionPlanItem = {
  priority?: number;
  action?: string;
  reason?: string;
};

type ImprovedExperience = {
  company?: string;
  role?: string;
  dates?: string;
  location?: string;
  bullets?: string[];
};

type ResumeContact = {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
};

type ResumeProject = {
  name?: string;
  dates?: string;
  bullets?: string[];
  technologies?: string[];
};

type ResumeEducation = {
  qualification?: string;
  institution?: string;
  dates?: string;
  details?: string;
};

type ImprovedResume = {
  available?: boolean;
  notice?: string;
  candidate_name?: string;
  contact_details?: ResumeContact;
  target_headline?: string;
  professional_summary?: string;
  experience?: ImprovedExperience[];
  projects?: ResumeProject[];
  skills?: string[];
  education?: Array<string | ResumeEducation>;
  certifications?: string[];
  skills_to_confirm?: string[];
  final_resume_text?: string;
};

type ResumeResult = {
  ats_score?: number;

  score_breakdown?: ScoreBreakdown;

  executive_summary?: string;

  whats_good?: string[];

  missing_keywords?: string[];

  job_alignment?: AuditSection;

  experience_analysis?: AuditSection;

  skills_analysis?: AuditSection;

  formatting_analysis?: AuditSection;

  keyword_analysis?: AuditSection;

  priority_fixes?: PriorityFix[];

  action_plan?: ActionPlanItem[];

  improved_resume?: ImprovedResume;

  final_recommendation?: string;
};

type Report = {
  id: string;
  title: string;
  status: ReportStatus;

  input_data: {
    name?: string;
    targetRole?: string;
    jobDescription?: string;
    resumeLength?: number;
  } | null;

  result_data: ResumeResult | null;

  created_at: string;
};

function getScoreTone(
  score?: number | null,
) {
  if (
    typeof score !== "number"
  ) {
    return "text-slate-500";
  }

  if (score >= 80) {
    return "text-emerald-600";
  }

  if (score >= 60) {
    return "text-amber-600";
  }

  return "text-red-600";
}

function scoreLabel(
  score?: number | null,
) {
  if (
    typeof score !== "number"
  ) {
    return "—";
  }

  return `${Math.round(score)}/100`;
}

function scoreWidth(
  score?: number | null,
) {
  if (
    typeof score !== "number"
  ) {
    return "0%";
  }

  return `${Math.min(
    100,
    Math.max(0, score),
  )}%`;
}

function BulletList({
  items,
  emptyText = "No specific information was provided.",
}: {
  items?: string[];
  emptyText?: string;
}) {
  if (
    !items ||
    items.length === 0
  ) {
    return (
      <p className="text-xs leading-5 text-slate-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map(
        (item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-start gap-2.5"
          >
            <CheckCircle2
              size={15}
              className="mt-0.5 shrink-0 text-violet-600"
            />

            <p className="text-xs leading-5 text-slate-600">
              {item}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score?: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700">
          {label}
        </p>

        <span
          className={`text-xs font-bold ${getScoreTone(
            score,
          )}`}
        >
          {scoreLabel(score)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-violet-600"
          style={{
            width: scoreWidth(score),
          }}
        />
      </div>
    </div>
  );
}

function AuditSectionCard({
  title,
  icon,
  section,
}: {
  title: string;
  icon: ReactNode;
  section?: AuditSection;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            {icon}
          </div>

          <h3 className="text-base font-bold text-slate-900">
            {title}
          </h3>
        </div>

        <span
          className={`text-sm font-bold ${getScoreTone(
            section?.score,
          )}`}
        >
          {scoreLabel(
            section?.score,
          )}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
            What's Good
          </p>

          <BulletList
            items={
              section?.strengths
            }
            emptyText="No specific strengths were identified."
          />
        </div>

        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-red-600">
            Problems
          </p>

          <BulletList
            items={
              section?.problems
            }
            emptyText="No major problems were identified."
          />
        </div>

        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-violet-600">
            Recommendations
          </p>

          <BulletList
            items={
              section?.recommendations
            }
            emptyText="No additional recommendations were provided."
          />
        </div>
      </div>
    </section>
  );
}

function resumeToPlainText(resume: ImprovedResume, fallbackName: string) {
  const contact = resume.contact_details ?? {};
  const lines: string[] = [];
  const add = (value?: string) => { if (value?.trim()) lines.push(value.trim()); };
  add(resume.candidate_name || fallbackName);
  add(resume.target_headline);
  add([contact.email, contact.phone, contact.location, contact.linkedin, contact.portfolio].filter(Boolean).join(" | "));
  add("PROFESSIONAL SUMMARY");
  add(resume.professional_summary);
  if (resume.experience?.length) {
    add("PROFESSIONAL EXPERIENCE");
    resume.experience.forEach((item) => {
      add([item.role, item.company].filter(Boolean).join(" — "));
      add([item.dates, item.location].filter(Boolean).join(" | "));
      item.bullets?.forEach((bullet) => add(`• ${bullet}`));
    });
  }
  if (resume.projects?.length) {
    add("PROJECTS");
    resume.projects.forEach((project) => {
      add(project.name);
      add(project.dates);
      project.bullets?.forEach((bullet) => add(`• ${bullet}`));
      if (project.technologies?.length) add(`Technologies: ${project.technologies.join(", ")}`);
    });
  }
  if (resume.skills?.length) { add("SKILLS"); add(resume.skills.join(" • ")); }
  if (resume.education?.length) {
    add("EDUCATION");
    resume.education.forEach((item) => {
      if (typeof item === "string") add(item);
      else {
        add([item.qualification, item.institution].filter(Boolean).join(" — "));
        add([item.dates, item.details].filter(Boolean).join(" | "));
      }
    });
  }
  if (resume.certifications?.length) { add("CERTIFICATIONS"); resume.certifications.forEach(add); }
  return lines.join("\\n");
}

function downloadResumeWord(resume: ImprovedResume, fallbackName: string) {
  const text = resume.final_resume_text?.trim() || resumeToPlainText(resume, fallbackName);
  const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Professional Resume</title><style>body{font-family:Arial,sans-serif;color:#172033;line-height:1.45;margin:36pt}pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:10.5pt}</style></head><body><pre>${escapeHtml(text)}</pre></body></html>`;
  const blob = new Blob(["\\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(resume.candidate_name || fallbackName || "Professional-Resume").replace(/[^a-z0-9-_]+/gi, "-")}.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ResumeAnalyzerReport() {
  const { reportId } =
    useParams<{
      reportId: string;
    }>();

  const navigate =
    useNavigate();

  const [report, setReport] =
    useState<Report | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [showImprovedResume, setShowImprovedResume] =
    useState(true);

  useEffect(() => {
    if (!reportId) {
      return;
    }

    let mounted = true;

    const loadReport =
      async () => {
        try {
          const {
            data: {
              user,
            },
            error: userError,
          } =
            await supabase.auth.getUser();

          if (
            userError ||
            !user
          ) {
            throw new Error(
              "Your session has expired. Please login again.",
            );
          }

          const {
            data,
            error,
          } =
            await supabase
              .from("reports")
              .select(
                "id, title, status, input_data, result_data, created_at",
              )
              .eq(
                "id",
                reportId,
              )
              .eq(
                "user_id",
                user.id,
              )
              .maybeSingle();

          if (error) {
            console.error(
              "Resume report fetch error:",
              error,
            );

            throw new Error(
              "Unable to load the resume report.",
            );
          }

          if (!data) {
            throw new Error(
              "Resume report not found.",
            );
          }

          if (mounted) {
            setReport(
              data as Report,
            );
          }
        } catch (error) {
          console.error(
            "Resume report loading error:",
            error,
          );

          if (mounted) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Unable to load the resume report.",
            );
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

    void loadReport();

    return () => {
      mounted = false;
    };
  }, [reportId]);

  const handlePrint =
    () => {
      window.print();
    };

  /*
   * Missing report ID
   *
   * Important:
   * This is handled during render instead of
   * calling setState() inside useEffect.
   */
  if (!reportId) {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5">
          <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle
                size={25}
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Resume report ID is missing
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The requested resume report could not be identified.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/resume-analyzer",
                )
              }
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white transition hover:bg-[#3f3185]"
            >
              <ArrowLeft
                size={15}
              />
              Back to Resume Analyzer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Loading state
   */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="mx-auto max-w-6xl space-y-5 px-5 py-8 sm:px-8">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" />

          <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />

          <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />

          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  /*
   * Error state
   */

  if (
    errorMessage ||
    !report
  ) {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5">
          <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle
                size={25}
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load report
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {errorMessage ||
                "The requested resume report could not be found."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/resume-analyzer",
                )
              }
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white transition hover:bg-[#3f3185]"
            >
              <ArrowLeft
                size={15}
              />
              Back to Resume Analyzer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Processing state
   */

  if (
    report.status ===
    "processing"
  ) {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <div className="rounded-3xl border border-violet-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Sparkles
                size={28}
                className="animate-pulse"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Your resume is being analyzed
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              GrowIQ is comparing your resume with the target role and job description.
            </p>

            <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-600" />
            </div>

            <Link
              to="/dashboard"
              className="mt-6 inline-flex text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Failed state
   */

  if (
    report.status ===
    "failed"
  ) {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle
                size={28}
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Resume analysis failed
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The AI analysis could not be completed. Please try generating the analysis again.
            </p>

            <Link
              to="/resume-analyzer"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white transition hover:bg-[#3f3185]"
            >
              <ArrowLeft
                size={15}
              />
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Completed report without result data
   */

  const result =
    report.result_data;

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <FileText
              size={30}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Report data unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This report does not contain a completed analysis.
            </p>

            <Link
              to="/resume-analyzer"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white"
            >
              <ArrowLeft
                size={15}
              />
              Back to Resume Analyzer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const candidateName =
    report.input_data
      ?.name ||
    "Your Resume";

  const targetRole =
    report.input_data
      ?.targetRole ||
    "Target Role";

  const score =
    result.ats_score ?? 0;

  const improvedResume =
    result.improved_resume;

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      <style>{`@media print { body * { visibility: hidden !important; } #resume-print-area, #resume-print-area * { visibility: visible !important; } #resume-print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: none !important; padding: 24px !important; } @page { size: A4; margin: 12mm; } }`}</style>
      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/resume-analyzer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft
                size={18}
              />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4b3a9b] to-[#37277f] text-white shadow-sm">
              <FileText
                size={19}
              />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                Resume Analysis Report
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                {targetRole}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handlePrint
            }
            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Printer
              size={15}
            />

            <span className="hidden sm:inline">
              Print / Save PDF
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
        {/* HERO */}

        <section className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#241553] via-[#4b3a9b] to-[#5b4bb2] p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-300/15 blur-3xl" />

          <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-purple-100 backdrop-blur-md">
                <Sparkles
                  size={13}
                />
                AI Resume Analysis
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {candidateName}'s Resume Report
              </h2>

              <p className="mt-2 text-sm text-purple-100">
                Target role:{" "}
                <span className="font-semibold text-white">
                  {targetRole}
                </span>
              </p>

              {result.executive_summary && (
                <p className="mt-4 max-w-2xl text-xs leading-6 text-purple-100">
                  {
                    result.executive_summary
                  }
                </p>
              )}
            </div>

            <div className="flex justify-start lg:justify-end">
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[10px] border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
                <span className="text-4xl font-bold">
                  {Math.round(
                    score,
                  )}
                </span>

                <span className="mt-1 text-xs font-medium text-purple-100">
                  ATS Match Score
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SCORE BREAKDOWN */}

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-bold text-slate-900">
            Score Breakdown
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Estimated alignment based on the resume and job description you provided.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreCard
              label="Keyword Match"
              score={
                result.score_breakdown
                  ?.keyword_match
              }
            />

            <ScoreCard
              label="Job Alignment"
              score={
                result.score_breakdown
                  ?.job_alignment
              }
            />

            <ScoreCard
              label="Experience Relevance"
              score={
                result.score_breakdown
                  ?.experience_relevance
              }
            />

            <ScoreCard
              label="Skills Match"
              score={
                result.score_breakdown
                  ?.skills_match
              }
            />

            <ScoreCard
              label="Resume Structure"
              score={
                result.score_breakdown
                  ?.resume_structure
              }
            />
          </div>
        </section>

        {/* STRENGTHS + KEYWORDS */}

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2
                  size={19}
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  What's Working
                </h3>

                <p className="text-[11px] text-slate-500">
                  Resume strengths
                </p>
              </div>
            </div>

            <BulletList
              items={
                result.whats_good
              }
              emptyText="No specific strengths were identified."
            />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Target
                  size={19}
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Missing Keywords
                </h3>

                <p className="text-[11px] text-slate-500">
                  Job-description terms that need attention
                </p>
              </div>
            </div>

            {result.missing_keywords &&
            result.missing_keywords.length >
              0 ? (
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map(
                  (
                    keyword,
                    index,
                  ) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700"
                    >
                      {keyword}
                    </span>
                  ),
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No specific missing keywords were identified.
              </p>
            )}
          </section>
        </div>

        {/* DETAILED ANALYSIS */}

        <div className="space-y-6">
          <AuditSectionCard
            title="Job Description Alignment"
            icon={
              <BriefcaseBusiness
                size={19}
              />
            }
            section={
              result.job_alignment
            }
          />

          <AuditSectionCard
            title="Experience Analysis"
            icon={
              <TrendingUp
                size={19}
              />
            }
            section={
              result.experience_analysis
            }
          />

          <AuditSectionCard
            title="Skills Analysis"
            icon={
              <Target
                size={19}
              />
            }
            section={
              result.skills_analysis
            }
          />

          <AuditSectionCard
            title="Resume Formatting & Structure"
            icon={
              <FileText
                size={19}
              />
            }
            section={
              result.formatting_analysis
            }
          />

          <AuditSectionCard
            title="Keyword Analysis"
            icon={
              <Sparkles
                size={19}
              />
            }
            section={
              result.keyword_analysis
            }
          />
        </div>

        {/* PRIORITY FIXES */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <Wrench
                size={19}
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Priority Fixes
              </h3>

              <p className="text-[11px] text-slate-500">
                Changes that should receive attention first
              </p>
            </div>
          </div>

          {result.priority_fixes &&
          result.priority_fixes.length >
            0 ? (
            <div className="space-y-3">
              {result.priority_fixes.map(
                (
                  fix,
                  index,
                ) => (
                  <div
                    key={`${fix.issue}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-violet-700 shadow-sm">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {fix.issue ||
                              "Resume improvement"}
                          </h4>

                          {fix.priority && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold uppercase text-red-600">
                              {
                                fix.priority
                              }
                            </span>
                          )}
                        </div>

                        {fix.why_it_matters && (
                          <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            <strong className="text-slate-700">
                              Why:
                            </strong>{" "}
                            {
                              fix.why_it_matters
                            }
                          </p>
                        )}

                        {fix.recommendation && (
                          <p className="mt-2 text-[11px] leading-5 text-violet-700">
                            <strong>
                              Recommendation:
                            </strong>{" "}
                            {
                              fix.recommendation
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No priority fixes were returned.
            </p>
          )}
        </section>

        {/* ACTION PLAN */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles
                size={19}
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Resume Improvement Action Plan
              </h3>

              <p className="text-[11px] text-slate-500">
                Recommended next steps
              </p>
            </div>
          </div>

          {result.action_plan &&
          result.action_plan.length >
            0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {result.action_plan.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.action}-${index}`}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      {item.priority ??
                        index + 1}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.action ||
                          "Resume improvement action"}
                      </p>

                      {item.reason && (
                        <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                          {
                            item.reason
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No action plan was returned.
            </p>
          )}
        </section>

        {/* IMPROVED RESUME */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowImprovedResume(
                (value) =>
                  !value,
              )
            }
            className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 text-left sm:px-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                <FileText
                  size={19}
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Improved Resume
                </h3>

                <p className="text-[11px] text-slate-500">
                  AI-rewritten using only provided information
                </p>
              </div>
            </div>

            <ChevronDown
              size={18}
              className={`text-slate-500 transition ${
                showImprovedResume
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {showImprovedResume && (
            <div id="resume-print-area" className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap justify-end gap-2 print:hidden">
                <button type="button" onClick={() => downloadResumeWord(improvedResume || {}, candidateName)} disabled={!improvedResume} className="rounded-xl bg-violet-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50">Download Word Resume</button>
                <button type="button" onClick={handlePrint} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Download PDF / Print</button>
              </div>
              {improvedResume?.notice && (
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                  {
                    improvedResume.notice
                  }
                </div>
              )}

              {improvedResume?.final_resume_text?.trim() && !improvedResume?.professional_summary && !improvedResume?.experience?.length ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">{improvedResume.final_resume_text}</pre>
              ) : null}

              {(improvedResume?.candidate_name || improvedResume?.target_headline || improvedResume?.contact_details) && (
                <div className="mb-6 border-b-2 border-slate-800 pb-4 text-center">
                  {improvedResume.candidate_name && <h2 className="text-2xl font-bold tracking-tight text-slate-900">{improvedResume.candidate_name}</h2>}
                  {improvedResume.target_headline && <p className="mt-1 text-sm font-semibold text-violet-700">{improvedResume.target_headline}</p>}
                  {improvedResume.contact_details && <p className="mt-2 break-words text-xs leading-5 text-slate-600">{[improvedResume.contact_details.email, improvedResume.contact_details.phone, improvedResume.contact_details.location, improvedResume.contact_details.linkedin, improvedResume.contact_details.portfolio].filter(Boolean).join(" | ")}</p>}
                </div>
              )}

              {improvedResume?.professional_summary && (
                <div className="mb-6">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Professional Summary
                  </h4>

                  <p className="text-sm leading-6 text-slate-700">
                    {
                      improvedResume.professional_summary
                    }
                  </p>
                </div>
              )}

              {improvedResume?.experience &&
                improvedResume.experience.length >
                  0 && (
                  <div className="mb-6">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Experience
                    </h4>

                    <div className="space-y-5">
                      {improvedResume.experience.map(
                        (
                          experience,
                          index,
                        ) => (
                          <div
                            key={`${experience.company}-${index}`}
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {experience.role ||
                                    "Role"}
                                </p>

                                <p className="mt-0.5 text-xs font-medium text-violet-700">
                                  {experience.company ||
                                    "Company"}
                                </p>
                              </div>

                              {experience.dates && (
                                <span className="text-[11px] text-slate-500">
                                  {
                                    experience.dates
                                  }
                                </span>
                              )}
                            </div>

                            <div className="mt-3">
                              <BulletList
                                items={
                                  experience.bullets
                                }
                                emptyText="No experience bullets were generated."
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {improvedResume?.projects?.length ? (
                <div className="mb-6">
                  <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Projects</h4>
                  <div className="space-y-4">
                    {improvedResume.projects.map((project, index) => (
                      <div key={`${project.name}-${index}`}>
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900">{project.name}</p>
                          <span className="text-[11px] text-slate-500">{project.dates}</span>
                        </div>
                        <BulletList items={project.bullets} />
                        {project.technologies?.length ? <p className="mt-1 text-xs text-slate-600">Technologies: {project.technologies.join(", ")}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {improvedResume?.skills &&
                improvedResume.skills.length >
                  0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Skills
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {improvedResume.skills.map(
                        (
                          skill,
                          index,
                        ) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700"
                          >
                            {skill}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {improvedResume?.education &&
                improvedResume.education.length >
                  0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Education
                    </h4>

                    <div className="space-y-2">
                      {improvedResume.education.map((item, index) => (
                        <div key={`education-${index}`} className="text-sm leading-6 text-slate-700">
                          {typeof item === "string" ? item : (
                            <>
                              <p className="font-semibold text-slate-900">{[item.qualification, item.institution].filter(Boolean).join(" — ")}</p>
                              {(item.dates || item.details) && <p className="text-xs text-slate-500">{[item.dates, item.details].filter(Boolean).join(" | ")}</p>}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {improvedResume?.certifications &&
                improvedResume.certifications.length >
                  0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Certifications
                    </h4>

                    <BulletList
                      items={
                        improvedResume.certifications
                      }
                    />
                  </div>
                )}

              {improvedResume?.skills_to_confirm?.length ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 print:hidden">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">Skills to confirm before using</h4>
                  <p className="text-xs leading-5 text-amber-800">These job requirements were not clearly supported by the source resume. Add them only if you genuinely have the experience.</p>
                  <div className="mt-2 flex flex-wrap gap-2">{improvedResume.skills_to_confirm.map((skill, index) => <span key={`${skill}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs text-amber-800">{skill}</span>)}</div>
                </div>
              ) : null}

              {!improvedResume?.professional_summary &&
                !improvedResume?.experience?.length &&
                !improvedResume?.skills?.length &&
                !improvedResume?.education?.length &&
                !improvedResume?.certifications?.length &&
                !improvedResume?.final_resume_text?.trim() && (
                  <p className="text-xs text-slate-500">
                    An improved resume was not available for this report.
                  </p>
                )}
              </div>
          )}
        </section>

        {/* FINAL RECOMMENDATION */}

        {result.final_recommendation && (
          <section className="mt-6 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                <Sparkles
                  size={19}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-violet-900">
                  Final Recommendation
                </h3>

                <p className="mt-2 text-xs leading-6 text-violet-800">
                  {
                    result.final_recommendation
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row print:hidden">
          <Link
            to="/resume-analyzer"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-violet-700"
          >
            <ArrowLeft
              size={14}
            />
            Analyze another resume
          </Link>

          <button
            type="button"
            onClick={
              handlePrint
            }
            className="flex h-10 items-center gap-2 rounded-xl bg-[#4b3a9b] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#3f3185]"
          >
            <Printer
              size={15}
            />
            Print / Save PDF
          </button>
        </div>
      </main>
    </div>
  );
}

export default ResumeAnalyzerReport;