import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  type DragEvent,
  useEffect,
  useState,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import { supabase } from "../lib/supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfWorker;

type ResumeFileType =
  | "pdf"
  | "docx"
  | "txt";

function ResumeAnalyzer() {
  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [targetRole, setTargetRole] =
    useState("");

  const [jobDescription, setJobDescription] =
    useState("");

  const [resumeFile, setResumeFile] =
    useState<File | null>(null);

  const [resumeText, setResumeText] =
    useState("");

  const [resumeContent, setResumeContent] =
    useState("");

  const [fileType, setFileType] =
    useState<ResumeFileType | null>(
      null,
    );

  const [isDragging, setIsDragging] =
    useState(false);

  const [isExtracting, setIsExtracting] =
    useState(false);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [hasCreditAccess, setHasCreditAccess] =
    useState(false);

  const [availableCredits, setAvailableCredits] =
    useState(0);

  const [accessLoading, setAccessLoading] =
    useState(true);

  const [accessMessage, setAccessMessage] =
    useState("");

  const checkCreditAccess = async () => {
    setAccessLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "get_credit_access",
      );

      if (error) {
        throw error;
      }

      const allowed = Boolean(data?.allowed);
      const credits = Number(data?.credits ?? 0);

      setHasCreditAccess(allowed && credits >= 10);
      setAvailableCredits(credits);

      if (!allowed || credits < 10) {
        setAccessMessage(
          data?.reason ||
            (credits < 10
              ? "You need at least 10 credits to analyze your resume."
              : "Your trial has expired. Upgrade your plan to continue."),
        );
      } else {
        setAccessMessage("");
      }

      return allowed && credits >= 10;
    } catch (error) {
      console.error("Resume Analyzer credit access check failed:", error);
      setHasCreditAccess(false);
      setAccessMessage(
        "Unable to verify your credits right now. Please refresh and try again.",
      );
      return false;
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    void checkCreditAccess();
  }, []);

  /*
   * Extract text from PDF
   */
  const extractPdfText = async (
    file: File,
  ): Promise<string> => {
    const arrayBuffer =
      await file.arrayBuffer();

    const pdf =
      await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

    const pageTexts: string[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber += 1
    ) {
      const page =
        await pdf.getPage(
          pageNumber,
        );

      const textContent =
        await page.getTextContent();

      const pageText =
        textContent.items
          .map((item) => {
            if (
              "str" in item
            ) {
              return item.str;
            }

            return "";
          })
          .join(" ");

      pageTexts.push(
        pageText,
      );
    }

    return pageTexts
      .join("\n\n")
      .replace(
        /\n{3,}/g,
        "\n\n",
      )
      .trim();
  };

  /*
   * Extract text from DOCX
   */
  const extractDocxText = async (
    file: File,
  ): Promise<string> => {
    const arrayBuffer =
      await file.arrayBuffer();

    const result =
      await mammoth.extractRawText({
        arrayBuffer,
      });

    return result.value
      .replace(
        /\n{3,}/g,
        "\n\n",
      )
      .trim();
  };

  /*
   * Extract text from TXT
   */
  const extractTxtText = async (
    file: File,
  ): Promise<string> => {
    const text =
      await file.text();

    return text
      .replace(
        /\r\n/g,
        "\n",
      )
      .replace(
        /\n{3,}/g,
        "\n\n",
      )
      .trim();
  };

  /*
   * Detect file type
   */
  const getFileType = (
    file: File,
  ): ResumeFileType | null => {
    const fileName =
      file.name.toLowerCase();

    if (
      fileName.endsWith(".pdf") ||
      file.type ===
        "application/pdf"
    ) {
      return "pdf";
    }

    if (
      fileName.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "docx";
    }

    if (
      fileName.endsWith(".txt") ||
      file.type === "text/plain"
    ) {
      return "txt";
    }

    return null;
  };

  /*
   * Extract uploaded resume
   */
  const extractResumeFile = async (
    file: File,
  ) => {
    setErrorMessage("");
    setIsExtracting(true);

    try {
      const detectedType =
        getFileType(file);

      if (!detectedType) {
        throw new Error(
          "Please upload a PDF, DOCX or TXT resume.",
        );
      }

      let extractedText = "";

      if (
        detectedType === "pdf"
      ) {
        extractedText =
          await extractPdfText(
            file,
          );
      }

      if (
        detectedType === "docx"
      ) {
        extractedText =
          await extractDocxText(
            file,
          );
      }

      if (
        detectedType === "txt"
      ) {
        extractedText =
          await extractTxtText(
            file,
          );
      }

      if (
        !extractedText.trim()
      ) {
        throw new Error(
          "We couldn't extract readable text from this resume. Please try another file or paste the resume content manually.",
        );
      }

      if (
        extractedText.trim()
          .length < 100
      ) {
        throw new Error(
          "The extracted resume content is too short. Please upload a complete resume or paste the resume content manually.",
        );
      }

      setResumeFile(file);
      setFileType(detectedType);
      setResumeContent(
        extractedText,
      );
      setResumeText("");
    } catch (error) {
      console.error(
        "Resume extraction error:",
        error,
      );

      setResumeFile(null);
      setFileType(null);
      setResumeContent("");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to read this resume file. Please try again.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  /*
   * Handle file selection
   */
  const handleFileChange = (
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    setErrorMessage("");

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setErrorMessage(
        "Resume file must be smaller than 10 MB.",
      );
      return;
    }

    void extractResumeFile(
      file,
    );
  };

  /*
   * Drag & drop
   */
  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    handleFileChange(file);
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    if (!isExtracting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  /*
   * Remove uploaded resume
   */
  const removeFile = () => {
    setResumeFile(null);
    setFileType(null);
    setResumeContent("");
    setErrorMessage("");
  };

  /*
   * Handle pasted resume
   */
  const handleResumeTextChange = (
    value: string,
  ) => {
    setResumeText(value);
    setErrorMessage("");

    if (value.trim()) {
      setResumeFile(null);
      setFileType(null);
      setResumeContent(value);
    } else {
      setResumeContent("");
    }
  };

  /*
   * Final resume content
   */
  const finalResumeContent =
    resumeFile
      ? resumeContent.trim()
      : resumeText.trim();

  const isFormValid =
    name.trim().length > 0 &&
    targetRole.trim().length > 0 &&
    jobDescription.trim().length > 0 &&
    finalResumeContent.length >=
      100 &&
    !isExtracting &&
    !isGenerating;

  /*
   * Generate Resume Analysis
   */
  const handleAnalyzeResume =
    async () => {
      if (
        !name.trim() ||
        !targetRole.trim() ||
        !jobDescription.trim() ||
        finalResumeContent.length < 100
      ) {
        setErrorMessage(
          "Please complete all required fields and provide a complete resume.",
        );

        return;
      }

      setIsGenerating(true);
      setErrorMessage("");

      try {
        /*
         * Check current session
         */
        const {
          data: {
            session,
          },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !session
        ) {
          setErrorMessage(
            "Your session has expired. Please login again.",
          );

          return;
        }

        /*
         * Verify access and deduct 10 credits
         */
        const canAnalyze = await checkCreditAccess();

        if (!canAnalyze) {
          setErrorMessage(
            accessMessage ||
              "You need an active plan and at least 10 credits to analyze your resume.",
          );
          return;
        }

        const { data: debitData, error: debitError } =
          await supabase.rpc("consume_feature_credits", {
            p_feature: "resume-analyzer",
          });

        if (debitError) {
          console.error("Resume Analyzer credit deduction failed:", debitError);
          setErrorMessage(
            debitError.message ||
              "Unable to deduct credits. Please try again.",
          );
          return;
        }

        if (debitData?.success === false || debitData?.allowed === false) {
          setErrorMessage(
            debitData?.message ||
              debitData?.reason ||
              "You do not have enough credits. Please upgrade your plan.",
          );
          await checkCreditAccess();
          return;
        }

        setAvailableCredits((current) => Math.max(0, current - 10));
        await checkCreditAccess();

        /*
         * Call Edge Function
         */
        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            "resume-analyzer",
            {
              body: {
                name:
                  name.trim(),

                targetRole:
                  targetRole.trim(),

                jobDescription:
                  jobDescription.trim(),

                resumeContent:
                  finalResumeContent,
              },
            },
          );

        if (error) {
          console.error(
            "Resume Analyzer Edge Function Error:",
            error,
          );

          let backendMessage =
            "";

          try {
            const context =
              error.context;

            if (
              context instanceof Response
            ) {
              const responseText =
                await context.text();

              console.error(
                "Resume Analyzer Backend Response:",
                responseText,
              );

              if (
                responseText
              ) {
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
          } catch (
            readError
          ) {
            console.error(
              "Unable to read Resume Analyzer backend error:",
              readError,
            );
          }

          setErrorMessage(
            backendMessage ||
              error.message ||
              "Resume analysis failed. Please try again.",
          );

          return;
        }

        if (
          !data?.success ||
          !data?.reportId
        ) {
          setErrorMessage(
            data?.error ||
              "Resume analysis was not generated successfully.",
          );

          return;
        }

        console.log(
          "Resume analysis generated successfully:",
          data,
        );

        /*
         * Navigate to report
         */
        navigate(
          `/resume-analyzer/report/${data.reportId}`,
        );
      } catch (error) {
        console.error(
          "Unexpected Resume Analyzer Error:",
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

  const fileTypeLabel =
    fileType === "pdf"
      ? "PDF"
      : fileType === "docx"
        ? "DOCX"
        : fileType === "txt"
          ? "TXT"
          : "";

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4b3a9b] to-[#37277f] text-white shadow-sm">
              <FileText size={19} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                Resume Analyzer
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Optimize your resume for your target role
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
        {/* HERO */}

        <section className="relative mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#241553] via-[#4b3a9b] to-[#5b4bb2] px-6 py-5 text-white shadow-lg sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-purple-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-indigo-300/15 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-purple-100 backdrop-blur-md">
                <Sparkles
                  size={13}
                  className="text-purple-200"
                />

                AI-Powered Resume Analysis
              </div>

              <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Turn your resume into a stronger job application.
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-purple-100 sm:text-sm">
                Get an ATS-focused analysis tailored to the role you want.
              </p>
            </div>

            <div className="relative hidden h-24 w-36 shrink-0 md:block">
              <div className="absolute right-4 top-1/2 flex h-[68px] w-[68px] -translate-y-1/2 rotate-6 items-center justify-center rounded-[20px] bg-white/15 shadow-2xl backdrop-blur-md">
                <FileText
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
                className="absolute left-1 top-2 text-purple-200"
              />
            </div>
          </div>
        </section>

        {/* MAIN */}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* FORM */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Start your resume analysis
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Add your resume and the role you are applying for.
              </p>
            </div>

            <div className="space-y-5">
              {/* BASIC INFORMATION */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="resume-name"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <FileText
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="resume-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Vevial Varghese"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="target-role"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Target Role
                    <span className="ml-1 text-red-500">
                      *
                    </span>
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
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>
              </div>

              {/* JOB DESCRIPTION */}

              <div>
                <label
                  htmlFor="job-description"
                  className="mb-1.5 block text-xs font-semibold text-slate-800"
                >
                  Job Description
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) =>
                    setJobDescription(
                      event.target.value,
                    )
                  }
                  rows={7}
                  placeholder="Paste the job description you are applying for..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />

                <p className="mt-1.5 text-[10px] text-slate-400">
                  The AI will compare your resume against this job description.
                </p>
              </div>

              {/* RESUME */}

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800">
                      Your Resume
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Upload a file or paste your resume content.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    PDF / DOCX / TXT
                  </span>
                </div>

                {!resumeFile && (
                  <div
                    onDragOver={
                      handleDragOver
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                      isDragging
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40"
                    }`}
                  >
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <Upload size={19} />
                    </div>

                    {isExtracting ? (
                      <>
                        <p className="mt-3 text-xs font-semibold text-slate-800">
                          Reading your resume...
                        </p>

                        <div className="mx-auto mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-600" />
                        </div>

                        <p className="mt-2 text-[10px] text-slate-400">
                          Extracting resume content
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-xs font-semibold text-slate-800">
                          Drag & drop your resume here
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          PDF, DOCX or TXT • Maximum 10 MB
                        </p>

                        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                          <Upload size={14} />

                          Choose Resume

                          <input
                            type="file"
                            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            onChange={(
                              event,
                            ) => {
                              handleFileChange(
                                event
                                  .target
                                  .files?.[0],
                              );

                              event.currentTarget.value =
                                "";
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}

                {resumeFile && (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                        <FileText size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {resumeFile.name}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {fileTypeLabel} •{" "}
                          {(
                            resumeFile.size /
                            1024 /
                            1024
                          ).toFixed(
                            2,
                          )}{" "}
                          MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          removeFile
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove resume"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2">
                      <CheckCircle2
                        size={14}
                        className="shrink-0 text-emerald-600"
                      />

                      <p className="text-[10px] font-medium text-emerald-700">
                        Resume content extracted successfully •{" "}
                        {resumeContent.length.toLocaleString()}{" "}
                        characters
                      </p>
                    </div>
                  </div>
                )}

                {!resumeFile && (
                  <>
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />

                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Or paste resume
                      </span>

                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <textarea
                      value={resumeText}
                      onChange={(event) =>
                        handleResumeTextChange(
                          event.target.value,
                        )
                      }
                      rows={8}
                      placeholder="Paste your complete resume content here..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />

                    {resumeText.trim() && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-600">
                        <CheckCircle2 size={13} />

                        {resumeText.length.toLocaleString()}{" "}
                        characters ready for analysis
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* CREDIT ACCESS */}
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-violet-900">
                      Resume analysis cost: 10 credits
                    </p>
                    <p className="mt-1 text-[11px] text-violet-700">
                      {accessLoading
                        ? "Checking your credits..."
                        : `${availableCredits} credits available`}
                    </p>
                  </div>

                  {!accessLoading && !hasCreditAccess && (
                    <button
                      type="button"
                      onClick={() => navigate("/subscription")}
                      className="rounded-lg bg-violet-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-violet-800"
                    >
                      Upgrade Your Plan
                    </button>
                  )}
                </div>

                {!accessLoading && !hasCreditAccess && accessMessage && (
                  <p className="mt-2 text-[11px] leading-4 text-red-600">
                    {accessMessage}
                  </p>
                )}
              </div>

              {/* ERROR */}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-600">
                  {errorMessage}
                </div>
              )}

              {/* CTA */}

              <button
                type="button"
                onClick={
                  handleAnalyzeResume
                }
                disabled={
                  !isFormValid ||
                  accessLoading ||
                  !hasCreditAccess ||
                  availableCredits < 10
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white shadow-md transition hover:bg-[#3f3185] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Analyzing your resume...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />

                    Analyze My Resume (10 Credits)
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-400">
                Your resume will be analyzed against the job requirements you provide.
              </p>
            </div>
          </section>

          {/* SIDEBAR */}

          <aside className="space-y-5">
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
                    "Add your resume",
                    "Upload your resume or paste the content directly.",
                  ],
                  [
                    "02",
                    "Add target role",
                    "Tell GrowIQ which role you are applying for and provide the job description.",
                  ],
                  [
                    "03",
                    "Get your analysis",
                    "Receive your ATS score, gaps and actionable improvements.",
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

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <CheckCircle2 size={19} />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Your AI analysis will cover
                </h3>
              </div>

              <div className="grid gap-3">
                {[
                  "Overall ATS score",
                  "Resume strengths",
                  "Missing keywords",
                  "Job description alignment",
                  "What needs to be fixed",
                  "Actionable suggestions",
                  "Resume improvement opportunities",
                  "Improved resume option",
                ].map(
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

            <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                  <BriefcaseBusiness size={17} />
                </div>

                <div>
                  <p className="text-xs font-bold text-violet-900">
                    Pro tip
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-violet-700">
                    Use the actual job description you are applying to for a more relevant ATS analysis.
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

export default ResumeAnalyzer;