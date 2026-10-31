import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  GraduationCap,
  Lightbulb,
  MapPin,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type FormState = {
  name: string;
  targetRole: string;
  industry: string;
  highestQualification: string;
  countryCity: string;
  targetTimeline: string;
  primaryGoal: string;
  additionalNotes: string;
};

const qualificationOptions = [
  "10th",
  "12th",
  "Diploma",
  "Graduation",
  "Post Graduation",
  "Doctorate / PhD",
  "Other",
];

const industryOptions = [
  "Information Technology / Software",
  "Finance & Banking",
  "Marketing & Advertising",
  "Sales",
  "Human Resources",
  "Healthcare",
  "Education",
  "E-commerce",
  "Retail",
  "Media & Entertainment",
  "Design & Creative",
  "Real Estate",
  "Hospitality & Tourism",
  "Manufacturing",
  "Consulting",
  "Legal",
  "Government / Public Sector",
  "Beauty & Wellness",
  "Other",
];

const timelineOptions = [
  "3 Months",
  "6 Months",
  "12 Months",
  "2 Years",
  "3+ Years",
];

const goalOptions = [
  "Get a New Job",
  "Get Promoted",
  "Switch Career",
  "Become an Entrepreneur",
  "Start Freelancing",
  "Build Personal Brand",
  "Learn New Skills",
];

const initialForm: FormState = {
  name: "",
  targetRole: "",
  industry: "",
  highestQualification: "",
  countryCity: "",
  targetTimeline: "",
  primaryGoal: "",
  additionalNotes: "",
};

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  required?: boolean;
};

function InputField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  required = false,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        <span>{label}</span>

        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6a58c5] focus:ring-4 focus:ring-[#6a58c5]/10"
      />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  icon: React.ReactNode;
  required?: boolean;
};

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  icon,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        <span>{label}</span>

        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#6a58c5] focus:ring-4 focus:ring-[#6a58c5]/10"
        >
          <option value="">
            {placeholder}
          </option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}

function GoalPlanner() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [hasCreditAccess, setHasCreditAccess] =
    useState(false);

  const [accessLoading, setAccessLoading] =
    useState(true);

  const [availableCredits, setAvailableCredits] =
    useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkCreditAccess = async () => {
      setAccessLoading(true);

      try {
        const { data, error } = await supabase.rpc(
          "get_credit_access",
        );

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        setHasCreditAccess(Boolean(data?.allowed));
        if (typeof data?.credits === "number") {
          setAvailableCredits(data.credits);
        }
      } catch (error) {
        console.error("Credit access check failed:", error);
        if (isMounted) {
          setHasCreditAccess(false);
          setErrorMessage(
            "Unable to verify your plan and credits. Please try again or visit Subscription.",
          );
        }
      } finally {
        if (isMounted) {
          setAccessLoading(false);
        }
      }
    };

    void checkCreditAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const isFormValid = useMemo(() => {
    return Boolean(
      form.name.trim() &&
        form.targetRole.trim() &&
        form.industry &&
        form.highestQualification &&
        form.countryCity.trim() &&
        form.targetTimeline &&
        form.primaryGoal,
    );
  }, [form]);

  const updateField = (
    field: keyof FormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleGeneratePlan = async () => {
    if (!isFormValid || isGenerating || accessLoading) {
      return;
    }

    setErrorMessage("");
    setIsGenerating(true);

    try {
      // Deduct 10 credits for each Goal Planner generation.
      const {
        data: creditData,
        error: creditError,
      } = await supabase.rpc("consume_feature_credits", {
        p_feature: "goal-planner",
      });

      if (creditError) {
        throw new Error(
          "Unable to process your credits. Please try again.",
        );
      }

      if (!creditData?.allowed) {
        setHasCreditAccess(false);

        if (typeof creditData?.credits === "number") {
          setAvailableCredits(creditData.credits);
        }

        const creditMessage =
          creditData?.reason === "INSUFFICIENT_CREDITS"
            ? "You need 10 credits to generate a Goal Planner roadmap."
            : creditData?.reason === "TRIAL_EXPIRED"
              ? "Your trial has expired. Please upgrade your plan to continue."
              : "Your plan does not have access. Please visit Subscription.";

        throw new Error(creditMessage);
      }

      if (typeof creditData?.credits === "number") {
        setAvailableCredits(creditData.credits);
      }

      const { data, error } =
        await supabase.functions.invoke(
          "goal-planner",
          {
            body: {
              name: form.name.trim(),
              targetRole: form.targetRole.trim(),
              industry: form.industry,
              highestQualification:
                form.highestQualification,
              countryCity:
                form.countryCity.trim(),
              targetTimeline:
                form.targetTimeline,
              primaryGoal:
                form.primaryGoal,
              additionalNotes:
                form.additionalNotes.trim(),
            },
          },
        );

      if (error) {
        let message =
          "Unable to generate your career roadmap.";

        if (error.context instanceof Response) {
          try {
            const errorBody =
              await error.context.json();

            if (
              typeof errorBody?.error ===
              "string"
            ) {
              message = errorBody.error;
            }
          } catch {
            // Keep default error message.
          }
        }

        throw new Error(message);
      }

      if (!data?.reportId) {
        throw new Error(
          "Career roadmap was generated but no report was returned.",
        );
      }

      navigate(
        `/goal-planner/report/${data.reportId}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate your career roadmap. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#4b3a9b]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Hero */}
          <div className="bg-gradient-to-r from-[#3d2878] via-[#4937a3] to-[#263b87] px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                  <Sparkles size={14} />
                  AI Career Planning
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Goal Planner
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                  Tell us where you want to go.
                  GrowIQ AI will create a
                  personalized career roadmap for
                  you.
                </p>
              </div>

              <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/10 md:flex">
                <Target
                  size={38}
                  strokeWidth={1.7}
                />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 lg:p-10">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                Tell us about your goal
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Fill in the details below to
                generate your personalized roadmap.
              </p>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
                    <User size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Basic Information
                    </h3>

                    <p className="text-xs text-slate-500">
                      Your career direction
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(value) =>
                      updateField("name", value)
                    }
                    icon={
                      <User
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />

                  <InputField
                    label="Target Role / Identity"
                    placeholder="e.g. Product Manager"
                    value={form.targetRole}
                    onChange={(value) =>
                      updateField(
                        "targetRole",
                        value,
                      )
                    }
                    icon={
                      <BriefcaseBusiness
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />

                  <SelectField
                    label="Industry"
                    value={form.industry}
                    placeholder="Choose your industry"
                    options={industryOptions}
                    onChange={(value) =>
                      updateField(
                        "industry",
                        value,
                      )
                    }
                    icon={
                      <Lightbulb
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />

                  <InputField
                    label="Country / City"
                    placeholder="e.g. Mumbai, India"
                    value={form.countryCity}
                    onChange={(value) =>
                      updateField(
                        "countryCity",
                        value,
                      )
                    }
                    icon={
                      <MapPin
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />
                </div>
              </section>

              {/* Qualification */}
              <section className="border-t border-slate-100 pt-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
                    <GraduationCap size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Education
                    </h3>

                    <p className="text-xs text-slate-500">
                      Select your highest qualification
                    </p>
                  </div>
                </div>

                <div className="max-w-xl">
                  <SelectField
                    label="Highest Qualification"
                    value={
                      form.highestQualification
                    }
                    placeholder="Choose your highest qualification"
                    options={
                      qualificationOptions
                    }
                    onChange={(value) =>
                      updateField(
                        "highestQualification",
                        value,
                      )
                    }
                    icon={
                      <GraduationCap
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />
                </div>
              </section>

              {/* Career Goal */}
              <section className="border-t border-slate-100 pt-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeeafd] text-[#4b3a9b]">
                    <Target size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Career Goal
                    </h3>

                    <p className="text-xs text-slate-500">
                      Define your destination and
                      timeline
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <SelectField
                    label="Target Timeline"
                    value={
                      form.targetTimeline
                    }
                    placeholder="Select timeline"
                    options={
                      timelineOptions
                    }
                    onChange={(value) =>
                      updateField(
                        "targetTimeline",
                        value,
                      )
                    }
                    icon={
                      <Target
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />

                  <SelectField
                    label="Primary Goal"
                    value={form.primaryGoal}
                    placeholder="Select your primary goal"
                    options={goalOptions}
                    onChange={(value) =>
                      updateField(
                        "primaryGoal",
                        value,
                      )
                    }
                    icon={
                      <BriefcaseBusiness
                        size={15}
                        className="text-[#5a48aa]"
                      />
                    }
                    required
                  />
                </div>
              </section>

              {/* Additional Notes */}
              <section className="border-t border-slate-100 pt-8">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Additional Notes
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  value={form.additionalNotes}
                  onChange={(event) =>
                    updateField(
                      "additionalNotes",
                      event.target.value,
                    )
                  }
                  placeholder="Anything else you want GrowIQ AI to consider about your career goal..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6a58c5] focus:ring-4 focus:ring-[#6a58c5]/10"
                />
              </section>

              {availableCredits !== null && (
                <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm">
                  <span className="font-medium text-slate-700">
                    Available credits
                  </span>
                  <span className="font-bold text-violet-700">
                    {availableCredits}
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {!accessLoading && !hasCreditAccess && (
                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Upgrade your plan to continue
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Goal Planner requires an active plan and 10 credits per generation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/subscription")}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#4b3a9b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f3185]"
                  >
                    Upgrade Your Plan
                  </button>
                </div>
              )}

              {/* Generate */}
              <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Check
                    size={15}
                    className="text-emerald-500"
                  />

                  Your roadmap will be saved to
                  Reports
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={
                    !isFormValid ||
                    isGenerating ||
                    accessLoading ||
                    !hasCreditAccess
                  }
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f3185] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating Roadmap...
                    </>
                  ) : accessLoading ? (
                    "Checking credits..."
                  ) : !hasCreditAccess ? (
                    "Upgrade Your Plan"
                  ) : (
                    <>
                      <Sparkles size={17} />
                      Generate My Roadmap (10 Credits)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalPlanner;