import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SOCIALCRAWL_BASE_URL =
  "https://www.socialcrawl.dev/v1/linkedin";

const REQUESTY_URL =
  "https://router.requesty.ai/v1/chat/completions";

const REQUESTY_MODEL =
  "google/gemma-4-31b-it";

const jsonResponse = (
  body: unknown,
  status = 200,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function extractJson(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    return cleaned;
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("AI response did not contain valid JSON.");
}

function clampScore(value: unknown): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function sanitizeReport(
  value: unknown,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error("AI response is not a JSON object.");
  }

  const report = structuredClone(value) as Record<
    string,
    unknown
  >;

  report.overall_score = clampScore(report.overall_score);

  if (isRecord(report.sub_scores)) {
    for (const key of Object.keys(report.sub_scores)) {
      report.sub_scores[key] = clampScore(
        report.sub_scores[key],
      );
    }
  }

  return report;
}

async function fetchSocialCrawl(
  apiKey: string,
  path: string,
  url: string,
  extraParams: Record<string, string> = {},
) {
  const params = new URLSearchParams({
    url,
    ...extraParams,
  });

  const response = await fetch(
    `${SOCIALCRAWL_BASE_URL}${path}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    },
  );

  const text = await response.text();

  let payload: unknown = null;

  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `SocialCrawl request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  if (isRecord(payload) && payload.success === false) {
    throw new Error(
      "SocialCrawl could not fetch the LinkedIn profile.",
    );
  }

  return payload;
}

/**
 * Bounds the size of data saved or sent to the AI provider.
 * This avoids forwarding large image URLs and excessive nested data.
 */
function compactForAI(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 4) {
    return "[truncated]";
  }

  if (typeof value === "string") {
    return value.length > 1200
      ? `${value.slice(0, 1200)}…`
      : value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => compactForAI(item, depth + 1));
  }

  if (isRecord(value)) {
    const output: Record<string, unknown> = {};

    const entries = Object.entries(value)
      .filter(
        ([key]) =>
          !/(avatar|cover|banner|image|thumbnail|media_url|video_url|picture)/i.test(
            key,
          ),
      )
      .slice(0, 30);

    for (const [key, item] of entries) {
      output[key] = compactForAI(item, depth + 1);
    }

    return output;
  }

  return String(value);
}

function buildAiSnapshot(
  profileResponse: unknown,
  postsResponse: unknown,
) {
  const profileData =
    isRecord(profileResponse) &&
    isRecord(profileResponse.data)
      ? profileResponse.data
      : {};

  const postsData =
    isRecord(postsResponse) &&
    isRecord(postsResponse.data)
      ? postsResponse.data
      : {};

  const posts = Array.isArray(postsData.posts)
    ? postsData.posts
    : Array.isArray(postsData.items)
      ? postsData.items
      : Array.isArray(postsData.results)
        ? postsData.results
        : [];

  return {
    profile: compactForAI(profileData),
    recent_posts: compactForAI(posts.slice(0, 3)),
  };
}

function buildLinkedInSnapshot(
  profileResponse: unknown,
  postsResponse: unknown,
) {
  const profileData =
    isRecord(profileResponse) &&
    isRecord(profileResponse.data)
      ? profileResponse.data
      : {};

  const author = isRecord(profileData.author)
    ? profileData.author
    : {};

  const background = isRecord(profileData.background)
    ? profileData.background
    : {};

  const postsData =
    isRecord(postsResponse) &&
    isRecord(postsResponse.data)
      ? postsResponse.data
      : {};

  const posts = Array.isArray(postsData.posts)
    ? postsData.posts
    : Array.isArray(postsData.items)
      ? postsData.items
      : Array.isArray(postsData.results)
        ? postsData.results
        : [];

  return {
    author,
    background,
    sectionTotals: isRecord(profileData.section_totals)
      ? profileData.section_totals
      : null,
    similarProfiles: Array.isArray(profileData.similar_profiles)
      ? profileData.similar_profiles
      : [],
    posts,
    postsMeta: {
      totalReturned: posts.length,
    },
  };
}

const systemPrompt = `
You are GrowIQ AI's LinkedIn Career Profile Auditor.

Your job is to create a practical, evidence-based LinkedIn audit focused on the user's career goal.

REAL DATA RULES

GrowIQ has fetched public LinkedIn profile data through SocialCrawl and supplied it below.

The SocialCrawl data is the factual source of truth for profile claims.

Use only the supplied LinkedIn data for factual profile observations.

NEVER invent or estimate:
- follower counts
- connection/following counts
- years of experience
- job titles
- companies
- dates
- achievements
- education
- certifications
- skills
- recommendations
- featured items
- profile metrics
- post engagement
- posting frequency
- recruiter activity
- search appearances
- profile views

If a field is unavailable, say exactly:
"Data unavailable."

Missing information must NOT automatically be treated as a weakness.

Do not claim that the profile has no section merely because the API did not expose it.

The user's own inputs (current role, industry, career goal, target role, notes) may be used to make recommendations.

Do not present user-provided claims as independently verified facts.

SCORING RULES
- All scores must be integers from 0 to 100.
- Scores are analytical guidance, not platform-provided LinkedIn scores.
- Scores must be based on available evidence and the user's stated career objective.
- Do not invent metrics to justify a score.

IMPORTANT
- Do not claim direct access to LinkedIn.
- Do not claim to know recruiter search ranking, profile views, impressions, or algorithmic performance unless those exact fields are supplied.
- Do not infer employment quality, competence, seniority, or achievement from missing data.
- Keep recommendations specific to the supplied profile, role, industry and goal.
- For post/content analysis, use only the supplied posts.
- If there are no usable posts, state that content evidence is unavailable.

OUTPUT

Return ONLY valid JSON.
No Markdown.
No code fences.
No text outside JSON.

Use exactly this structure:

{
  "overall_score": 0,
  "sub_scores": {
    "career_positioning": 0,
    "profile_strength": 0,
    "recruiter_discoverability": 0,
    "professional_credibility": 0,
    "opportunity_conversion": 0
  },
  "executive_summary": "",
  "career_positioning": {
    "score": 0,
    "current_positioning": "",
    "goal_alignment": "",
    "recommendation": ""
  },
  "headline_audit": {
    "score": 0,
    "current_headline": "",
    "what_works": [""],
    "what_needs_improvement": [""],
    "recommended_headline": ""
  },
  "about_section_audit": {
    "score": 0,
    "observation": "",
    "what_works": [""],
    "what_needs_improvement": [""],
    "recommendation": ""
  },
  "experience_audit": {
    "score": 0,
    "observation": "",
    "what_works": [""],
    "what_needs_improvement": [""],
    "recommendation": ""
  },
  "skills_keywords": {
    "score": 0,
    "existing_skills": [""],
    "important_keywords": [""],
    "keyword_gaps": [""],
    "recommendation": ""
  },
  "featured_section": {
    "score": 0,
    "observation": "",
    "what_works": [""],
    "what_needs_improvement": [""],
    "recommendation": ""
  },
  "professional_credibility": {
    "score": 0,
    "observation": "",
    "evidence": [""],
    "gaps": [""],
    "recommendation": ""
  },
  "recruiter_discoverability": {
    "score": 0,
    "observation": "",
    "keyword_strategy": [""],
    "profile_signals": [""],
    "recommendation": ""
  },
  "career_conversion_funnel": {
    "profile_visit": "",
    "profile_understanding": "",
    "credibility": "",
    "cta_or_next_step": "",
    "opportunity": "",
    "lead_or_opportunity_conversion": ""
  },
  "content_professional_presence": {
    "score": 0,
    "observation": "",
    "content_patterns": [""],
    "recommended_content_pillars": [
      {
        "pillar": "",
        "purpose": "",
        "example_topics": [""]
      }
    ],
    "recommendation": ""
  },
  "career_gap_analysis": [
    {
      "gap": "",
      "evidence": "",
      "impact_on_goal": "",
      "action": "",
      "priority": "High"
    }
  ],
  "seven_day_priority_action_plan": [
    {
      "day": 1,
      "action": "",
      "reason": ""
    }
  ],
  "final_career_growth_blueprint": {
    "fix_first": [""],
    "build_next": [""],
    "then_optimize": [""],
    "next_audit": ""
  }
}
`;

async function callRequesty(
  apiKey: string,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  // Do not automatically repeat paid model calls; one attempt per user action.
  const MAX_ATTEMPTS = 1;

  const RETRYABLE_STATUS_CODES = new Set([
    408,
    429,
    500,
    502,
    503,
    504,
  ]);

  let lastStatus = 0;
  let lastProviderMessage = "";

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {
    let response: Response | null = null;

    try {
      response = await fetch(REQUESTY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: REQUESTY_MODEL,
          temperature: 0.2,
          // Gemma 4 is available on Requesty free tier. Keep output bounded.
          max_tokens: 6000,
          // Ask the provider for JSON output to reduce malformed/truncated prose.
          response_format: {
            type: "json_object",
          },
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
        }),
      });

      const rawText = await response.text();

      let payload: unknown = null;

      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }

      if (response.ok) {
        const firstChoice =
          isRecord(payload) &&
          Array.isArray(payload.choices) &&
          isRecord(payload.choices[0])
            ? payload.choices[0]
            : null;

        const message =
          firstChoice && isRecord(firstChoice.message)
            ? firstChoice.message
            : {};

        const content = message.content;
        const finishReason = firstChoice?.finish_reason ?? null;

        // Log response metadata only; never log profile data or model reasoning.
        console.log(
          "Requesty response diagnostics:",
          JSON.stringify({
            attempt,
            httpStatus: response.status,
            model: REQUESTY_MODEL,
            finishReason,
            hasContent:
              typeof content === "string" && content.trim().length > 0,
            contentLength:
              typeof content === "string" ? content.length : 0,
            hasReasoning:
              (typeof message.reasoning_content === "string" &&
                message.reasoning_content.length > 0) ||
              (typeof message.reasoning === "string" &&
                message.reasoning.length > 0),
            reasoningLength:
              typeof message.reasoning_content === "string"
                ? message.reasoning_content.length
                : typeof message.reasoning === "string"
                ? message.reasoning.length
                : 0,
            completionTokens:
              isRecord(payload) &&
              isRecord(payload.usage) &&
              typeof payload.usage.completion_tokens === "number"
                ? payload.usage.completion_tokens
                : null,
            provider:
              isRecord(payload) && typeof payload.provider === "string"
                ? payload.provider
                : null,
          }),
        );

        if (typeof content !== "string" || !content.trim()) {
          throw new Error(
            `Requesty returned no final content (finish_reason: ${String(finishReason ?? "unknown")}). ` +
              "Requesty returned no visible final answer. Check the logged response diagnostics before another manual attempt.",
          );
        }

        if (finishReason === "length") {
          throw new Error(
            "Requesty truncated the LinkedIn audit JSON at the output token limit. Reduce the report output or increase the provider-supported output limit.",
          );
        }

        try {
          return sanitizeReport(
            JSON.parse(extractJson(content)),
          );
        } catch (error) {
          console.error(
            "LinkedIn AI JSON parse error:",
            error,
          );

          console.error(
            "Requesty invalid LinkedIn JSON:",
            JSON.stringify({
              model: REQUESTY_MODEL,
              responseLength: content.length,
            }),
          );

          throw new Error(
            "AI returned an invalid LinkedIn audit report.",
          );
        }
      }

      const providerMessage =
        isRecord(payload) &&
        isRecord(payload.error) &&
        typeof payload.error.message === "string"
          ? payload.error.message
          : `Requesty request failed with HTTP ${response.status}.`;

      const providerDetails =
        isRecord(payload) && isRecord(payload.error)
          ? {
              code: payload.error.code ?? null,
              message: payload.error.message ?? null,
              metadata: payload.error.metadata ?? null,
            }
          : {
              raw: rawText.slice(0, 4000),
            };

      lastStatus = response.status;
      lastProviderMessage = providerMessage;

      console.error(
        "Requesty provider error:",
        JSON.stringify({
          attempt,
          maxAttempts: MAX_ATTEMPTS,
          httpStatus: response.status,
          statusText: response.statusText,
          model: REQUESTY_MODEL,
          details: providerDetails,
        }),
      );

      if (
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === MAX_ATTEMPTS
      ) {
        break;
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (
          error.message.startsWith(
            "AI returned an invalid LinkedIn audit report.",
          ) ||
          error.message.startsWith("Requesty returned no final content") ||
          error.message.startsWith("Requesty truncated the LinkedIn audit JSON")
        )
      ) {
        throw error;
      }

      lastProviderMessage =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "Requesty request error:",
        JSON.stringify({
          attempt,
          maxAttempts: MAX_ATTEMPTS,
          model: REQUESTY_MODEL,
          error: lastProviderMessage,
        }),
      );

      if (attempt === MAX_ATTEMPTS) {
        break;
      }
    }

    const delayMs = attempt * 1500;

    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  throw new Error(
    lastStatus
      ? `Requesty ${lastStatus}: ${
          lastProviderMessage || "Provider returned an error."
        }`
      : `Requesty request failed: ${
          lastProviderMessage || "Unknown provider error."
        }`,
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const socialCrawlApiKey = Deno.env.get(
    "SOCIALCRAWL_API_KEY",
  );
  const requestyApiKey = Deno.env.get(
    "REQUESTY_API_KEY",
  );

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey ||
    !socialCrawlApiKey ||
    !requestyApiKey
  ) {
    return jsonResponse(
      {
        error: "Required server configuration is missing.",
      },
      500,
    );
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(
      {
        error: "Unauthorized.",
      },
      401,
    );
  }

  const accessToken = authHeader
    .replace("Bearer ", "")
    .trim();

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse(
      {
        error: "Unauthorized.",
      },
      401,
    );
  }

  const user = userData.user;

  let body: Record<string, unknown>;

  try {
    const parsed = await request.json();

    if (!isRecord(parsed)) {
      return jsonResponse(
        {
          error: "Invalid request body.",
        },
        400,
      );
    }

    body = parsed;
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON request body.",
      },
      400,
    );
  }

  const profileUrl = normalizeText(body.profileUrl);
  const currentRole = normalizeText(body.currentRole);
  const industry = normalizeText(body.industry);
  const careerGoal = normalizeText(body.careerGoal);
  const targetRole = normalizeText(body.targetRole);
  const additionalNotes = normalizeText(body.additionalNotes);

  if (!profileUrl) {
    return jsonResponse(
      {
        error: "LinkedIn profile URL is required.",
      },
      400,
    );
  }

  let isValidLinkedInProfileUrl = false;

  try {
    const parsedProfileUrl = new URL(profileUrl);

    isValidLinkedInProfileUrl =
      (
        parsedProfileUrl.hostname === "linkedin.com" ||
        parsedProfileUrl.hostname === "www.linkedin.com"
      ) &&
      parsedProfileUrl.pathname.startsWith("/in/");
  } catch {
    isValidLinkedInProfileUrl = false;
  }

  if (!isValidLinkedInProfileUrl) {
    return jsonResponse(
      {
        error: "Please enter a valid LinkedIn profile URL.",
      },
      400,
    );
  }

  if (!currentRole) {
    return jsonResponse(
      {
        error: "Current job title / role is required.",
      },
      400,
    );
  }

  if (!industry) {
    return jsonResponse(
      {
        error: "Industry is required.",
      },
      400,
    );
  }

  if (!careerGoal) {
    return jsonResponse(
      {
        error: "Primary career goal is required.",
      },
      400,
    );
  }

  const {
    data: module,
    error: moduleError,
  } = await supabase
    .from("modules")
    .select("id, name, slug")
    .eq("slug", "linkedin-audit")
    .maybeSingle();

  if (moduleError || !module) {
    console.error(
      "LinkedIn module lookup error:",
      moduleError,
    );

    return jsonResponse(
      {
        error: "LinkedIn Audit module is not configured.",
      },
      500,
    );
  }

  const {
    data: report,
    error: reportError,
  } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      module_id: module.id,
      title: "LinkedIn Career Audit",
      description:
        `Personalized LinkedIn career profile analysis for ${currentRole}, focused on ${careerGoal.toLowerCase()}.`,
      input_data: {
        profileUrl,
        currentRole,
        industry,
        careerGoal,
        targetRole,
        additionalNotes,
        dataSource: "SocialCrawl",
        status: "fetching_linkedin_data",
      },
      result_data: {},
      status: "processing",
    })
    .select("id")
    .single();

  if (reportError || !report) {
    console.error(
      "LinkedIn report creation error:",
      reportError,
    );

    return jsonResponse(
      {
        error: "Unable to create LinkedIn audit report.",
      },
      500,
    );
  }

  try {
    // Keep SocialCrawl as the data provider.
    const profileResponse = await fetchSocialCrawl(
      socialCrawlApiKey,
      "/profile/all",
      profileUrl,
    );

    const profileData =
      isRecord(profileResponse) &&
      isRecord(profileResponse.data)
        ? profileResponse.data
        : null;

    if (!profileData) {
      throw new Error(
        "SocialCrawl returned no LinkedIn profile data.",
      );
    }

    let postsResponse: unknown = null;

    try {
      // Fetch fewer posts to reduce the function workload.
      postsResponse = await fetchSocialCrawl(
        socialCrawlApiKey,
        "/profile/posts",
        profileUrl,
        {
          limit: "3",
        },
      );
    } catch (error) {
      console.error(
        "LinkedIn posts fetch failed:",
        error,
      );

      postsResponse = {
        success: false,
        data: {
          posts: [],
        },
        error: "LinkedIn posts data unavailable.",
      };
    }

    const snapshot = buildLinkedInSnapshot(
      profileResponse,
      postsResponse,
    );

    const author = snapshot.author;

    const displayName =
      normalizeText(author.display_name) ||
      normalizeText(author.name) ||
      "LinkedIn user";

    // Store a compact snapshot instead of the complete raw payload.
    const updatedInputData = {
      profileUrl,
      currentRole,
      industry,
      careerGoal,
      targetRole,
      additionalNotes,
      dataSource: "SocialCrawl",
      fetchedAt: new Date().toISOString(),
      linkedinData: {
        profile: compactForAI(profileResponse),
        posts: compactForAI(postsResponse),
      },
    };

    const {
      error: inputUpdateError,
    } = await supabase
      .from("reports")
      .update({
        input_data: updatedInputData,
      })
      .eq("id", report.id)
      .eq("user_id", user.id);

    if (inputUpdateError) {
      throw new Error(
        `LinkedIn data was fetched but could not be saved: ${inputUpdateError.message}`,
      );
    }

    const aiSnapshot = buildAiSnapshot(
      profileResponse,
      postsResponse,
    );

    const userPrompt = `
USER CONTEXT

Current role: ${currentRole}
Industry: ${industry}
Primary career goal: ${careerGoal}
Target role: ${targetRole || "Not provided"}
Additional notes: ${additionalNotes || "Not provided"}

COMPACT LINKEDIN DATA FROM SOCIALCRAWL

${JSON.stringify(aiSnapshot)}

Create the LinkedIn audit using only the evidence above plus the user's stated context.
`;

    const aiReport = await callRequesty(
      requestyApiKey,
      userPrompt,
    );

    const {
      error: completedUpdateError,
    } = await supabase
      .from("reports")
      .update({
        status: "completed",
        result_data: aiReport,
      })
      .eq("id", report.id)
      .eq("user_id", user.id);

    if (completedUpdateError) {
      throw new Error(
        `LinkedIn report was generated but could not be saved: ${completedUpdateError.message}`,
      );
    }

    return jsonResponse({
      success: true,
      reportId: report.id,
      report: aiReport,
      profile: {
        displayName,
        followers: author.followers ?? null,
        following: author.following ?? null,
        headline: author.bio ?? null,
        location: author.location ?? null,
      },
      postsCount: snapshot.posts.length,
      dataSource: "SocialCrawl",
    });
  } catch (error) {
    console.error(
      "LinkedIn audit error:",
      error,
    );

    await supabase
      .from("reports")
      .update({
        status: "failed",
        result_data: {
          error:
            error instanceof Error
              ? error.message
              : "Unable to generate LinkedIn audit.",
        },
      })
      .eq("id", report.id)
      .eq("user_id", user.id);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate LinkedIn audit.",
        reportId: report.id,
      },
      502,
    );
  }
});