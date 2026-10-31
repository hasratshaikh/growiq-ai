import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Filter,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ReportModule = {
  id: string;
  name: string;
  slug: string;
};

type Report = {
  id: string;
  title: string;
  description: string | null;
  status: "processing" | "completed" | "failed";
  created_at: string;
  module_id: string;
  modules: ReportModule | null;
};

const reportRoutes: Record<string, string> = {
  "goal-planner": "/goal-planner/report",
  "instagram-audit": "/instagram-audit/report",
  "linkedin-audit": "/linkedin-audit/report",
  "resume-analyzer": "/resume-analyzer/report",
  "content-strategy": "/content-strategy/report",
};

const categoryOptions = [
  {
    name: "AI Consultant",
    slug: "ai-consultant",
  },
  {
    name: "Instagram Audit",
    slug: "instagram-audit",
  },
  {
    name: "LinkedIn Audit",
    slug: "linkedin-audit",
  },
  {
    name: "Resume Analyzer",
    slug: "resume-analyzer",
  },
  {
    name: "Content Strategy",
    slug: "content-strategy",
  },
  {
    name: "Goal Planner",
    slug: "goal-planner",
  },
];

const fallbackDescriptions: Record<string, string> = {
  "ai-consultant":
    "Personal AI growth guidance and career consultation.",

  "instagram-audit":
    "Detailed Instagram profile, content, discoverability and conversion analysis.",

  "linkedin-audit":
    "Professional LinkedIn profile and career growth analysis.",

  "resume-analyzer":
    "AI-powered resume analysis with improvement recommendations.",

  "content-strategy":
    "Personalized content strategy and publishing roadmap.",

  "goal-planner":
    "Personalized career roadmap based on your goals, qualification and timeline.",
};

function getModule(report: Report) {
  return report.modules;
}

function getModuleName(report: Report) {
  return getModule(report)?.name || "AI Report";
}

function getModuleSlug(report: Report) {
  return getModule(report)?.slug || "";
}

function getDescription(report: Report) {
  return (
    report.description ||
    fallbackDescriptions[getModuleSlug(report)] ||
    "AI-generated personalized growth report."
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("all");

  const [showFilters, setShowFilters] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        /*
         * Get authenticated user.
         */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "Please sign in to view your reports.",
          );
        }

        /*
         * Fetch reports WITHOUT description.
         *
         * The database currently has a description column,
         * but the Supabase REST/PostgREST layer is returning
         * a stale schema error for that column.
         *
         * Therefore Reports page does not depend on it.
         */
        const {
          data: reportData,
          error: reportError,
        } = await supabase
          .from("reports")
          .select(
            `
              id,
              title,
              status,
              created_at,
              module_id
            `,
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (reportError) {
          console.error(
            "Reports query error:",
            reportError,
          );

          throw new Error(
            reportError.message ||
              "Unable to load reports.",
          );
        }

        const rawReports = reportData || [];

        /*
         * No reports.
         */
        if (rawReports.length === 0) {
          setReports([]);
          return;
        }

        /*
         * Get unique module IDs.
         */
        const moduleIds = Array.from(
          new Set(
            rawReports
              .map(
                (report) =>
                  report.module_id,
              )
              .filter(
                (
                  moduleId,
                ): moduleId is string =>
                  Boolean(moduleId),
              ),
          ),
        );

        /*
         * Fetch modules separately.
         *
         * No nested Supabase relationship is used.
         */
        let moduleMap = new Map<
          string,
          ReportModule
        >();

        if (moduleIds.length > 0) {
          const {
            data: moduleData,
            error: moduleError,
          } = await supabase
            .from("modules")
            .select(
              `
                id,
                name,
                slug
              `,
            )
            .in("id", moduleIds);

          if (moduleError) {
            console.error(
              "Modules query error:",
              moduleError,
            );

            throw new Error(
              moduleError.message ||
                "Unable to load report categories.",
            );
          }

          moduleMap = new Map(
            (moduleData || []).map(
              (module) => [
                module.id,
                module as ReportModule,
              ],
            ),
          );
        }

        /*
         * Combine reports and modules.
         *
         * Description is intentionally null here.
         * The UI uses fallbackDescriptions.
         */
        const normalizedReports: Report[] =
          rawReports.map((report) => ({
            id: report.id,
            title: report.title,
            description: null,
            status: report.status,
            created_at: report.created_at,
            module_id: report.module_id,
            modules:
              moduleMap.get(
                report.module_id,
              ) || null,
          }));

        setReports(normalizedReports);
      } catch (error) {
        console.error(
          "Reports loading error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your reports.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadReports();
  }, []);

  /*
   * Search + category + date filters.
   */
  const filteredReports = useMemo(() => {
    const now = new Date();

    return reports.filter((report) => {
      const moduleName =
        getModuleName(report);

      const searchText =
        `${report.title} ${
          report.description || ""
        } ${moduleName}`.toLowerCase();

      const query =
        searchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        searchText.includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        getModuleSlug(report) ===
          categoryFilter;

      const createdDate = new Date(
        report.created_at,
      );

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate =
          createdDate.toDateString() ===
          now.toDateString();
      }

      if (dateFilter === "7days") {
        const sevenDaysAgo =
          new Date(now);

        sevenDaysAgo.setDate(
          now.getDate() - 7,
        );

        matchesDate =
          createdDate >= sevenDaysAgo;
      }

      if (dateFilter === "30days") {
        const thirtyDaysAgo =
          new Date(now);

        thirtyDaysAgo.setDate(
          now.getDate() - 30,
        );

        matchesDate =
          createdDate >= thirtyDaysAgo;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [
    reports,
    searchQuery,
    categoryFilter,
    dateFilter,
  ]);

  /*
   * Get report route.
   */
  const getReportRoute = (
    report: Report,
  ) => {
    const slug = getModuleSlug(report);

    const route = reportRoutes[slug];

    if (!route) {
      return null;
    }

    return `${route}/${report.id}`;
  };

  /*
   * View report.
   */
  const handleViewReport = (
    report: Report,
  ) => {
    const route = getReportRoute(report);

    if (!route) {
      setErrorMessage(
        "Report page is not configured for this module yet.",
      );

      return;
    }

    navigate(route);
  };

  /*
   * Open report in a new tab.
   */
  const handleDownload = (
    report: Report,
  ) => {
    const route = getReportRoute(report);

    if (!route) {
      setErrorMessage(
        "Download is not available for this report yet.",
      );

      return;
    }

    const reportWindow = window.open(
      route,
      "_blank",
    );

    if (!reportWindow) {
      setErrorMessage(
        "Please allow pop-ups to download your report.",
      );
    }
  };

  /*
   * Delete report.
   */
  const handleDelete = async (
    report: Report,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", report.id);

      if (error) {
        throw error;
      }

      setReports((current) =>
        current.filter(
          (item) =>
            item.id !== report.id,
        ),
      );
    } catch (error) {
      console.error(
        "Report deletion error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the report.",
      );
    }
  };

  /*
   * Clear filters.
   */
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setDateFilter("all");
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== "all" ||
    dateFilter !== "all";

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#4b3a9b]">
              <FileText size={18} />

              <span className="text-sm font-semibold">
                My Growth
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Reports
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and manage all your generated
              AI reports.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-slate-400">
              Total Reports
            </p>

            <p className="mt-0.5 text-xl font-bold text-slate-900">
              {reports.length}
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search reports..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#6a58c5] focus:bg-white focus:ring-4 focus:ring-[#6a58c5]/10"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (current) => !current,
                )
              }
              className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition ${
                showFilters
                  ? "border-[#c9c1ed] bg-[#eeeafd] text-[#4b3a9b]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#c9c1ed] hover:text-[#4b3a9b]"
              }`}
            >
              <Filter size={17} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">

              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Category
                </label>

                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-[#6a58c5] focus:ring-4 focus:ring-[#6a58c5]/10"
                  >
                    <option value="all">
                      All Categories
                    </option>

                    {categoryOptions.map(
                      (category) => (
                        <option
                          key={category.slug}
                          value={category.slug}
                        >
                          {category.name}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Date
                </label>

                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(event) =>
                      setDateFilter(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-[#6a58c5] focus:ring-4 focus:ring-[#6a58c5]/10"
                  >
                    <option value="all">
                      All Dates
                    </option>

                    <option value="today">
                      Today
                    </option>

                    <option value="7days">
                      Last 7 Days
                    </option>

                    <option value="30days">
                      Last 30 Days
                    </option>
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-[#4b3a9b] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#4b3a9b]" />

            <p className="mt-4 text-sm text-slate-500">
              Loading your reports...
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          filteredReports.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eeeafd] text-[#4b3a9b]">
                <FileText size={24} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No reports found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {reports.length === 0
                  ? "Generate your first AI report and it will appear here."
                  : "No reports match your current search or filters."}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-[#4b3a9b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

        {/* Reports */}
        {!isLoading &&
          filteredReports.length > 0 && (
            <div className="space-y-4">
              {filteredReports.map(
                (report) => {
                  const moduleName =
                    getModuleName(report);

                  const description =
                    getDescription(report);

                  const isCompleted =
                    report.status ===
                    "completed";

                  return (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#d6d0ee] hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#eeeafd] px-3 py-1 text-xs font-bold text-[#4b3a9b]">
                              {moduleName}
                            </span>

                            {report.status ===
                              "processing" && (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                Processing
                              </span>
                            )}

                            {report.status ===
                              "failed" && (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                                Failed
                              </span>
                            )}
                          </div>

                          <h2 className="mt-3 text-lg font-bold text-slate-900 sm:text-xl">
                            {report.title}
                          </h2>

                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            {description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays
                                size={14}
                              />
                              {formatDate(
                                report.created_at,
                              )}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Clock3
                                size={14}
                              />
                              {formatTime(
                                report.created_at,
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleViewReport(
                                report,
                              )
                            }
                            disabled={
                              !isCompleted
                            }
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-4 text-sm font-semibold text-white transition hover:bg-[#3f3185] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <FileText
                              size={16}
                            />
                            View Report
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                report,
                              )
                            }
                            disabled={
                              !isCompleted
                            }
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#c9c1ed] hover:text-[#4b3a9b] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Download
                              size={16}
                            />
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                report,
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            title="Delete report"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}

        {/* Result Count */}
        {!isLoading &&
          filteredReports.length > 0 && (
            <p className="mt-5 text-center text-xs text-slate-400">
              Showing{" "}
              {filteredReports.length} of{" "}
              {reports.length} reports
            </p>
          )}
      </div>
    </div>
  );
}

export default Reports;