import {

  ArrowLeft,

  ArrowRight,

  Check,

  FileText,

  Globe,

  Link as LinkIcon,

  Sparkles,

  Target,

  Video,

} from "lucide-react";

import {

  Link,

  useNavigate,

} from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";



type Platform =

  | "Instagram"

  | "LinkedIn"

  | "Facebook";



const platformFormats: Record<

  Platform,

  string[]

> = {

  Instagram: [

    "Reels / Short Videos",

    "Carousels",

    "Static Posts",

    "Stories",

    "Educational Content",

    "Promotional Content",

    "Personal / Behind the Scenes",

  ],



  LinkedIn: [

    "Text Posts",

    "Carousels / Documents",

    "Short Videos",

    "Educational Content",

    "Personal Stories",

    "Industry Insights",

    "Professional / Career Content",

  ],



  Facebook: [

    "Reels / Short Videos",

    "Image Posts",

    "Carousels",

    "Stories",

    "Educational Content",

    "Promotional Content",

    "Community Content",

  ],

};



const durationOptions = [

  "7 Days",

  "14 Days",

  "30 Days",

];



const goalOptions = [

  "Grow Followers",

  "Generate Leads",

  "Increase Engagement",

  "Build Personal Brand",

  "Increase Sales",

  "Brand Awareness",

];



function isValidUrl(

  value: string,

) {

  try {

    const url = new URL(value);



    return (

      url.protocol === "http:" ||

      url.protocol === "https:"

    );

  } catch {

    return false;

  }

}



function matchesPlatform(

  value: string,

  platform: Platform,

) {

  try {

    const hostname = new URL(

      value,

    )

      .hostname.toLowerCase()

      .replace(/^www\./, "");



    if (

      platform === "Instagram"

    ) {

      return (

        hostname ===

          "instagram.com" ||

        hostname.endsWith(

          ".instagram.com",

        )

      );

    }



    if (

      platform === "LinkedIn"

    ) {

      return (

        hostname ===

          "linkedin.com" ||

        hostname.endsWith(

          ".linkedin.com",

        )

      );

    }



    return (

      hostname ===

        "facebook.com" ||

      hostname.endsWith(

        ".facebook.com",

      ) ||

      hostname === "fb.com" ||

      hostname.endsWith(

        ".fb.com",

      )

    );

  } catch {

    return false;

  }

}



export default function ContentStrategy() {

  const navigate =

    useNavigate();



  const [profileUrl, setProfileUrl] =

    useState("");



  const [platform, setPlatform] =

    useState<Platform>("Instagram");



  const [duration, setDuration] =

    useState("");



  const [primaryGoal, setPrimaryGoal] =

    useState("");



  const [selectedFormats, setSelectedFormats] =

    useState<string[]>([]);



  const [websiteUrl, setWebsiteUrl] =

    useState("");



  const [additionalNotes, setAdditionalNotes] =

    useState("");



  const [isGenerating, setIsGenerating] =

    useState(false);



  const [errorMessage, setErrorMessage] =

    useState("");

  const [hasCreditAccess, setHasCreditAccess] = useState(false);
  const [checkingCreditAccess, setCheckingCreditAccess] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");




  const availableFormats =

    platformFormats[platform];

  useEffect(() => {
    let isMounted = true;

    const checkCreditAccess = async () => {
      setCheckingCreditAccess(true);
      const { data, error } = await supabase.rpc("get_credit_access");

      if (!isMounted) return;

      if (error) {
        console.error("Credit access check failed:", error);
        setHasCreditAccess(false);
        setAccessMessage(
          "We couldn't verify your plan. Please refresh or visit Subscription."
        );
      } else {
        const allowed = Boolean(data?.allowed);
        setHasCreditAccess(allowed);
        setAccessMessage(
          allowed
            ? ""
            : data?.reason === "INSUFFICIENT_CREDITS"
              ? "You have no credits remaining. Choose a plan to continue."
              : "Your Free Trial has expired or is not active. Activate an eligible plan to continue."
        );
      }

      setCheckingCreditAccess(false);
    };

    void checkCreditAccess();

    return () => {
      isMounted = false;
    };
  }, []);




  const toggleFormat = (

    format: string,

  ) => {

    setSelectedFormats(

      (current) =>

        current.includes(format)

          ? current.filter(

              (item) =>

                item !== format,

            )

          : [

              ...current,

              format,

            ],

    );

  };



  const handlePlatformChange = (

    value: Platform,

  ) => {

    setPlatform(value);



    setSelectedFormats([]);

    setErrorMessage("");

  };



  const validateForm = () => {

    if (!profileUrl.trim()) {

      return "Please enter your profile URL.";

    }



    if (!isValidUrl(profileUrl.trim())) {

      return "Please enter a valid profile URL.";

    }



    if (

      !matchesPlatform(

        profileUrl.trim(),

        platform,

      )

    ) {

      return `The profile URL does not appear to be a ${platform} URL.`;

    }



    if (!duration) {

      return "Please select a content duration.";

    }



    if (!primaryGoal) {

      return "Please select your primary goal.";

    }



    if (

      selectedFormats.length === 0

    ) {

      return "Please select at least one content format.";

    }



    if (

      websiteUrl.trim() &&

      !isValidUrl(

        websiteUrl.trim(),

      )

    ) {

      return "Please enter a valid website URL.";

    }



    return "";

  };



  const handleGenerateStrategy =

    async () => {

      const validationError =

        validateForm();



      if (validationError) {

        setErrorMessage(

          validationError,

        );



        return;

      }



      setIsGenerating(true);

      setErrorMessage("");try {
        const { data: accessData, error: accessError } =
          await supabase.rpc("get_credit_access");

        if (accessError) {
          console.error("Credit access check failed:", accessError);
          setHasCreditAccess(false);
          setErrorMessage(
            "Unable to verify your credits. Please try again or visit Subscription."
          );
          return;
        }

        if (!accessData?.allowed) {
          setHasCreditAccess(false);
          setAccessMessage(
            accessData?.reason === "INSUFFICIENT_CREDITS"
              ? "You have no credits remaining. Choose a plan to continue."
              : "Your Free Trial has expired or is not active. Activate an eligible plan to continue."
          );
          setErrorMessage(
            "Your plan does not currently allow content strategy generation. Please visit Subscription."
          );
          return;
        }

        setHasCreditAccess(true);
        setAccessMessage("");

        // Charge 10 credits for each Content Strategy generation.
        const { data: creditData, error: creditError } =
          await supabase.rpc("consume_feature_credits", {
            p_feature: "content-strategy",
          });

        if (creditError) {
          console.error("Content Strategy credit deduction failed:", creditError);
          setErrorMessage(
            "Unable to process the 10-credit charge. Please try again or contact support."
          );
          return;
        }

        if (!creditData?.allowed) {
          setHasCreditAccess(false);
          const reason = creditData?.reason;
          setAccessMessage(
            reason === "INSUFFICIENT_CREDITS"
              ? "You need at least 10 credits to generate a Content Strategy."
              : "Your Free Trial or subscription is not active. Please visit Subscription."
          );
          setErrorMessage(
            reason === "INSUFFICIENT_CREDITS"
              ? "Not enough credits. Content Strategy requires 10 credits."
              : "Your plan does not currently allow content strategy generation."
          );
          return;
        }

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



        const {

          data,

          error,

        } =

          await supabase.functions.invoke(

            "content-strategy",

            {

              body: {

                profileUrl:

                  profileUrl.trim(),



                platform,



                duration,



                primaryGoal,



                contentFormats:

                  selectedFormats,



                websiteUrl:

                  websiteUrl.trim(),



                additionalNotes:

                  additionalNotes.trim(),

              },

            },

          );



        if (error) {

          console.error(

            "Content Strategy Edge Function Error:",

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

                "Content Strategy Backend Response:",

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

          } catch (

            readError

          ) {

            console.error(

              "Unable to read Content Strategy backend error:",

              readError,

            );

          }



          setErrorMessage(

            backendMessage ||

              error.message ||

              "Content strategy generation failed.",

          );



          return;

        }



        if (

          !data?.success ||

          !data?.reportId

        ) {

          setErrorMessage(

            data?.error ||

              "Content strategy was not generated successfully.",

          );



          return;

        }



        console.log(

          "Content strategy generated successfully:",

          data,

        );



        navigate(

          `/content-strategy/report/${data.reportId}`,

        );

      } catch (error) {

        console.error(

          "Unexpected Content Strategy Error:",

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

    duration &&

    primaryGoal &&

    selectedFormats.length >

      0;



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

              <ArrowLeft

                size={18}

              />

            </Link>



            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4b3a9b] to-[#37277f] text-white shadow-sm">

              <Sparkles

                size={19}

              />

            </div>



            <div>

              <h1 className="text-base font-bold tracking-tight sm:text-lg">

                Content Strategy

              </h1>



              <p className="hidden text-xs text-slate-500 sm:block">

                Build a personalized content plan for your platform

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



        <section className="relative mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#241553] via-[#4b3a9b] to-[#5b4bb2] px-6 py-6 text-white shadow-lg sm:px-8">

          <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-purple-300/20 blur-3xl" />



          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-300/15 blur-3xl" />



          <div className="relative z-10 flex items-center justify-between gap-6">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-purple-100 backdrop-blur-md">

                <Sparkles

                  size={13}

                />

                AI-Powered Content Planning

              </div>



              <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">

                Turn your goals into a clear content strategy.

              </h2>



              <p className="mt-2 max-w-2xl text-xs leading-5 text-purple-100 sm:text-sm">

                Get content pillars, day-wise ideas, recommended posting times and an actionable execution plan.

              </p>

            </div>



            <div className="relative hidden h-24 w-36 shrink-0 md:block">

              <div className="absolute right-4 top-1/2 flex h-[68px] w-[68px] -translate-y-1/2 rotate-6 items-center justify-center rounded-[20px] bg-white/15 shadow-2xl backdrop-blur-md">

                <Video

                  size={29}

                  strokeWidth={1.8}

                />

              </div>



              <div className="absolute bottom-0 right-0 flex h-10 w-[68px] items-end gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-md">

                <span className="h-2.5 w-1.5 rounded-full bg-white/40" />

                <span className="h-4 w-1.5 rounded-full bg-white/55" />

                <span className="h-5 w-1.5 rounded-full bg-white/70" />

                <span className="h-7 w-1.5 rounded-full bg-white" />

              </div>

            </div>

          </div>

        </section>



        {/* CREDIT / PLAN ACCESS */}
        {checkingCreditAccess ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-violet-700" />
            Checking your plan access...
          </div>
        ) : !hasCreditAccess ? (
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-amber-900">Subscription required</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                {accessMessage || "Your plan does not currently allow this feature."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/subscription")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3f3185]"
            >
              Upgrade Your Plan
              <ArrowRight size={14} />
            </button>
          </div>
        ) : null}

        {/* MAIN LAYOUT */}



        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)\_320px]">

          {/* FORM */}



          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">

              <h3 className="text-lg font-bold text-slate-900">

                Build your strategy

              </h3>



              <p className="mt-1 text-xs text-slate-500">

                Tell GrowIQ what platform you want to grow and what you want your content to achieve.

              </p>

            </div>



            <div className="space-y-5">

              {/* PROFILE + PLATFORM */}



              <div className="grid gap-4 sm:grid-cols-2">

                {/* PROFILE URL */}



                <div>

                  <label

                    htmlFor="profile-url"

                    className="mb-1.5 block text-xs font-semibold text-slate-800"

                  >

                    Profile URL

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

                      id="profile-url"

                      type="url"

                      value={

                        profileUrl

                      }

                      onChange={(

                        event,

                      ) =>

                        setProfileUrl(

                          event.target

                            .value,

                        )

                      }

                      placeholder="https\://instagram.com/yourprofile"

                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"

                    />

                  </div>



                  <p className="mt-1.5 text-[10px] text-slate-400">

                    Instagram, LinkedIn or Facebook

                  </p>

                </div>



                {/* PLATFORM */}



                <div>

                  <label

                    htmlFor="platform"

                    className="mb-1.5 block text-xs font-semibold text-slate-800"

                  >

                    Platform

                    <span className="ml-1 text-red-500">

                      *

                    </span>

                  </label>



                  <select

                    id="platform"

                    value={platform}

                    onChange={(

                      event,

                    ) =>

                      handlePlatformChange(

                        event.target

                          .value as Platform,

                      )

                    }

                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"

                  >

                    <option value="Instagram">

                      Instagram

                    </option>



                    <option value="LinkedIn">

                      LinkedIn

                    </option>



                    <option value="Facebook">

                      Facebook

                    </option>

                  </select>

                </div>



                {/* DURATION */}



                <div>

                  <label

                    htmlFor="duration"

                    className="mb-1.5 block text-xs font-semibold text-slate-800"

                  >

                    Content Duration

                    <span className="ml-1 text-red-500">

                      *

                    </span>

                  </label>



                  <select

                    id="duration"

                    value={duration}

                    onChange={(

                      event,

                    ) =>

                      setDuration(

                        event.target

                          .value,

                      )

                    }

                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"

                  >

                    <option value="">

                      Select duration

                    </option>



                    {durationOptions.map(

                      (option) => (

                        <option

                          key={option}

                          value={

                            option

                          }

                        >

                          {option}

                        </option>

                      ),

                    )}

                  </select>

                </div>



                {/* GOAL */}



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

                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

                    />



                    <select

                      id="primary-goal"

                      value={

                        primaryGoal

                      }

                      onChange={(

                        event,

                      ) =>

                        setPrimaryGoal(

                          event.target

                            .value,

                        )

                      }

                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-10 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"

                    >

                      <option value="">

                        Select your primary goal

                      </option>



                      {goalOptions.map(

                        (goal) => (

                          <option

                            key={goal}

                            value={goal}

                          >

                            {goal}

                          </option>

                        ),

                      )}

                    </select>



                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">

                      ▾

                    </span>

                  </div>

                </div>

              </div>



              {/* CONTENT FORMATS */}



              <div className="border-t border-slate-100 pt-5">

                <div className="mb-3 flex items-center justify-between gap-3">

                  <div>

                    <label className="text-xs font-semibold text-slate-800">

                      Content Formats

                      <span className="ml-1 text-red-500">

                        *

                      </span>

                    </label>



                    <p className="mt-1 text-[10px] text-slate-400">

                      Select all formats you want included in your strategy.

                    </p>

                  </div>



                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">

                    {

                      selectedFormats.length

                    }{" "}

                    selected

                  </span>

                </div>



                <div className="grid gap-2 sm:grid-cols-2">

                  {availableFormats.map(

                    (format) => {

                      const isSelected =

                        selectedFormats.includes(

                          format,

                        );



                      return (

                        <button

                          key={format}

                          type="button"

                          onClick={() =>

                            toggleFormat(

                              format,

                            )

                          }

                          className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 text-left text-xs transition ${

                            isSelected

                              ? "border-violet-300 bg-violet-50 text-violet-800"

                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"

                          }`}

                        >

                          <span

                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${

                              isSelected

                                ? "border-violet-600 bg-violet-600 text-white"

                                : "border-slate-300 bg-white"

                            }`}

                          >

                            {isSelected && (

                              <Check

                                size={13}

                                strokeWidth={

                                  3

                                }

                              />

                            )}

                          </span>



                          <span className="font-medium">

                            {format}

                          </span>

                        </button>

                      );

                    },

                  )}

                </div>

              </div>



              {/* OPTIONAL */}



              <div className="border-t border-slate-100 pt-5">

                <div className="mb-4 flex items-center gap-2">

                  <h4 className="text-sm font-bold text-slate-900">

                    Additional Information

                  </h4>



                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">

                    Optional

                  </span>

                </div>



                {/* WEBSITE */}



                <div>

                  <label

                    htmlFor="website-url"

                    className="mb-1.5 block text-xs font-semibold text-slate-800"

                  >

                    Website URL

                  </label>



                  <div className="relative">

                    <Globe

                      size={16}

                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

                    />



                    <input

                      id="website-url"

                      type="url"

                      value={

                        websiteUrl

                      }

                      onChange={(

                        event,

                      ) =>

                        setWebsiteUrl(

                          event.target

                            .value,

                        )

                      }

                      placeholder="https\://yourwebsite.com"

                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"

                    />

                  </div>



                  <p className="mt-1.5 text-[10px] text-slate-400">

                    If accessible, GrowIQ can use your website information to make the strategy more relevant.

                  </p>

                </div>



                {/* NOTES */}



                <div className="mt-4">

                  <label

                    htmlFor="additional-notes"

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

                      id="additional-notes"

                      value={

                        additionalNotes

                      }

                      onChange={(

                        event,

                      ) =>

                        setAdditionalNotes(

                          event.target

                            .value,

                        )

                      }

                      rows={3}

                      placeholder="Tell us about your business, content challenge, offers, audience or anything specific you want the AI to consider..."

                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"

                    />

                  </div>

                </div>

              </div>



              {/* CTA */}



              <button

                type="button"

                onClick={

                  handleGenerateStrategy

                }

                disabled={
                  !isFormValid ||
                  isGenerating ||
                  checkingCreditAccess ||
                  !hasCreditAccess
                }

                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4b3a9b] px-5 text-xs font-semibold text-white shadow-md transition hover:bg-[#3f3185] disabled:cursor-not-allowed disabled:opacity-50"

              >

                {isGenerating ? (

                  <>

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />



                    Generating your strategy...

                  </>

                ) : (

                  <>

                    <Sparkles

                      size={16}

                    />



                    Generate Content Strategy

                  </>

                )}

              </button>



              {errorMessage && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-medium leading-5 text-red-600">

                  {errorMessage}

                </div>

              )}



              <p className="text-center text-[10px] leading-4 text-slate-400">

                Strategy recommendations are generated from the information and sources you provide.

              </p>

            </div>

          </section>



          {/* SIDEBAR */}



          <aside className="space-y-5">

            {/* HOW IT WORKS */}



            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">

                  <Sparkles

                    size={19}

                  />

                </div>



                <h3 className="text-base font-bold text-slate-900">

                  How it works

                </h3>

              </div>



              <div className="space-y-5">

                {[

                  [

                    "01",

                    "Choose your platform",

                    "Tell GrowIQ whether you want to plan for Instagram, LinkedIn or Facebook.",

                  ],

                  [

                    "02",

                    "Set your objective",

                    "Choose your goal, duration and preferred content formats.",

                  ],

                  [

                    "03",

                    "Get your strategy",

                    "Receive content pillars, day-wise ideas, posting times and an action plan.",

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

                        {

                          number

                        }

                      </div>



                      <div>

                        <p className="text-xs font-bold text-slate-800">

                          {title}

                        </p>



                        <p className="mt-1 text-[11px] leading-5 text-slate-500">

                          {

                            description

                          }

                        </p>

                      </div>

                    </div>

                  ),

                )}

              </div>

            </section>



            {/* REPORT COVERAGE */}



            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">

                  <Target

                    size={19}

                  />

                </div>



                <h3 className="text-base font-bold text-slate-900">

                  Your strategy will include

                </h3>

              </div>



              <div className="space-y-3">

                {[

                  "Strategy title",

                  "Objective summary",

                  "Recommended content pillars",

                  "Day-wise content plan",

                  "Recommended posting times",

                  "Action plan",

                ].map(

                  (item) => (

                    <div

                      key={item}

                      className="flex items-start gap-2 text-xs text-slate-600"

                    >

                      <Check

                        size={15}

                        className="mt-0.5 shrink-0 text-violet-600"

                        strokeWidth={

                          2.5

                        }

                      />



                      <span>

                        {item}

                      </span>

                    </div>

                  ),

                )}

              </div>

            </section>



            {/* WEBSITE TIP */}



            <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">

              <div className="flex gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">

                  <Globe

                    size={17}

                  />

                </div>



                <div>

                  <p className="text-xs font-bold text-violet-900">

                    Add your website

                  </p>



                  <p className="mt-1 text-[10px] leading-4 text-violet-700">

                    When available, website information can help make the content strategy more specific to your brand, services and offers.

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