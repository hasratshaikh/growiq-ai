import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const REQUESTY_URL =
  "https://router.requesty.ai/v1/chat/completions";

const REQUESTY_MODEL =
  "google/gemma-4-31b-it";

const MAX_RESUME_LENGTH = 30000;
const MAX_JOB_DESCRIPTION_LENGTH = 20000;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function cleanJsonResponse(
  content: string,
) {
  let cleaned = content.trim();

  if (
    cleaned.startsWith("```json")
  ) {
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "");
  } else if (
    cleaned.startsWith("```")
  ) {
    cleaned = cleaned
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
  }

  return cleaned.trim();
}

function isValidScore(
  value: unknown,
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAuditSection(
  value: unknown,
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return {
      score: null,
      strengths: [],
      problems: [],
      recommendations: [],
    };
  }

  const section =
    value as Record<
      string,
      unknown
    >;

  return {
    score: isValidScore(
      section.score,
    )
      ? section.score
      : null,

    strengths:
      normalizeStringArray(
        section.strengths,
      ),

    problems:
      normalizeStringArray(
        section.problems,
      ),

    recommendations:
      normalizeStringArray(
        section.recommendations,
      ),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      },
    );
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error:
          "Method not allowed.",
      },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get(
      "SUPABASE_URL",
    );

  const supabaseAnonKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    );

  const requestyApiKey =
    Deno.env.get(
      "REQUESTY_API_KEY",
    );

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    console.error(
      "Missing Supabase environment variables.",
    );

    return jsonResponse(
      {
        error:
          "Server configuration error.",
      },
      500,
    );
  }

  if (!requestyApiKey) {
    console.error(
      "Missing REQUESTY_API_KEY.",
    );

    return jsonResponse(
      {
        error:
          "AI provider is not configured.",
      },
      500,
    );
  }

  /*
   * Authenticate user
   */
  const authorization =
    req.headers.get(
      "Authorization",
    );

  if (!authorization) {
    return jsonResponse(
      {
        error:
          "Authentication required.",
      },
      401,
    );
  }

  const supabase =
    createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization:
              authorization,
          },
        },
      },
    );

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
    console.error(
      "Auth error:",
      userError,
    );

    return jsonResponse(
      {
        error:
          "Invalid or expired session.",
      },
      401,
    );
  }

  /*
   * Parse request
   */
  let body: Record<
    string,
    unknown
  >;

  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      {
        error:
          "Invalid request body.",
      },
      400,
    );
  }

  const name =
    typeof body.name ===
    "string"
      ? body.name.trim()
      : "";

  const targetRole =
    typeof body.targetRole ===
    "string"
      ? body.targetRole.trim()
      : "";

  const jobDescription =
    typeof body.jobDescription ===
    "string"
      ? body.jobDescription.trim()
      : "";

  const resumeContent =
    typeof body.resumeContent ===
    "string"
      ? body.resumeContent.trim()
      : "";

  /*
   * Validate input
   */
  if (
    !name ||
    !targetRole ||
    !jobDescription ||
    !resumeContent
  ) {
    return jsonResponse(
      {
        error:
          "Name, target role, job description and resume content are required.",
      },
      400,
    );
  }

  if (
    resumeContent.length >
    MAX_RESUME_LENGTH
  ) {
    return jsonResponse(
      {
        error:
          "Resume content is too long. Please upload a resume under 30,000 characters.",
      },
      400,
    );
  }

  if (
    jobDescription.length >
    MAX_JOB_DESCRIPTION_LENGTH
  ) {
    return jsonResponse(
      {
        error:
          "Job description is too long. Please provide a shorter job description.",
      },
      400,
    );
  }

  if (
    resumeContent.length < 100
  ) {
    return jsonResponse(
      {
        error:
          "Resume content is too short. Please provide a complete resume.",
      },
      400,
    );
  }

  /*
   * Find Resume Analyzer module
   */
  const {
    data: module,
    error: moduleError,
  } =
    await supabase
      .from("modules")
      .select("id, slug, name")
      .eq(
        "slug",
        "resume-analyzer",
      )
      .maybeSingle();

  if (
    moduleError ||
    !module
  ) {
    console.error(
      "Resume Analyzer module lookup failed:",
      moduleError,
    );

    return jsonResponse(
      {
        error:
          "Resume Analyzer module is not configured.",
      },
      500,
    );
  }

  /*
   * Create processing report
   */
  const { data: report, error: reportError } =
    await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        module_id: module.id,
        title: `Resume Analysis - ${targetRole}`,
        input_data: {
          name,
          targetRole,
          jobDescription,
          resumeLength:
            resumeContent.length,
        },
        result_data: null,
        status: "processing",
      })
      .select("id")
      .single();

  if (
    reportError ||
    !report
  ) {
    console.error(
      "Report creation failed:",
      reportError,
    );

    return jsonResponse(
      {
        error:
          "Unable to create resume analysis report.",
      },
      500,
    );
  }

  /*
   * AI instructions
   */
  const systemPrompt = `
You are GrowIQ AI's professional Resume Analyzer.

Your job is to analyze a user's resume against a target job role and the supplied job description.

IMPORTANT RULES:

1. Analyze ONLY the resume content and job description provided.
2. Never invent experience, skills, achievements, education, certifications, employers, metrics or projects.
3. Never claim that you accessed LinkedIn, the employer website, ATS software, external databases or the internet.
4. Do not assume information that is not present.
5. If something cannot be determined from the provided resume, explicitly say it is unavailable.
6. ATS score must be an analytical estimate based only on the provided resume and job description. Do not present it as an actual score from an employer's ATS.
7. Identify missing keywords only when they are actually present in the job description and absent or insufficiently represented in the resume.
8. Do not recommend adding a skill unless the user appears to have evidence for it in the resume. If a job requirement is missing from the resume, say it should only be added if the candidate genuinely has that experience.
9. Preserve factual accuracy.
10. Improved resume content must only rewrite or reorganize information already present in the original resume. Never create fake achievements or experience.
11. Create a COMPLETE, polished, recruiter-ready resume tailored to the supplied target role and job description, not merely suggestions or sample snippets.
12. Preserve the candidate's real name, phone, email, location, LinkedIn, portfolio, employers, job titles, dates, education, certifications and project details exactly as supplied. If a detail is absent, leave it blank or omit it; never invent contact details or dates.
13. Reorder and rewrite existing experience bullets to emphasize the most relevant verified work. Use concise action-led bullets and measurable results ONLY when the original resume provides those numbers.
14. Match wording and keywords from the job description naturally, but include a skill or tool only when supported by the original resume. Put unsupported job requirements in a separate "skills_to_confirm" list, never in the ready-to-use resume.
15. Keep the resume ATS-friendly: single-column structure, standard section headings, plain text, no tables, icons, graphics, rating bars or columns. Use consistent date formatting and concise professional language.
16. Include all relevant original work experience, education, certifications and projects; do not silently drop material facts. Prioritize relevance by ordering, not by fabricating or deleting.
17. The "final_resume_text" must be a complete standalone resume that the user can use directly after reviewing personal details. Do not include commentary, placeholders, advice, markdown fences or notes inside the resume text. Leave unavailable fields blank rather than inserting fake placeholders.
18. Keep recommendations practical and specific.
19. Return ONLY valid JSON. No markdown. No explanation outside JSON.

The JSON must follow this exact structure:

{
  "ats_score": 0,
  "score_breakdown": {
    "keyword_match": 0,
    "job_alignment": 0,
    "experience_relevance": 0,
    "skills_match": 0,
    "resume_structure": 0
  },
  "executive_summary": "",
  "whats_good": [],
  "missing_keywords": [],
  "job_alignment": {
    "score": 0,
    "strengths": [],
    "gaps": [],
    "recommendations": []
  },
  "experience_analysis": {
    "score": 0,
    "strengths": [],
    "problems": [],
    "recommendations": []
  },
  "skills_analysis": {
    "score": 0,
    "strengths": [],
    "missing_or_weak": [],
    "recommendations": []
  },
  "formatting_analysis": {
    "score": 0,
    "strengths": [],
    "problems": [],
    "recommendations": []
  },
  "keyword_analysis": {
    "score": 0,
    "matched_keywords": [],
    "missing_keywords": [],
    "recommendations": []
  },
  "priority_fixes": [
    {
      "priority": "High",
      "issue": "",
      "why_it_matters": "",
      "recommendation": ""
    }
  ],
  "action_plan": [
    {
      "priority": 1,
      "action": "",
      "reason": ""
    }
  ],
  "improved_resume": {
    "available": true,
    "notice": "",
    "candidate_name": "",
    "contact_details": {
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": "",
      "portfolio": ""
    },
    "target_headline": "",
    "professional_summary": "",
    "experience": [
      {
        "company": "",
        "role": "",
        "dates": "",
        "location": "",
        "bullets": []
      }
    ],
    "projects": [
      {
        "name": "",
        "dates": "",
        "bullets": [],
        "technologies": []
      }
    ],
    "skills": [],
    "education": [
      {
        "qualification": "",
        "institution": "",
        "dates": "",
        "details": ""
      }
    ],
    "certifications": [],
    "additional_sections": [],
    "skills_to_confirm": [],
    "final_resume_text": ""
  },
  "final_recommendation": ""
}

Scoring:
- All scores must be integers from 0 to 100.
- ats_score is your overall estimated match score.
- Do not make the score artificially high.
- Base every score on evidence from the supplied inputs.
`;

  const userPrompt = `
Analyze this resume for the target role.

CANDIDATE NAME:
${name}

TARGET ROLE:
${targetRole}

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeContent}
`;

  const requestyPayload = {
    model:
      REQUESTY_MODEL,

    messages: [
      {
        role: "system",
        content:
          systemPrompt,
      },
      {
        role: "user",
        content:
          userPrompt,
      },
    ],

    response_format: {
      type: "json_object",
    },

    temperature: 0.2,

    max_tokens: 6000,
  };

  /*
   * Single Requesty request: avoid duplicate free-tier API usage.
   */
  let requestyResponse:
    | Response
    | null = null;

  let lastRequestyError =
    "";

  const MAX_ATTEMPTS = 1;

  for (
    let attempt = 1;
    attempt <=
      MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      requestyResponse =
        await fetch(
          REQUESTY_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${requestyApiKey}`,

            },

            body: JSON.stringify(
              requestyPayload,
            ),
          },
        );

      if (
        requestyResponse.ok
      ) {
        break;
      }

      const errorText =
        await requestyResponse.text();

      lastRequestyError =
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
      lastRequestyError =
        requestError instanceof Error
          ? requestError.message
          : String(
              requestError,
            );

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
   * Provider failure
   */
  if (
    !requestyResponse?.ok
  ) {
    console.error(
      "Requesty final failure:",
      lastRequestyError,
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
        reportId:
          report.id,
      },
      502,
    );
  }

  /*
   * Parse Requesty response
   */
  let providerJson:
    | Record<
        string,
        unknown
      >
    | null = null;

  try {
    providerJson =
      await requestyResponse.json();
  } catch (parseError) {
    console.error(
      "Unable to parse Requesty response:",
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
        reportId:
          report.id,
      },
      502,
    );
  }

  const choices =
    providerJson?.choices;

  if (
    !Array.isArray(
      choices,
    ) ||
    !choices[0]
  ) {
    console.error(
      "Requesty returned no choices:",
      providerJson,
    );

    await supabase
      .from("reports")
      .update({
        status: "failed",
        result_data: {
          error:
            "AI provider returned no analysis.",
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
          "AI provider returned no analysis.",
        reportId:
          report.id,
      },
      502,
    );
  }

  const firstChoice =
    choices[0] as Record<
      string,
      unknown
    >;

  const message =
    firstChoice.message as
      | Record<
          string,
          unknown
        >
      | undefined;

  const rawContent =
    typeof message?.content ===
    "string"
      ? message.content
      : "";

  if (!rawContent) {
    console.error(
      "Requesty response did not contain message content.",
      providerJson,
    );

    await supabase
      .from("reports")
      .update({
        status: "failed",
        result_data: {
          error:
            "AI provider returned an empty analysis.",
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
          "AI provider returned an empty analysis.",
        reportId:
          report.id,
      },
      502,
    );
  }

  /*
   * Parse structured AI JSON
   */
  let aiResult:
    | Record<
        string,
        unknown
      >
    | null = null;

  try {
    const cleanedContent =
      cleanJsonResponse(
        rawContent,
      );

    aiResult =
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
            "AI returned invalid structured data.",
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
          "AI returned an invalid analysis. Please try again.",
        reportId:
          report.id,
      },
      502,
    );
  }

  /*
   * Validate main score
   */
  if (
    !isValidScore(
      aiResult.ats_score,
    )
  ) {
    console.error(
      "Invalid ATS score:",
      aiResult,
    );

    await supabase
      .from("reports")
      .update({
        status: "failed",
        result_data: {
          error:
            "AI returned an invalid ATS score.",
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
          "AI returned an invalid analysis. Please try again.",
        reportId:
          report.id,
      },
      502,
    );
  }

  /*
   * Normalize result
   */
  const scoreBreakdown =
    aiResult.score_breakdown &&
    typeof aiResult.score_breakdown ===
      "object"
      ? aiResult.score_breakdown
      : {};

  const normalizedResult = {
    ats_score:
      aiResult.ats_score,

    score_breakdown:
      scoreBreakdown,

    executive_summary:
      typeof aiResult.executive_summary ===
      "string"
        ? aiResult.executive_summary
        : "",

    whats_good:
      normalizeStringArray(
        aiResult.whats_good,
      ),

    missing_keywords:
      normalizeStringArray(
        aiResult.missing_keywords,
      ),

    job_alignment:
      normalizeAuditSection(
        aiResult.job_alignment,
      ),

    experience_analysis:
      normalizeAuditSection(
        aiResult.experience_analysis,
      ),

    skills_analysis:
      normalizeAuditSection(
        aiResult.skills_analysis,
      ),

    formatting_analysis:
      normalizeAuditSection(
        aiResult.formatting_analysis,
      ),

    keyword_analysis:
      normalizeAuditSection(
        aiResult.keyword_analysis,
      ),

    priority_fixes:
      Array.isArray(
        aiResult.priority_fixes,
      )
        ? aiResult.priority_fixes
        : [],

    action_plan:
      Array.isArray(
        aiResult.action_plan,
      )
        ? aiResult.action_plan
        : [],

    improved_resume:
      aiResult.improved_resume &&
      typeof aiResult.improved_resume ===
        "object"
        ? aiResult.improved_resume
        : {
            available: false,
            notice:
              "Improved resume could not be generated.",
          },

    final_recommendation:
      typeof aiResult.final_recommendation ===
      "string"
        ? aiResult.final_recommendation
        : "",
  };

  /*
   * Save completed report
   */
  const {
    error: updateError,
  } =
    await supabase
      .from("reports")
      .update({
        status: "completed",
        result_data:
          normalizedResult,
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
      "Report update failed:",
      updateError,
    );

    return jsonResponse(
      {
        error:
          "Analysis was generated but could not be saved.",
        reportId:
          report.id,
      },
      500,
    );
  }

  return jsonResponse({
    success: true,
    reportId:
      report.id,
    result:
      normalizedResult,
  });
});