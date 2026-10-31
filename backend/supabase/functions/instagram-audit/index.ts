import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REQUESTY_URL =
  "https://router.requesty.ai/v1/chat/completions";

const REQUESTY_MODEL =
  "google/gemma-4-31b-it";

const SOCIALCRAWL_URL =
  "https://www.socialcrawl.dev/v1/instagram";

type AuditInput = {
  profileUrl: string;
  name: string;
  niche: string;
};

function jsonResponse(
  data: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanAIResponse(content: string): string {
  let cleaned = content.trim();

  // Remove markdown code fences if the model adds them.
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  cleaned = cleaned.trim();

  /*
   * Sometimes models return a little text before/after JSON.
   * Extract the outermost JSON object when possible.
   */
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.slice(
      firstBrace,
      lastBrace + 1,
    );
  }

  return cleaned.trim();
}

function isValidScore(value: unknown): boolean {
  const score = Number(value);

  return (
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100
  );
}

function extractInstagramHandle(
  value: string,
): string {
  const input = value.trim();

  if (!input) {
    return "";
  }

  // Accept either a username or an Instagram profile URL.
  if (
    !input.includes("/") &&
    !input.includes(".")
  ) {
    return input.replace(/^@/, "").trim();
  }

  try {
    const url = new URL(
      input.startsWith("http")
        ? input
        : `https://${input}`,
    );

    const hostname =
      url.hostname.toLowerCase();

    if (
      hostname !== "instagram.com" &&
      hostname !== "www.instagram.com" &&
      hostname !== "instagr.am" &&
      hostname !== "www.instagr.am"
    ) {
      return "";
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    if (!parts.length) {
      return "";
    }

    const blockedPaths = new Set([
      "p",
      "reel",
      "reels",
      "stories",
      "explore",
      "accounts",
      "direct",
      "about",
    ]);

    const handle = parts[0].replace(/^@/, "").trim();

    if (blockedPaths.has(handle.toLowerCase())) {
      return "";
    }

    return handle;
  } catch {
    return "";
  }
}

async function fetchSocialCrawlProfile(
  apiKey: string,
  handle: string,
): Promise<Record<string, unknown>> {
  const url =
    `${SOCIALCRAWL_URL}/profile/full` +
    `?handle=${encodeURIComponent(handle)}` +
    `&posts=12`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json",
    },
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "SocialCrawl returned an invalid JSON response.",
    );
  }

  if (
    !response.ok ||
    !isRecord(data) ||
    data.success !== true
  ) {
    console.error(
      "SocialCrawl response error:",
      data,
    );

    throw new Error(
      "Unable to fetch Instagram profile data from SocialCrawl.",
    );
  }

  return data;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function buildInstagramAuditData(
  socialCrawlResponse: Record<string, unknown>,
): Record<string, unknown> {
  const data = isRecord(
    socialCrawlResponse.data,
  )
    ? socialCrawlResponse.data
    : {};

  const profile = isRecord(
    data.profile,
  )
    ? data.profile
    : {};

  const computed = isRecord(
    data.computed,
  )
    ? data.computed
    : {};

  const posts = Array.isArray(
    data.posts,
  )
    ? data.posts
    : [];

  return {
    profile,
    computed,
    posts,
    posts_count_fetched: posts.length,
  };
}

Deno.serve(async (req) => {
  /*
   * CORS
   */
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  /*
   * Only POST is allowed.
   */
  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }

  try {
    /*
     * ---------------------------------------------------------
     * ENVIRONMENT
     * ---------------------------------------------------------
     */

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const requestyApiKey =
      Deno.env.get("REQUESTY_API_KEY");

    const socialCrawlApiKey =
      Deno.env.get("SOCIALCRAWL_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing Supabase environment variables.",
      );

      return jsonResponse(
        {
          error:
            "Supabase environment configuration is missing.",
        },
        500,
      );
    }

    if (!requestyApiKey) {
      console.error(
        "Missing REQUESTY_API_KEY secret.",
      );

      return jsonResponse(
        {
          error:
            "AI service configuration is missing.",
        },
        500,
      );
    }

    if (!socialCrawlApiKey) {
      console.error(
        "Missing SOCIALCRAWL_API_KEY secret.",
      );

      return jsonResponse(
        {
          error:
            "Instagram data service configuration is missing.",
        },
        500,
      );
    }

    /*
     * ---------------------------------------------------------
     * AUTHENTICATION
     * ---------------------------------------------------------
     */

    const authHeader =
      req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          error: "Authentication required.",
        },
        401,
      );
    }

    const accessToken = authHeader
      .replace("Bearer ", "")
      .trim();

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    const {
      data: {
        user,
      },
      error: userError,
    } = await supabase.auth.getUser(
      accessToken,
    );

    if (userError || !user) {
      console.error(
        "Authentication error:",
        userError,
      );

      return jsonResponse(
        {
          error:
            "Invalid or expired session. Please login again.",
        },
        401,
      );
    }

    /*
     * ---------------------------------------------------------
     * REQUEST BODY
     * ---------------------------------------------------------
     */

    let body: AuditInput;

    try {
      body = (await req.json()) as AuditInput;
    } catch {
      return jsonResponse(
        {
          error: "Invalid request body.",
        },
        400,
      );
    }

    const profileUrl =
      body.profileUrl?.trim() || "";

    const name =
      body.name?.trim() || "";

    const niche =
      body.niche?.trim() || "";

    /*
     * Required fields
     */
    if (
      !profileUrl ||
      !name ||
      !niche
    ) {
      return jsonResponse(
        {
          error:
            "Profile URL, name and niche are required.",
        },
        400,
      );
    }

    /*
     * ---------------------------------------------------------
     * MODULE
     * ---------------------------------------------------------
     */

    const {
      data: module,
      error: moduleError,
    } = await supabase
      .from("modules")
      .select(
        "id, name, slug, is_active",
      )
      .eq("slug", "instagram-audit")
      .maybeSingle();

    if (moduleError) {
      console.error(
        "Module lookup error:",
        moduleError,
      );

      return jsonResponse(
        {
          error:
            "Unable to load Instagram Audit module.",
        },
        500,
      );
    }

    if (!module) {
      return jsonResponse(
        {
          error:
            "Instagram Audit module is not configured.",
        },
        404,
      );
    }

    if (!module.is_active) {
      return jsonResponse(
        {
          error:
            "Instagram Audit is currently unavailable.",
        },
        403,
      );
    }

    /*
     * ---------------------------------------------------------
     * CREATE REPORT
     * ---------------------------------------------------------
     */

    const {
      data: report,
      error: reportError,
    } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        module_id: module.id,
        title: `Instagram Audit - ${name}`,
        description: `Real-data Instagram growth audit for ${name}, in the ${niche} niche.`,
        input_data: {
          profileUrl,
          name,
          niche,
        },
        status: "processing",
      })
      .select("id")
      .single();

    if (reportError || !report) {
      console.error(
        "Report creation error:",
        reportError,
      );

      return jsonResponse(
        {
          error:
            "Unable to create audit report.",
        },
        500,
      );
    }

    /*
     * ---------------------------------------------------------
     * FETCH REAL INSTAGRAM DATA
     * ---------------------------------------------------------
     */

    const instagramHandle =
      extractInstagramHandle(profileUrl);

    if (!instagramHandle) {
      await supabase
        .from("reports")
        .update({
          status: "failed",
          result_data: {
            error:
              "Invalid Instagram profile URL or username.",
          },
        })
        .eq("id", report.id)
        .eq("user_id", user.id);

      return jsonResponse(
        {
          error:
            "Please enter a valid Instagram profile URL or username.",
          reportId: report.id,
        },
        400,
      );
    }

    let socialCrawlProfile: Record<string, unknown>;
    let instagramAuditData: Record<string, unknown>;

    try {
      socialCrawlProfile =
        await fetchSocialCrawlProfile(
          socialCrawlApiKey,
          instagramHandle,
        );

      instagramAuditData =
        buildInstagramAuditData(
          socialCrawlProfile,
        );

      const profile = isRecord(
        instagramAuditData.profile,
      )
        ? instagramAuditData.profile
        : {};

      const computed = isRecord(
        instagramAuditData.computed,
      )
        ? instagramAuditData.computed
        : {};

      console.log(
        "SocialCrawl Instagram data fetched:",
        {
          handle: instagramHandle,
          followers: profile.followers ?? null,
          following: profile.following ?? null,
          postsCount: profile.posts_count ?? null,
          averageEngagementRate:
            computed.avg_engagement_rate ?? null,
          postsPerWeek:
            computed.posts_per_week ?? null,
          fetchedPosts:
            instagramAuditData.posts_count_fetched ?? 0,
        },
      );
    } catch (error) {
      console.error(
        "SocialCrawl profile fetch failed:",
        error,
      );

      await supabase
        .from("reports")
        .update({
          status: "failed",
          result_data: {
            error:
              "Unable to fetch real Instagram profile data.",
          },
        })
        .eq("id", report.id)
        .eq("user_id", user.id);

      return jsonResponse(
        {
          error:
            "We could not fetch this Instagram profile. Please check the username/profile link and try again.",
          reportId: report.id,
        },
        502,
      );
    }

    /*
     * ---------------------------------------------------------
     * SAVE FETCHED DATA SNAPSHOT
     * ---------------------------------------------------------
     */

    const updatedInputData = {
      profileUrl,
      instagramHandle,
      name,
      niche,
      dataSource: "SocialCrawl",
      instagramData: {
        success: socialCrawlProfile.success,
        platform: socialCrawlProfile.platform,
        endpoint: socialCrawlProfile.endpoint,
        data: socialCrawlProfile.data,
      },
    };

    const { error: inputUpdateError } =
      await supabase
        .from("reports")
        .update({
          input_data: updatedInputData,
        })
        .eq("id", report.id)
        .eq("user_id", user.id);

    if (inputUpdateError) {
      console.error(
        "Fetched Instagram data save error:",
        inputUpdateError,
      );

      await supabase
        .from("reports")
        .update({
          status: "failed",
          result_data: {
            error:
              "Instagram data was fetched but could not be saved.",
          },
        })
        .eq("id", report.id)
        .eq("user_id", user.id);

      return jsonResponse(
        {
          error:
            "Instagram data was fetched but could not be saved.",
          reportId: report.id,
        },
        500,
      );
    }

    /*
     * ---------------------------------------------------------
     * AI SYSTEM PROMPT
     * ---------------------------------------------------------
     */

    const systemPrompt = `
You are GrowIQ AI's Instagram Growth Auditor.

Your job is to create a structured, practical, evidence-based Instagram growth audit.

REAL DATA RULES:

GrowIQ has fetched public Instagram data through SocialCrawl and supplied it below.
The supplied SocialCrawl data is the factual source for profile, posting and computed analytics claims.

NEVER invent or estimate:
- follower counts
- following counts
- post counts
- likes
- comments
- views
- engagement rates
- posting frequency
- profile information
- content performance
- competitor metrics

Every numerical claim in the audit must be supported by the supplied SocialCrawl data.
If a metric is not present, write:

"Data unavailable."

Do NOT treat missing data as a confirmed weakness.

Use the actual profile data to evaluate:
- profile positioning
- display name
- bio
- profile completeness
- audience size
- posting activity
- posting cadence
- engagement
- content format mix
- top-performing content when available
- conversion readiness

Use the actual recent posts to identify patterns in content and performance when the supplied post data supports it.

No competitor data is collected in this audit. Set competitor_gap.available to false and do not invent competitor findings. For competitor-related audit fields, clearly state that competitor data is unavailable.

SCORING RULES:
- Every score must be between 0 and 100.
- Scores must be based on available evidence.
- Missing metrics must not automatically reduce a score.
- Overall score must reflect actual profile and content evidence, not fabricated assumptions.

The user's niche must influence the recommendations.

Return ONLY valid JSON.
Do not use Markdown.
Do not use code fences.
Do not add explanations outside JSON.

Use this exact JSON structure:

{
  "overall_score": 0,
  "sub_scores": {
    "profile": 0,
    "content": 0,
    "conversion": 0
  },
  "executive_summary": "",
  "whats_working": [""],
  "what_needs_improvement": [
    {
      "category": "",
      "score": 0,
      "observation": "",
      "whats_good": "",
      "problem": "",
      "recommendation": "",
      "priority": "High"
    }
  ],
  "detailed_audit": {
    "profile_positioning": {"score": 0,"observation": "","recommendation": ""},
    "profile_photo_logo": {"score": 0,"observation": "","recommendation": ""},
    "username_name": {"score": 0,"observation": "","recommendation": ""},
    "bio": {"score": 0,"observation": "","recommendation": ""},
    "cta": {"score": 0,"observation": "","recommendation": ""},
    "link": {"score": 0,"observation": "","recommendation": ""},
    "highlights": {"score": 0,"observation": "","recommendation": ""},
    "content_quality": {"score": 0,"observation": "","recommendation": ""},
    "content_strategy": {"score": 0,"observation": "","recommendation": ""},
    "engagement": {"score": 0,"observation": "","recommendation": ""},
    "reach_views": {"score": 0,"observation": "","recommendation": ""},
    "instagram_seo": {"score": 0,"observation": "","recommendation": ""},
    "competitor_comparison": {"score": 0,"observation": "","recommendation": ""},
    "conversion_journey": {"score": 0,"observation": "","recommendation": ""}
  },
  "content_strategy": {
    "recommended_content_mix": [""],
    "content_pillars": [
      {"pillar": "","purpose": "","suggested_percentage": 0}
    ]
  },
  "competitor_gap": {
    "available": false,
    "observation": "",
    "gaps": []
  },
  "conversion_funnel": [
    {"stage": "Profile Visit","recommendation": ""},
    {"stage": "Profile Understanding","recommendation": ""},
    {"stage": "Content Trust","recommendation": ""},
    {"stage": "CTA","recommendation": ""},
    {"stage": "DM / WhatsApp / Booking","recommendation": ""},
    {"stage": "Lead","recommendation": ""}
  ],
  "seven_day_action_plan": [
    {"day": 1,"action": "","reason": ""},
    {"day": 2,"action": "","reason": ""},
    {"day": 3,"action": "","reason": ""},
    {"day": 4,"action": "","reason": ""},
    {"day": 5,"action": "","reason": ""},
    {"day": 6,"action": "","reason": ""},
    {"day": 7,"action": "","reason": ""}
  ],
  "growth_blueprint": {
    "fix_first": [],
    "build_next": [],
    "optimize_later": [],
    "next_audit": ""
  }
}
`;

    /*
     * ---------------------------------------------------------
     * USER PROMPT
     * ---------------------------------------------------------
     */

    const userPrompt = `
Create an Instagram growth audit using the verified data below.

USER / BRAND:
${name}

CATEGORY / NICHE:
${niche}

INSTAGRAM HANDLE:
${instagramHandle}

VERIFIED SOCIALCRAWL INSTAGRAM DATA:
${JSON.stringify(
  instagramAuditData,
  null,
  2,
)}

COMPETITOR DATA:
Data unavailable. This audit does not collect competitor profile data.

IMPORTANT:

Use the SocialCrawl data above as the factual source.

Do not claim to have access to any information that is not present in the supplied data.
Do not invent missing metrics.

When the data contains a metric such as followers, following, posts_count, likes_count, posts_per_week or avg_engagement_rate, you may use that actual value in the report.

If a requested audit area cannot be supported by the supplied data, explicitly say:
"Data unavailable."

Tailor the audit to the user's niche.
Make recommendations specific, practical and actionable.
`;

    /*
     * ---------------------------------------------------------
     * REQUESTY REQUEST
     * ---------------------------------------------------------
     */

    const requestyPayload = {
      model: REQUESTY_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
      // Keep the response budget bounded for the free Gemma model.
      max_tokens: 6000,
    };

    let requestyResponse: Response | null =
      null;

    let lastProviderError = "";

    // One provider call only: avoid consuming extra free-tier requests on retries.
    const MAX_ATTEMPTS = 1;

    /*
     * Retry the provider request once if it fails.
     */
    for (
      let attempt = 1;
      attempt <= MAX_ATTEMPTS;
      attempt++
    ) {
      try {
        requestyResponse = await fetch(
          REQUESTY_URL,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${requestyApiKey}`,
            },

            body: JSON.stringify(
              requestyPayload,
            ),
          },
        );

        if (requestyResponse.ok) {
          break;
        }

        const errorText =
          await requestyResponse.text();

        lastProviderError =
          errorText;

        console.error(
          `Requesty attempt ${attempt} failed:`,
          requestyResponse.status,
          errorText,
        );

        if (
          attempt <
          MAX_ATTEMPTS
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1500,
              ),
          );
        }
      } catch (requestError) {
        lastProviderError =
          requestError instanceof Error
            ? requestError.message
            : String(requestError);

        console.error(
          `Requesty attempt ${attempt} request error:`,
          requestError,
        );

        if (
          attempt <
          MAX_ATTEMPTS
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1500,
              ),
          );
        }
      }
    }

    /*
     * ---------------------------------------------------------
     * PROVIDER FAILURE
     * ---------------------------------------------------------
     */

    if (!requestyResponse?.ok) {
      console.error(
        "Requesty final failure:",
        {
          status:
            requestyResponse?.status ??
            null,

          error:
            lastProviderError,
        },
      );

      await supabase
        .from("reports")
        .update({
          status: "failed",

          result_data: {
            error:
              "AI provider request failed.",

            provider:
              "Requesty",

            provider_status:
              requestyResponse?.status ??
              null,
          },
        })
        .eq(
          "id",
          report.id,
        )
        .eq(
          "user_id",
          user.id,
        );

      return jsonResponse(
        {
          error:
            "AI provider is temporarily unavailable. Please try again in a moment.",
        },
        502,
      );
    }

    /*
     * ---------------------------------------------------------
     * READ REQUESTY RESPONSE
     * ---------------------------------------------------------
     */

    let aiResponse: Record<
      string,
      unknown
    >;

    try {
      aiResponse =
        await requestyResponse.json();
    } catch (parseError) {
      console.error(
        "Requesty response JSON parse error:",
        parseError,
      );

      await supabase
        .from("reports")
        .update({
          status: "failed",

          result_data: {
            error:
              "Invalid response from AI provider.",
          },
        })
        .eq(
          "id",
          report.id,
        )
        .eq(
          "user_id",
          user.id,
        );

      return jsonResponse(
        {
          error:
            "AI provider returned an invalid response.",
        },
        502,
      );
    }

    /*
     * ---------------------------------------------------------
     * EXTRACT AI CONTENT
     * ---------------------------------------------------------
     */

    const choices =
      Array.isArray(
        aiResponse.choices,
      )
        ? aiResponse.choices
        : [];

    const firstChoice =
      choices[0] as
        | Record<
            string,
            unknown
          >
        | undefined;

    const message =
      firstChoice?.message as
        | Record<
            string,
            unknown
          >
        | undefined;

    const finishReason =
      typeof firstChoice?.finish_reason === "string"
        ? firstChoice.finish_reason
        : "unknown";

    const rawContent =
      typeof message?.content === "string"
        ? message.content.trim()
        : "";

    if (!rawContent) {
      // Do not log the complete provider response: it can contain profile data
      // or private reasoning. Log only safe diagnostic metadata.
      console.error("Requesty returned no usable content:", {
        finishReason,
        hasReasoningContent:
          typeof message?.reasoning_content === "string" &&
          message.reasoning_content.length > 0,
        reasoningLength:
          typeof message?.reasoning_content === "string"
            ? message.reasoning_content.length
            : 0,
        promptTokens:
          isRecord(aiResponse.usage) &&
          typeof aiResponse.usage.prompt_tokens === "number"
            ? aiResponse.usage.prompt_tokens
            : null,
        completionTokens:
          isRecord(aiResponse.usage) &&
          typeof aiResponse.usage.completion_tokens === "number"
            ? aiResponse.usage.completion_tokens
            : null,
      });

      const emptyContentMessage =
        finishReason === "length"
          ? "AI output was truncated by the token limit. Please retry; if this continues, reduce the audit prompt or use a model with a larger output limit."
          : "AI provider returned no usable content.";

      await supabase
        .from("reports")
        .update({
          status: "failed",
          result_data: {
            error: emptyContentMessage,
            provider: "Requesty",
            finish_reason: finishReason,
          },
        })
        .eq("id", report.id)
        .eq("user_id", user.id);

      return jsonResponse(
        {
          error: emptyContentMessage,
          reportId: report.id,
        },
        502,
      );
    }

    if (finishReason === "length") {
      console.warn("Requesty response may be truncated:", {
        finishReason,
        contentLength: rawContent.length,
      });
    }

    /*
     * ---------------------------------------------------------
     * PARSE AUDIT JSON
     * ---------------------------------------------------------
     */

    let auditResult: Record<
      string,
      unknown
    >;

    try {
      const cleanedContent =
        cleanAIResponse(
          rawContent,
        );

      auditResult =
        JSON.parse(
          cleanedContent,
        );
    } catch (parseError) {
      console.error(
        "AI JSON parsing failed:",
        parseError,
      );

      console.error(
        "Raw AI content:",
        rawContent,
      );

      await supabase
        .from("reports")
        .update({
          status: "failed",

          result_data: {
            error:
              "AI returned malformed audit JSON.",
          },
        })
        .eq(
          "id",
          report.id,
        )
        .eq(
          "user_id",
          user.id,
        );

      return jsonResponse(
        {
          error:
            "AI returned an invalid audit format. Please try again.",
        },
        502,
      );
    }

    /*
     * ---------------------------------------------------------
     * BASIC RESULT VALIDATION
     * ---------------------------------------------------------
     */

    if (
      !isValidScore(
        auditResult.overall_score,
      )
    ) {
      console.error(
        "Invalid overall score:",
        auditResult.overall_score,
      );

      await supabase
        .from("reports")
        .update({
          status: "failed",

          result_data: {
            error:
              "AI returned an invalid audit score.",
          },
        })
        .eq(
          "id",
          report.id,
        )
        .eq(
          "user_id",
          user.id,
        );

      return jsonResponse(
        {
          error:
            "AI returned an invalid audit result. Please try again.",
        },
        502,
      );
    }

    /*
     * ---------------------------------------------------------
     * SAVE COMPLETED REPORT
     * ---------------------------------------------------------
     */

    const {
      error: updateError,
    } = await supabase
      .from("reports")
      .update({
        status: "completed",

        result_data:
          auditResult,
      })
      .eq(
        "id",
        report.id,
      )
      .eq(
        "user_id",
        user.id,
      );

    if (updateError) {
      console.error(
        "Report update error:",
        updateError,
      );

      return jsonResponse(
        {
          error:
            "Audit was generated but could not be saved.",
          reportId:
            report.id,
        },
        500,
      );
    }

    /*
     * ---------------------------------------------------------
     * SUCCESS
     * ---------------------------------------------------------
     */

    return jsonResponse({
      success: true,

      reportId:
        report.id,

      result:
        auditResult,
    });
  } catch (error) {
    console.error(
      "Instagram Audit Edge Function error:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Something went wrong while generating the Instagram audit.",
      },
      500,
    );
  }
});