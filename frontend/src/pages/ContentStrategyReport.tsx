import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  Loader2,
  Printer,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { supabase } from "../lib/supabase";

type ContentPillar = {
  name?: string;
  purpose?: string;
  recommended_percentage?: number;
};

type ContentPlanItem = {
  day?: number;
  content_format?: string;
  content_pillar?: string;
  topic?: string;
  hook_or_title?: string;
  content_idea?: string;
  objective?: string;
  cta?: string;
  caption_angle?: string;
};

type PostingScheduleItem = {
  day?: string;
  recommended_time?: string;
  reason?: string;
};

type ActionPlan = {
  daily_actions?: string[];
  weekly_actions?: string[];
  optimization_actions?: string[];
};

type ContentStrategyResult = {
  title?: string;
  objective_summary?: string;
  content_pillars?: ContentPillar[];
  content_plan?: ContentPlanItem[];
  posting_schedule?: PostingScheduleItem[];
  action_plan?: ActionPlan;
};

type Report = {
  id: string;
  title: string;
  status: string;
  result_data: ContentStrategyResult | null;
  created_at?: string;
};

function ContentStrategyReport() {
  const navigate = useNavigate();

  const { reportId } = useParams<{
    reportId: string;
  }>();

  const [report, setReport] =
    useState<Report | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!reportId) {
      return;
    }

    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "Please login to view this report.",
          );
        }

        const {
          data,
          error,
        } = await supabase
          .from("reports")
          .select(
            "id, title, status, result_data, created_at",
          )
          .eq("id", reportId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error("Report not found.");
        }

        if (!cancelled) {
          setReport(data as Report);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load report.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  if (!reportId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Report ID is missing
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            We could not identify the requested report.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/content-strategy")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
          >
            <ArrowLeft size={16} />
            Back to Content Strategy
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            size={22}
            className="animate-spin"
          />

          <span className="text-sm font-medium">
            Loading your content strategy...
          </span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Unable to load report
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/content-strategy")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4b3a9b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
          >
            <ArrowLeft size={16} />
            Back to Content Strategy
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  if (report.status === "processing") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#eeeafd] text-[#4b3a9b]">
            <Loader2
              size={26}
              className="animate-spin"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Your strategy is being prepared
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            GrowIQ AI is generating your personalized content strategy.
          </p>
        </div>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Strategy generation failed
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Something went wrong while generating your strategy. Please try again.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/content-strategy")
            }
            className="mt-6 rounded-xl bg-[#4b3a9b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f3185]"
          >
            Create New Strategy
          </button>
        </div>
      </div>
    );
  }

  const result =
    report.result_data ?? {};

  const contentPillars =
    Array.isArray(result.content_pillars)
      ? result.content_pillars
      : [];

  const contentPlan =
    Array.isArray(result.content_plan)
      ? result.content_plan
      : [];

  const postingSchedule =
    Array.isArray(result.posting_schedule)
      ? result.posting_schedule
      : [];

  const actionPlan =
    result.action_plan ?? {};

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <button
            type="button"
            onClick={() =>
              navigate("/content-strategy")
            }
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#4b3a9b]"
          >
            <ArrowLeft size={17} />
            Back to Content Strategy
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#d8d0f5] hover:text-[#4b3a9b]"
          >
            <Printer size={17} />
            Print / Save PDF
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3d2878] via-[#4937a3] to-[#263b87] px-6 py-8 text-white shadow-lg sm:px-8 lg:px-10">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <FileText size={14} />
              Content Strategy Report
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {result.title ||
                report.title ||
                "Your Content Strategy"}
            </h1>

            {result.objective_summary && (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
                {result.objective_summary}
              </p>
            )}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <ReportCard
            icon={<Target size={19} />}
            title="Content Pillars"
            subtitle="The core themes your content should consistently build around."
          >
            {contentPillars.length === 0 ? (
              <EmptyState text="No content pillars were generated." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {contentPillars.map(
                  (pillar, index) => (
                    <div
                      key={`${pillar.name}-${index}`}
                      className="rounded-2xl border border-gray-100 bg-[#fafaff] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-gray-900">
                          {pillar.name ||
                            `Pillar ${index + 1}`}
                        </h3>

                        {typeof pillar.recommended_percentage ===
                          "number" && (
                          <span className="shrink-0 rounded-full bg-[#eeeafd] px-2.5 py-1 text-xs font-bold text-[#4b3a9b]">
                            {
                              pillar.recommended_percentage
                            }
                            %
                          </span>
                        )}
                      </div>

                      {pillar.purpose && (
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {pillar.purpose}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </ReportCard>

          <ReportCard
            icon={<CalendarDays size={19} />}
            title="Content Plan"
            subtitle={`${contentPlan.length} planned content ${
              contentPlan.length === 1
                ? "day"
                : "days"
            }`}
          >
            {contentPlan.length === 0 ? (
              <EmptyState text="No content plan was generated." />
            ) : (
              <div className="space-y-4">
                {contentPlan.map(
                  (item, index) => (
                    <ContentPlanCard
                      key={`${item.day}-${index}`}
                      item={item}
                    />
                  ),
                )}
              </div>
            )}
          </ReportCard>

          <ReportCard
            icon={<Clock3 size={19} />}
            title="Posting Schedule"
            subtitle="Recommended posting windows. These are general recommendations unless account analytics are available."
          >
            {postingSchedule.length === 0 ? (
              <EmptyState text="No posting schedule was generated." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {postingSchedule.map(
                  (item, index) => (
                    <div
                      key={`${item.day}-${index}`}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
                          <Clock3 size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {item.day ||
                              `Day ${
                                index + 1
                              }`}
                          </p>

                          <p className="mt-0.5 text-sm font-semibold text-[#4b3a9b]">
                            {item.recommended_time ||
                              "Recommended window"}
                          </p>
                        </div>
                      </div>

                      {item.reason && (
                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </ReportCard>

          <ReportCard
            icon={<TrendingUp size={19} />}
            title="Action Plan"
            subtitle="Actions to execute, review and optimize your content strategy."
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <ActionColumn
                title="Daily Actions"
                icon={
                  <CheckCircle2 size={17} />
                }
                items={
                  actionPlan.daily_actions
                }
              />

              <ActionColumn
                title="Weekly Actions"
                icon={
                  <CalendarDays size={17} />
                }
                items={
                  actionPlan.weekly_actions
                }
              />

              <ActionColumn
                title="Optimization"
                icon={
                  <TrendingUp size={17} />
                }
                items={
                  actionPlan.optimization_actions
                }
              />
            </div>
          </ReportCard>

          <div className="rounded-2xl border border-[#ddd6f8] bg-[#f8f6ff] p-5">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
                <Lightbulb size={18} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Use this as your execution roadmap
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Consistency matters more than simply publishing more content. Execute the plan, review your results regularly and optimize based on actual audience response.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: white !important;
            }

            .print\\:hidden {
              display: none !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </div>
  );
}

function ReportCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function ContentPlanCard({
  item,
}: {
  item: ContentPlanItem;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-[#fafaff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4b3a9b] text-sm font-bold text-white">
            {item.day || "—"}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Day
            </p>

            <h3 className="font-bold text-gray-900">
              {item.topic ||
                item.hook_or_title ||
                "Content Idea"}
            </h3>
          </div>
        </div>

        {item.content_format && (
          <span className="w-fit rounded-full bg-[#eeeafd] px-3 py-1.5 text-xs font-bold text-[#4b3a9b]">
            {item.content_format}
          </span>
        )}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <DetailBlock
          label="Content Pillar"
          value={item.content_pillar}
        />

        <DetailBlock
          label="Hook / Title"
          value={item.hook_or_title}
        />

        <div className="lg:col-span-2">
          <DetailBlock
            label="Content Idea"
            value={item.content_idea}
          />
        </div>

        <DetailBlock
          label="Objective"
          value={item.objective}
        />

        <DetailBlock
          label="Call to Action"
          value={item.cta}
        />

        <div className="lg:col-span-2">
          <DetailBlock
            label="Caption Angle"
            value={item.caption_angle}
          />
        </div>
      </div>
    </article>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="text-sm leading-6 text-gray-700">
        {value}
      </p>
    </div>
  );
}

function ActionColumn({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items?: string[];
}) {
  const safeItems = Array.isArray(items)
    ? items
    : [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-[#fafaff] p-5">
      <div className="flex items-center gap-2.5">
        <span className="text-[#4b3a9b]">
          {icon}
        </span>

        <h3 className="font-bold text-gray-900">
          {title}
        </h3>
      </div>

      {safeItems.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          No actions provided.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {safeItems.map(
            (item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex gap-2.5 text-sm leading-6 text-gray-600"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4b3a9b]" />

                <span>{item}</span>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
      <p className="text-sm text-gray-500">
        {text}
      </p>
    </div>
  );
}

export default ContentStrategyReport;