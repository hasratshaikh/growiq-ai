import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  MapPin,
  Printer,
  Rocket,
  Target,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type GapAnalysis = {
  education_gap: string[];
  skills_to_develop: string[];
  experience_gap: string[];
  portfolio_gap: string[];
  networking_gap: string[];
};

type SkillToLearn = {
  skill: string;
  priority: string;
  why_it_matters: string;
  learning_direction: string;
};

type CareerRoadmap = {
  phase: string;
  timeline: string;
  focus: string;
  actions: string[];
  milestones: string[];
};

type ActionPlan = {
  daily: string[];
  weekly: string[];
  monthly: string[];
};

type ProjectToBuild = {
  project: string;
  purpose: string;
  suggested_output: string;
};

type ThirtyDayPlan = {
  week: string;
  focus: string;
  actions: string[];
  expected_progress: string;
};

type FinalGrowthBlueprint = {
  focus_now: string[];
  build_next: string[];
  execute_next: string[];
  optimize: string[];
  next_milestone: string;
};

type GoalPlannerResult = {
  title: string;
  goal_summary: string;
  current_position: string;
  target_position: string;
  gap_analysis: GapAnalysis;
  skills_to_learn: SkillToLearn[];
  career_roadmap: CareerRoadmap[];
  action_plan: ActionPlan;
  projects_to_build: ProjectToBuild[];
  career_strategy: string[];
  thirty_day_plan: ThirtyDayPlan[];
  success_indicators: string[];
  final_growth_blueprint: FinalGrowthBlueprint;
};

type Report = {
  id: string;
  title: string;
  result_data: GoalPlannerResult;
  status: "processing" | "completed" | "failed";
};

type SectionCardProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
};

function SectionCard({
  title,
  description,
  icon,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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

      {children}
    </section>
  );
}

type BulletListProps = {
  items?: string[];
  emptyText?: string;
};

function BulletList({
  items,
  emptyText = "No specific information available.",
}: BulletListProps) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3"
        >
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0 text-[#5b49aa]"
          />

          <p className="text-sm leading-6 text-slate-700">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

type GapColumnProps = {
  title: string;
  items?: string[];
};

function GapColumn({
  title,
  items,
}: GapColumnProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <BulletList items={items} />
    </div>
  );
}

type BlueprintBlockProps = {
  title: string;
  items?: string[];
};

function BlueprintBlock({
  title,
  items,
}: BlueprintBlockProps) {
  return (
    <div className="rounded-xl bg-white/10 p-5">
      <h3 className="font-bold text-white">
        {title}
      </h3>

      <div className="mt-3 space-y-2.5">
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-start gap-2.5"
            >
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-white/80"
              />

              <p className="text-sm leading-6 text-white/80">
                {item}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/60">
            No specific information available.
          </p>
        )}
      </div>
    </div>
  );
}

function GoalPlannerReport() {
  const navigate = useNavigate();
  const { reportId } = useParams();

  const [report, setReport] =
    useState<Report | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!reportId) {
      return;
    }

    let isMounted = true;

    const loadReport = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "Please sign in to view this report.",
          );
        }

        const { data, error } =
          await supabase
            .from("reports")
            .select(
              "id, title, result_data, status",
            )
            .eq("id", reportId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "This report could not be found.",
          );
        }

        if (isMounted) {
          setReport(data as Report);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the report.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      isMounted = false;
    };
  }, [reportId]);

  if (!reportId) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Report not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate("/goal-planner")
            }
            className="mt-5 rounded-xl bg-[#4b3a9b] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Goal Planner
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa]">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={30}
            className="animate-spin text-[#4b3a9b]"
          />

          <p className="text-sm text-slate-500">
            Loading your career roadmap...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FileText size={22} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load report
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {errorMessage ||
              "The requested report is unavailable."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/goal-planner")
            }
            className="mt-6 rounded-xl bg-[#4b3a9b] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Goal Planner
          </button>
        </div>
      </div>
    );
  }

  if (report.status === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa] p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-[#4b3a9b]"
          />

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Your roadmap is being generated
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            GrowIQ AI is preparing your personalized
            career roadmap. Please refresh this page
            in a moment.
          </p>
        </div>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Roadmap generation failed
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please try generating the roadmap again.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/goal-planner")
            }
            className="mt-6 rounded-xl bg-[#4b3a9b] px-5 py-3 text-sm font-semibold text-white"
          >
            Create New Roadmap
          </button>
        </div>
      </div>
    );
  }

  const result = report.result_data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              navigate("/goal-planner")
            }
            className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#4b3a9b]"
          >
            <ChevronRight
              size={18}
              className="rotate-180"
            />
            Back to Goal Planner
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#c9c1ed] hover:text-[#4b3a9b]"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-[#4b3a9b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
            >
              <Download size={16} />
              Save PDF
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#3d2878] via-[#4937a3] to-[#263b87] px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-4xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  <Rocket size={14} />
                  Personalized Career Roadmap
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {result.title ||
                    report.title ||
                    "Your Career Roadmap"}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-white/80 sm:text-base">
                  {result.goal_summary}
                </p>
              </div>

              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10 lg:flex">
                <Target
                  size={44}
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current / Target */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Current Position"
            icon={<MapPin size={19} />}
          >
            <p className="text-sm leading-7 text-slate-700">
              {result.current_position}
            </p>
          </SectionCard>

          <SectionCard
            title="Target Position"
            icon={<Target size={19} />}
          >
            <p className="text-sm leading-7 text-slate-700">
              {result.target_position}
            </p>
          </SectionCard>
        </div>

        {/* Gap Analysis */}
        <div className="mt-6">
          <SectionCard
            title="Gap Analysis"
            description="The key areas that need to be addressed to move toward your target."
            icon={<TrendingUp size={19} />}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <GapColumn
                title="Education Gap"
                items={
                  result.gap_analysis
                    ?.education_gap
                }
              />

              <GapColumn
                title="Skills to Develop"
                items={
                  result.gap_analysis
                    ?.skills_to_develop
                }
              />

              <GapColumn
                title="Experience Gap"
                items={
                  result.gap_analysis
                    ?.experience_gap
                }
              />

              <GapColumn
                title="Portfolio Gap"
                items={
                  result.gap_analysis
                    ?.portfolio_gap
                }
              />

              <GapColumn
                title="Networking Gap"
                items={
                  result.gap_analysis
                    ?.networking_gap
                }
              />
            </div>
          </SectionCard>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <SectionCard
            title="Skills to Learn"
            description="Skills recommended based on your target direction."
            icon={<Lightbulb size={19} />}
          >
            <div className="space-y-4">
              {result.skills_to_learn?.map(
                (skill, index) => (
                  <div
                    key={`${skill.skill}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {skill.skill}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {skill.why_it_matters}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-[#eeeafd] px-3 py-1 text-xs font-bold text-[#4b3a9b]">
                        {skill.priority}
                      </span>
                    </div>

                    <div className="mt-4 rounded-lg bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Learning Direction
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {skill.learning_direction}
                      </p>
                    </div>
                  </div>
                ),
              )}

              {(!result.skills_to_learn ||
                result.skills_to_learn.length ===
                  0) && (
                <p className="text-sm text-slate-500">
                  No skills were provided.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Career Roadmap */}
        <div className="mt-6">
          <SectionCard
            title="Career Roadmap"
            description="Follow these phases progressively toward your target."
            icon={<Rocket size={19} />}
          >
            <div className="space-y-5">
              {result.career_roadmap?.map(
                (phase, index) => (
                  <div
                    key={`${phase.phase}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4b3a9b] text-sm font-bold text-white">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-base font-bold text-slate-900">
                            {phase.phase}
                          </h3>

                          <span className="flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            <Clock3 size={13} />
                            {phase.timeline}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-medium leading-6 text-[#4b3a9b]">
                          {phase.focus}
                        </p>

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          <div>
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                              Actions
                            </h4>

                            <BulletList
                              items={
                                phase.actions
                              }
                            />
                          </div>

                          <div>
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                              Milestones
                            </h4>

                            <BulletList
                              items={
                                phase.milestones
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </SectionCard>
        </div>

        {/* Action Plan */}
        <div className="mt-6">
          <SectionCard
            title="Action Plan"
            description="Practical actions to maintain consistent progress."
            icon={<CheckCircle2 size={19} />}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="mb-4 font-bold text-slate-900">
                  Daily
                </h3>

                <BulletList
                  items={result.action_plan?.daily}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="mb-4 font-bold text-slate-900">
                  Weekly
                </h3>

                <BulletList
                  items={result.action_plan?.weekly}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="mb-4 font-bold text-slate-900">
                  Monthly
                </h3>

                <BulletList
                  items={result.action_plan?.monthly}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Projects */}
        <div className="mt-6">
          <SectionCard
            title="Projects to Build"
            description="Practical projects that can strengthen your profile and demonstrate capability."
            icon={<BriefcaseBusiness size={19} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {result.projects_to_build?.map(
                (project, index) => (
                  <div
                    key={`${project.project}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#4b3a9b]">
                        <BriefcaseBusiness
                          size={17}
                        />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {project.project}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {project.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Suggested Output
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {project.suggested_output}
                      </p>
                    </div>
                  </div>
                ),
              )}

              {(!result.projects_to_build ||
                result.projects_to_build.length ===
                  0) && (
                <p className="text-sm text-slate-500">
                  No projects were provided.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Career Strategy */}
        <div className="mt-6">
          <SectionCard
            title="Career Strategy"
            description="Strategic principles for moving toward your goal."
            icon={<Lightbulb size={19} />}
          >
            <BulletList
              items={result.career_strategy}
            />
          </SectionCard>
        </div>

        {/* 30 Day Plan */}
        <div className="mt-6">
          <SectionCard
            title="30-Day Plan"
            description="Your first month broken into focused weekly execution."
            icon={<FileText size={19} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {result.thirty_day_plan?.map(
                (week, index) => (
                  <div
                    key={`${week.week}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-900">
                        {week.week}
                      </h3>

                      <ChevronRight
                        size={17}
                        className="text-[#4b3a9b]"
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[#4b3a9b]">
                      {week.focus}
                    </p>

                    <div className="mt-4">
                      <BulletList
                        items={week.actions}
                      />
                    </div>

                    <div className="mt-4 rounded-lg bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Expected Progress
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {week.expected_progress}
                      </p>
                    </div>
                  </div>
                ),
              )}

              {(!result.thirty_day_plan ||
                result.thirty_day_plan.length ===
                  0) && (
                <p className="text-sm text-slate-500">
                  No 30-day plan was provided.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Success Indicators */}
        <div className="mt-6">
          <SectionCard
            title="Success Indicators"
            description="Signs that you are making measurable progress toward the goal."
            icon={<Award size={19} />}
          >
            <BulletList
              items={result.success_indicators}
            />
          </SectionCard>
        </div>

        {/* Final Growth Blueprint */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#3d2878] via-[#4937a3] to-[#263b87] p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Rocket size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Final Growth Blueprint
              </h2>

              <p className="mt-1 text-sm text-white/70">
                Keep this sequence as your execution
                framework.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <BlueprintBlock
              title="Focus Now"
              items={
                result.final_growth_blueprint
                  ?.focus_now
              }
            />

            <BlueprintBlock
              title="Build Next"
              items={
                result.final_growth_blueprint
                  ?.build_next
              }
            />

            <BlueprintBlock
              title="Execute Next"
              items={
                result.final_growth_blueprint
                  ?.execute_next
              }
            />

            <BlueprintBlock
              title="Optimize"
              items={
                result.final_growth_blueprint
                  ?.optimize
              }
            />
          </div>

          <div className="mt-5 rounded-xl bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">
              Next Milestone
            </p>

            <p className="mt-2 text-sm leading-6 text-white">
              {
                result.final_growth_blueprint
                  ?.next_milestone
              }
            </p>
          </div>
        </div>

        <div className="pb-8 pt-8 text-center">
          <p className="text-xs text-slate-400">
            Generated by GrowIQ AI
          </p>
        </div>
      </div>
    </div>
  );
}

export default GoalPlannerReport;