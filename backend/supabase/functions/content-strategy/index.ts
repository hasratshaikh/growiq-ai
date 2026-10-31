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



type Platform =

  | "Instagram"

  | "LinkedIn"

  | "Facebook";



type RequestBody = {

  profileUrl?: string;

  platform?: Platform;

  duration?: string;

  primaryGoal?: string;

  contentFormats?: string[];

  websiteUrl?: string;

  additionalNotes?: string;

};



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



function cleanString(

  value: unknown,

) {

  return typeof value === "string"

    ? value.trim()

    : "";

}



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



function extractJson(

  value: string,

) {

  try {

    return JSON.parse(value);

  } catch {

    const start =

      value.indexOf("{");



    const end =

      value.lastIndexOf("}");



    if (

      start === -1 ||

      end === -1 ||

      end <= start

    ) {

      throw new Error(

        "AI returned invalid JSON.",

      );

    }



    return JSON.parse(

      value.slice(

        start,

        end + 1,

      ),

    );

  }

}



Deno.serve(async (request) => {

  if (

    request.method ===

    "OPTIONS"

  ) {

    return new Response(

      "ok",

      {

        headers:

          corsHeaders,

      },

    );

  }



  if (

    request.method !==

    "POST"

  ) {

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

    return jsonResponse(

      {

        error:

          "Supabase configuration is missing.",

      },

      500,

    );

  }



  if (!requestyApiKey) {

    return jsonResponse(

      {

        error:

          "AI provider configuration is missing.",

      },

      500,

    );

  }



  const authorization =

    request.headers.get(

      "Authorization",

    );



  if (!authorization) {

    return jsonResponse(

      {

        error:

          "Authorization is required.",

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

    return jsonResponse(

      {

        error:

          "Invalid or expired session.",

      },

      401,

    );

  }



  let body: RequestBody;



  try {

    body =

      (await request.json()) as RequestBody;

  } catch {

    return jsonResponse(

      {

        error:

          "Invalid request body.",

      },

      400,

    );

  }



  const profileUrl =

    cleanString(

      body.profileUrl,

    );



  const platform =

    cleanString(

      body.platform,

    ) as Platform;



  const duration =

    cleanString(

      body.duration,

    );



  const primaryGoal =

    cleanString(

      body.primaryGoal,

    );



  const contentFormats =

    Array.isArray(

      body.contentFormats,

    )

      ? body.contentFormats

          .filter(

            (item) =>

              typeof item ===

              "string",

          )

          .map((item) =>

            item.trim(),

          )

          .filter(Boolean)

      : [];



  const websiteUrl =

    cleanString(

      body.websiteUrl,

    );



  const additionalNotes =

    cleanString(

      body.additionalNotes,

    );



  if (

    !profileUrl ||

    !platform ||

    !duration ||

    !primaryGoal ||

    contentFormats.length ===

      0

  ) {

    return jsonResponse(

      {

        error:

          "All required fields must be completed.",

      },

      400,

    );

  }



  const allowedPlatforms: Platform[] =

    [

      "Instagram",

      "LinkedIn",

      "Facebook",

    ];



  if (

    !allowedPlatforms.includes(

      platform,

    )

  ) {

    return jsonResponse(

      {

        error:

          "Invalid platform.",

      },

      400,

    );

  }



  if (

    !isValidUrl(profileUrl)

  ) {

    return jsonResponse(

      {

        error:

          "Please provide a valid profile URL.",

      },

      400,

    );

  }



  if (

    !matchesPlatform(

      profileUrl,

      platform,

    )

  ) {

    return jsonResponse(

      {

        error: `The profile URL does not match the selected ${platform} platform.`,

      },

      400,

    );

  }



  if (

    websiteUrl &&

    !isValidUrl(websiteUrl)

  ) {

    return jsonResponse(

      {

        error:

          "Please provide a valid website URL.",

      },

      400,

    );

  }



  const allowedDurations = [

    "7 Days",

    "14 Days",

    "30 Days",

  ];



  if (

    !allowedDurations.includes(

      duration,

    )

  ) {

    return jsonResponse(

      {

        error:

          "Invalid content duration.",

      },

      400,

    );

  }



  /*

   * Find module

   */



  const {

    data: moduleData,

    error: moduleError,

  } =

    await supabase

      .from("modules")

      .select("id, slug, name")

      .eq(

        "slug",

        "content-strategy",

      )

      .maybeSingle();



  if (moduleError) {

    console.error(

      "Module lookup error:",

      moduleError,

    );



    return jsonResponse(

      {

        error:

          "Unable to load Content Strategy module.",

      },

      500,

    );

  }



  if (!moduleData) {

    return jsonResponse(

      {

        error:

          "Content Strategy module is not configured.",

      },

      500,

    );

  }



  /*

   * Create processing report

   */



  const reportTitle =

    `${duration} ${platform} Content Strategy`;



  const inputData = {

    profileUrl,

    platform,

    duration,

    primaryGoal,

    contentFormats,

    websiteUrl,

    additionalNotes,

  };



  const {

    data: report,

    error: reportError,

  } =

    await supabase

      .from("reports")

      .insert({

        user_id: user.id,

        module_id:

          moduleData.id,

        title: reportTitle,

        input_data:

          inputData,

        status: "processing",

      })

      .select(

        "id, title, status",

      )

      .single();



  if (

    reportError ||

    !report

  ) {

    console.error(

      "Report creation error:",

      reportError,

    );



    return jsonResponse(

      {

        error:

          "Unable to create Content Strategy report.",

      },

      500,

    );

  }



  /*

   * Website content is intentionally not

   * treated as available yet.

   *

   * A URL alone does not mean the AI

   * can access the website.

   */



  const websiteContext =

    websiteUrl

      ? `A website URL was provided: ${websiteUrl}. Do not claim to have read, browsed, scraped, or verified this website unless website content is explicitly supplied in the prompt. Treat website-specific details as unavailable.`

      : "No website URL was provided.";



  const systemPrompt = `

You are GrowIQ AI's Content Strategy Consultant.



Your task is to create a practical, personalized social media content strategy.



You must follow these rules:



1. Never invent profile metrics, follower counts, engagement rates, analytics, website facts, products, services, audience data, or performance data.



2. A profile URL does NOT automatically give you browser access to that profile.



3. A website URL does NOT automatically give you browser access to that website.



4. If source content is unavailable, clearly state that the recommendation is based on the information supplied by the user.



5. The user-selected platform, goal, duration and content formats must control the strategy.



6. Generate the exact number of content-plan days requested:

   - 7 Days = 7 entries

   - 14 Days = 14 entries

   - 30 Days = 30 entries



7. Recommended posting times are recommendations, not guaranteed best times. If account analytics are unavailable, describe them as suggested posting windows based on general platform behavior and the user's selected goal.



8. Do not claim that any specific posting time is proven to be best for this account.



9. Content ideas must be specific and usable, not generic filler.



10. The content plan should vary topics, hooks, objectives and formats instead of repeating the same idea.



11. Use only formats selected by the user.



12. Content pillars should support the user's primary goal.



13. Return ONLY valid JSON. No markdown. No explanation outside JSON.



Required JSON structure:



{

  "title": "",

  "objective_summary": "",

  "content_pillars": [

    {

      "name": "",

      "purpose": "",

      "recommended_percentage": 0

    }

  ],

  "content_plan": [

    {

      "day": 1,

      "content_format": "",

      "content_pillar": "",

      "topic": "",

      "hook_or_title": "",

      "content_idea": "",

      "objective": "",

      "cta": "",

      "caption_angle": ""

    }

  ],

  "posting_schedule": [

    {

      "day": "Monday",

      "recommended_time": "",

      "reason": ""

    }

  ],

  "action_plan": {

    "daily_actions": [],

    "weekly_actions": [],

    "optimization_actions": []

  }

}

`;



  const userPrompt = `

Create a ${duration} content strategy.



Platform:

${platform}



Profile URL:

${profileUrl}



Primary Goal:

${primaryGoal}



Selected Content Formats:

${contentFormats.join(", ")}



Website information:

${websiteContext}



Additional Notes:

${additionalNotes || "None provided."}



Important:

- Generate exactly the requested number of content-plan days.

- Do not invent profile analytics.

- Do not claim you accessed Instagram, LinkedIn, Facebook or the website.

- Use the selected content formats only.

- Make the strategy practical and specific.

- Posting times must be recommendations, not guaranteed account-specific best times.

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



    temperature: 0.35,



    max_tokens: 6000,

  };



  let requestyResponse:

    Response | null = null;



  let lastRequestyError =

    "";



  const MAX_ATTEMPTS = 1;



  for (

    let attempt = 1;

    attempt <= MAX_ATTEMPTS;

    attempt++

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

              Authorization:

                `Bearer ${requestyApiKey}`,

              "HTTP-Referer":

                supabaseUrl,

              "X-Title":

                "GrowIQ AI",

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

    } catch (

      requestError

    ) {

      lastRequestyError =

        requestError instanceof

        Error

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

      },

      502,

    );

  }



  let providerJson:

    Record<

      string,

      unknown

    >;



  try {

    providerJson =

      await requestyResponse.json();

  } catch {

    await supabase

      .from("reports")

      .update({

        status: "failed",

        result_data: {

          error:

            "Invalid AI provider response.",

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



  const choices =

    providerJson.choices;



  if (

    !Array.isArray(

      choices,

    ) ||

    choices.length === 0

  ) {

    await supabase

      .from("reports")

      .update({

        status: "failed",

        result_data: {

          error:

            "AI provider returned no content.",

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

          "AI provider returned no usable content.",

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

    await supabase

      .from("reports")

      .update({

        status: "failed",

        result_data: {

          error:

            "AI returned empty content.",

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

          "AI returned an empty strategy.",

      },

      502,

    );

  }



  let resultData: Record<

    string,

    unknown

  >;



  try {

    resultData =

      extractJson(

        rawContent,

      );

  } catch (

    parseError

  ) {

    console.error(

      "AI JSON parsing error:",

      parseError,

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

          "AI returned an invalid content strategy. Please try again.",

      },

      502,

    );

  }



  /*

   * Basic output validation

   */



  const contentPlan =

    resultData.content_plan;



  const contentPillars =

    resultData.content_pillars;



  const postingSchedule =

    resultData.posting_schedule;



  if (

    !Array.isArray(

      contentPlan,

    ) ||

    contentPlan.length ===

      0

  ) {

    await supabase

      .from("reports")

      .update({

        status: "failed",

        result_data: {

          error:

            "AI returned an empty content plan.",

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

          "AI could not generate a valid content plan. Please try again.",

      },

      502,

    );

  }



  if (

    !Array.isArray(

      contentPillars,

    ) ||

    contentPillars.length ===

      0

  ) {

    await supabase

      .from("reports")

      .update({

        status: "failed",

        result_data: {

          error:

            "AI returned no content pillars.",

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

          "AI could not generate valid content pillars.",

      },

      502,

    );

  }



  if (

    !Array.isArray(

      postingSchedule,

    ) ||

    postingSchedule.length ===

      0

  ) {

    await supabase

      .from("reports")

      .update({

        status: "failed",

        result_data: {

          error:

            "AI returned no posting schedule.",

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

          "AI could not generate a valid posting schedule.",

      },

      502,

    );

  }



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

          resultData,

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

          "Strategy was generated but could not be saved.",

      },

      500,

    );

  }



  return jsonResponse({

    success: true,

    reportId: report.id,

    result: resultData,

  });

});