import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const qualificationOptions = [
  "10th",
  "12th",
  "Diploma",
  "Graduation",
  "Post Graduation",
  "Doctorate / PhD",
  "Other",
];

function jsonResponse(
  body: unknown,
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

async function failReport(
  supabase: ReturnType<typeof createClient>,
  reportId: string | null,
  message: string,
) {
  if (reportId) {
    await supabase
      .from("reports")
      .update({
        status: "failed",
        result_data: {
          error: message,
        },
      })
      .eq("id", reportId);
  }

  return jsonResponse(
    {
      error: message,
    },
    500,
  );
}

function isString(
  value: unknown,
): value is string {
  return typeof value === "string";
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string",
    )
  );
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateResult(
  result: unknown,
): result is Record<string, unknown> {
  if (!isObject(result)) {
    return false;
  }

  const requiredStringFields = [
    "title",
    "goal_summary",
    "current_position",
    "target_position",
  ];

  for (const field of requiredStringFields) {
    if (!isString(result[field])) {
      return false;
    }
  }

  if (
    !isObject(result.gap_analysis) ||
    !isStringArray(
      result.gap_analysis.education_gap,
    ) ||
    !isStringArray(
      result.gap_analysis.skills_to_develop,
    ) ||
    !isStringArray(
      result.gap_analysis.experience_gap,
    ) ||
    !isStringArray(
      result.gap_analysis.portfolio_gap,
    ) ||
    !isStringArray(
      result.gap_analysis.networking_gap,
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      result.skills_to_learn,
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      result.career_roadmap,
    )
  ) {
    return false;
  }

  if (
    !isObject(result.action_plan) ||
    !isStringArray(
      result.action_plan.daily,
    ) ||
    !isStringArray(
      result.action_plan.weekly,
    ) ||
    !isStringArray(
      result.action_plan.monthly,
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      result.projects_to_build,
    )
  ) {
    return false;
  }

  if (
    !isStringArray(
      result.career_strategy,
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      result.thirty_day_plan,
    )
  ) {
    return false;
  }

  if (
    !isStringArray(
      result.success_indicators,
    )
  ) {
    return false;
  }

  if (
    !isObject(
      result.final_growth_blueprint,
    ) ||
    !isStringArray(
      result.final_growth_blueprint
        .focus_now,
    ) ||
    !isStringArray(
      result.final_growth_blueprint
        .build_next,
    ) ||
    !isStringArray(
      result.final_growth_blueprint
        .execute_next,
    ) ||
    !isStringArray(
      result.final_growth_blueprint
        .optimize,
    ) ||
    !isString(
      result.final_growth_blueprint
        .next_milestone,
    )
  ) {
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
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
    Deno.env.get("SUPABASE_URL");

  const supabaseServiceKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  const requestyApiKey =
    Deno.env.get(
      "REQUESTY_API_KEY",
    );

  if (
    !supabaseUrl ||
    !supabaseServiceKey ||
    !requestyApiKey
  ) {
    return jsonResponse(
      {
        error:
          "Server configuration is incomplete.",
      },
      500,
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
  );

  let reportId: string | null =
    null;

  try {
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

    const token =
      authorization.replace(
        "Bearer ",
        "",
      );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(
      token,
    );

    if (authError || !user) {
      return jsonResponse(
        {
          error:
            "Invalid authentication.",
        },
        401,
      );
    }

    const body =
      await req.json();

    const name = body?.name;
    const targetRole =
      body?.targetRole;
    const industry =
      body?.industry;
    const highestQualification =
      body?.highestQualification;
    const countryCity =
      body?.countryCity;
    const targetTimeline =
      body?.targetTimeline;
    const primaryGoal =
      body?.primaryGoal;
    const additionalNotes =
      body?.additionalNotes ?? "";

    if (
      !isString(name) ||
      !name.trim()
    ) {
      return jsonResponse(
        {
          error:
            "Name is required.",
        },
        400,
      );
    }

    if (
      !isString(targetRole) ||
      !targetRole.trim()
    ) {
      return jsonResponse(
        {
          error:
            "Target Role / Identity is required.",
        },
        400,
      );
    }

    if (
      !isString(industry) ||
      !industry.trim()
    ) {
      return jsonResponse(
        {
          error:
            "Industry is required.",
        },
        400,
      );
    }

    if (
      !isString(
        highestQualification,
      ) ||
      !qualificationOptions.includes(
        highestQualification,
      )
    ) {
      return jsonResponse(
        {
          error:
            "Please select a valid highest qualification.",
        },
        400,
      );
    }

    if (
      !isString(countryCity) ||
      !countryCity.trim()
    ) {
      return jsonResponse(
        {
          error:
            "Country / City is required.",
        },
        400,
      );
    }

    if (
      !isString(targetTimeline) ||
      !timelineOptions.includes(
        targetTimeline,
      )
    ) {
      return jsonResponse(
        {
          error:
            "Please select a valid target timeline.",
        },
        400,
      );
    }

    if (
      !isString(primaryGoal) ||
      !goalOptions.includes(
        primaryGoal,
      )
    ) {
      return jsonResponse(
        {
          error:
            "Please select a valid primary goal.",
        },
        400,
      );
    }

    if (
      !isString(additionalNotes)
    ) {
      return jsonResponse(
        {
          error:
            "Additional Notes must be text.",
        },
        400,
      );
    }

    /* ============================================
       FIND GOAL PLANNER MODULE
       ============================================ */

    const {
      data: module,
      error: moduleError,
    } = await supabase
      .from("modules")
      .select(
        "id, name, slug",
      )
      .eq(
        "slug",
        "goal-planner",
      )
      .maybeSingle();

    if (moduleError) {
      throw moduleError;
    }

    if (!module) {
      return jsonResponse(
        {
          error:
            "Goal Planner module is not configured.",
        },
        500,
      );
    }

    /* ============================================
       INPUT DATA
       ============================================ */

    const inputData = {
      name: name.trim(),
      targetRole:
        targetRole.trim(),
      industry:
        industry.trim(),
      highestQualification:
        highestQualification.trim(),
      countryCity:
        countryCity.trim(),
      targetTimeline:
        targetTimeline.trim(),
      primaryGoal:
        primaryGoal.trim(),
      additionalNotes:
        additionalNotes.trim(),
    };

    /* ============================================
       REPORT TITLE + DESCRIPTION
       ============================================ */

    const reportTitle =
      `${targetRole.trim()} Career Roadmap`;

    const reportDescription =
      `Personalized career roadmap for ${primaryGoal.toLowerCase()} in ${industry.trim()}, based on your ${highestQualification.trim()} qualification and ${targetTimeline.trim()} target timeline.`;

    /* ============================================
       CREATE PROCESSING REPORT
       ============================================ */

    const {
      data: report,
      error: reportError,
    } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        module_id: module.id,
        title: reportTitle,
        description:
          reportDescription,
        input_data: inputData,
        result_data: {},
        status: "processing",
      })
      .select(
        "id, title, description, status",
      )
      .single();

    if (reportError) {
      throw reportError;
    }

    reportId = report.id;

    /* ============================================
       AI SYSTEM PROMPT
       ============================================ */

    const systemPrompt = `
You are GrowIQ AI, a professional career growth consultant.

Your task is to create a personalized and practical career roadmap based ONLY on the information provided by the user.

IMPORTANT RULES:

1. The user has NOT provided their current skills.
2. Never invent or assume their current skills.
3. You may recommend skills they should develop based on their target role.
4. Use the user's highest qualification, target role, industry, location, timeline and primary goal.
5. Do not invent work experience, achievements, certifications, salary, companies, employers or personal history.
6. Do not guarantee employment, promotion, income or business success.
7. Keep recommendations realistic and actionable.
8. The roadmap should match the user's selected timeline.
9. Consider the user's location when relevant, but do not invent local market data.
10. If information is unavailable, clearly identify the gap instead of making it up.
11. Prioritize practical execution over generic motivational advice.
12. Return ONLY valid JSON.
`;

    /* ============================================
       AI USER PROMPT
       ============================================ */

    const userPrompt = `
Create a complete career growth roadmap using this information:

Name:
${name.trim()}

Target Role / Identity:
${targetRole.trim()}

Industry:
${industry.trim()}

Highest Qualification:
${highestQualification.trim()}

Country / City:
${countryCity.trim()}

Target Timeline:
${targetTimeline.trim()}

Primary Goal:
${primaryGoal.trim()}

Additional Notes:
${
  additionalNotes.trim() ||
  "None provided"
}

The response must contain:

1. Goal summary
2. Current position
3. Target position
4. Gap analysis
5. Skills to learn
6. Career roadmap
7. Daily, weekly and monthly action plan
8. Projects to build
9. Career strategy
10. 30-day execution plan
11. Success indicators
12. Final growth blueprint

Return this exact JSON structure:

{
  "title": "",
  "goal_summary": "",
  "current_position": "",
  "target_position": "",
  "gap_analysis": {
    "education_gap": [],
    "skills_to_develop": [],
    "experience_gap": [],
    "portfolio_gap": [],
    "networking_gap": []
  },
  "skills_to_learn": [
    {
      "skill": "",
      "priority": "High",
      "why_it_matters": "",
      "learning_direction": ""
    }
  ],
  "career_roadmap": [
    {
      "phase": "",
      "timeline": "",
      "focus": "",
      "actions": [],
      "milestones": []
    }
  ],
  "action_plan": {
    "daily": [],
    "weekly": [],
    "monthly": []
  },
  "projects_to_build": [
    {
      "project": "",
      "purpose": "",
      "suggested_output": ""
    }
  ],
  "career_strategy": [],
  "thirty_day_plan": [
    {
      "week": "Week 1",
      "focus": "",
      "actions": [],
      "expected_progress": ""
    }
  ],
  "success_indicators": [],
  "final_growth_blueprint": {
    "focus_now": [],
    "build_next": [],
    "execute_next": [],
    "optimize": [],
    "next_milestone": ""
  }
}
`;

    /* ============================================
       REQUESTY REQUEST
       ============================================ */

    let aiResponse: Response | null =
      null;

    for (
      let attempt = 1;
      attempt <= 1;
      attempt++
    ) {
      aiResponse = await fetch(
        REQUESTY_URL,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${requestyApiKey}`,
            "Content-Type":
              "application/json",
            "HTTP-Referer":
              supabaseUrl,
            "X-Title":
              "GrowIQ AI",
          },
          body: JSON.stringify({
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
            temperature: 0.3,
            max_tokens: 6000,
            chat_template_kwargs: {
              enable_thinking: false,
            },
            response_format: {
              type: "json_object",
            },
          }),
        },
      );

      if (aiResponse.ok) {
        break;
      }

      if (attempt < 1) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000 * attempt,
            ),
        );
      }
    }

    /* ============================================
       REQUESTY ERROR
       ============================================ */

    if (!aiResponse?.ok) {
      const errorText =
        await aiResponse?.text();

      throw new Error(
        `Requesty request failed: ${
          errorText ||
          "Unknown error"
        }`,
      );
    }

    /* ============================================
       READ AI RESPONSE
       ============================================ */

    const aiData =
      await aiResponse.json();

    const content =
      aiData?.choices?.[0]
        ?.message?.content;

    if (
      !content ||
      typeof content !== "string"
    ) {
      throw new Error(
        "AI returned an empty response.",
      );
    }

    /* ============================================
       PARSE JSON
       ============================================ */

    let result: unknown;

    try {
      result = JSON.parse(
        content,
      );
    } catch {
      throw new Error(
        "AI returned invalid JSON.",
      );
    }

    /* ============================================
       VALIDATE RESULT
       ============================================ */

    if (
      !validateResult(result)
    ) {
      throw new Error(
        "AI returned an incomplete career roadmap.",
      );
    }

    /* ============================================
       SAVE COMPLETED REPORT
       ============================================ */

    const {
      error: updateError,
    } = await supabase
      .from("reports")
      .update({
        result_data: result,
        status: "completed",
      })
      .eq(
        "id",
        reportId,
      );

    if (updateError) {
      throw updateError;
    }

    /* ============================================
       RETURN REPORT ID
       ============================================ */

    return jsonResponse({
      reportId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate career roadmap.";

    return failReport(
      supabase,
      reportId,
      message,
    );
  }
});