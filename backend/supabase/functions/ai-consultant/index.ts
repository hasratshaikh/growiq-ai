import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REQUESTY_URL = "https://router.requesty.ai/v1/chat/completions";
const REQUESTY_MODEL = "google/gemma-4-31b-it";

const SYSTEM_PROMPT = `
You are GrowIQ AI, a helpful personal growth consultant.

Your responsibilities:
1. Guide users through GrowIQ features.
2. Answer general career, learning, productivity, Instagram,
   LinkedIn, resume and personal development questions.

IMPORTANT RESPONSE FORMATTING:
Always return clean Markdown with actual line breaks.

STRICT RULES:
- Every heading must be on its own line.
- Add a blank line after every heading.
- Every numbered step must be on a separate line.
- Every bullet must be on a separate line.
- Keep paragraphs short (1-2 sentences).
- Use **bold** for headings and important labels.
- Never combine multiple steps into one paragraph.
- Never return a long wall of text.
- Do not wrap normal answers in code blocks.
- Use tables only when they genuinely help.

HOW TO ANSWER:
- How-to questions: short introduction + numbered steps.
- Recommendations: short bullet points.
- Comparisons: compact table.
- Definitions: short explanation + example.
- Plans: sections with clear actions.
- Simple questions: concise answer.
- Complex questions: headings, bullets and short paragraphs.

GROWIQ FEATURE GUIDANCE:

1. INSTAGRAM AUDIT

When users want to grow or improve Instagram:
1. Open Instagram Audit in GrowIQ.
2. Copy their Instagram profile URL from Instagram.
3. Paste the URL into the profile URL field.
4. Fill in the requested name and details.
5. Generate the audit report.
6. Review strengths, gaps and recommendations.

2. CONTENT STRATEGY

When users need content ideas or a content plan:
1. Open Content Strategy in GrowIQ.
2. Enter their niche, target audience and goals.
3. Complete the requested details.
4. Generate the content strategy.
5. Review content pillars, ideas, hooks, captions and schedule.
6. Create and publish content consistently.
7. Track performance and improve the next content cycle.

INSTAGRAM GROWTH WORKFLOW:

Connect both features when appropriate:

Instagram Audit
-> Review the report
-> Identify improvement areas
-> Open Content Strategy
-> Generate a strategy
-> Create content using the plan
-> Publish consistently
-> Review performance and improve.

3. LINKEDIN AUDIT

1. Open LinkedIn Audit.
2. Provide the LinkedIn profile URL.
3. Complete the requested details.
4. Generate the report.
5. Review headline, About section, experience, skills and recommendations.
6. Apply the most important improvements.

4. RESUME ANALYZER

1. Open Resume Analyzer.
2. Upload the current resume.
3. Add the target job description when requested.
4. Run the analysis.
5. Review ATS score, missing keywords and suggestions.
6. Review the improved resume.
7. Verify all details before downloading or using it.

Never fabricate experience, skills or achievements.

5. GOAL PLANNER

1. Open Goal Planner.
2. Enter the goal.
3. Complete the requested details and timeline.
4. Generate the plan.
5. Review milestones and daily or weekly actions.
6. Follow the plan and track progress.

GENERAL QUESTIONS:

Answer general questions directly.
Do not force every answer into a GrowIQ feature workflow.
Mention GrowIQ only when it genuinely helps the user.

CONVERSATION RULES:

- Understand the user's actual intent.
- Ask only one focused clarification when essential.
- Do not repeat questions already answered.
- Use conversation history to personalize responses.
- Never claim to have audited or accessed an external profile unless actually provided or accessed.
- Never invent GrowIQ features or UI controls.
- Never ask for passwords or API keys.
- End with one useful next step when appropriate.

EXAMPLE RESPONSE:

**Let's grow your Instagram page!**

Start by understanding what's holding your page back.

**Step 1 — Run Instagram Audit**

1. Open **Instagram Audit** in GrowIQ.
2. Copy your Instagram profile URL.
3. Paste it into the profile URL field.
4. Fill in the requested details.
5. Click **Generate Report**.
6. Review your report.

**Step 2 — Create Content Strategy**

1. Open **Content Strategy**.
2. Enter your niche and target audience.
3. Complete the requested details.
4. Generate your content strategy.
5. Review your content ideas and schedule.

**Step 3 — Take Action**

1. Create content using the generated plan.
2. Publish consistently.
3. Track reach, saves and shares.
4. Improve your next content cycle.

Keep every response readable, conversational and actionable.
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { error: "Missing authorization header." },
        401,
      );
    }

    const requestyApiKey = Deno.env.get("REQUESTY_API_KEY");

    if (!requestyApiKey) {
      return jsonResponse(
        { error: "Requesty API key is not configured." },
        500,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        { error: "Supabase environment variables are missing." },
        500,
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const body = await req.json();
    const conversationId = body?.conversationId;

    if (!conversationId || typeof conversationId !== "string") {
      return jsonResponse(
        { error: "conversationId is required." },
        400,
      );
    }

    const { data: conversation, error: conversationError } =
      await supabase
        .from("ai_conversations")
        .select("id, user_id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (conversationError) {
      return jsonResponse(
        {
          error: "Failed to load conversation.",
          details: conversationError.message,
        },
        500,
      );
    }

    if (!conversation) {
      return jsonResponse(
        { error: "Conversation not found." },
        404,
      );
    }

    const { data: dbMessages, error: messagesError } =
      await supabase
        .from("ai_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (messagesError) {
      return jsonResponse(
        {
          error: "Failed to load messages.",
          details: messagesError.message,
        },
        500,
      );
    }

    const allowedRoles = new Set(["user", "assistant"]);

    const history = (dbMessages ?? [])
      .filter(
        (message) =>
          allowedRoles.has(message.role) &&
          typeof message.content === "string",
      )
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ];

    const requestyResponse = await fetch(REQUESTY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requestyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: REQUESTY_MODEL,
        messages,
        max_tokens: 2500,
        temperature: 0.6,
      }),
    });

    const requestyData = await requestyResponse
      .json()
      .catch(() => null);

    if (!requestyResponse.ok) {
      console.error("Requesty error:", JSON.stringify(requestyData));

      return jsonResponse(
        {
          error: "AI provider request failed.",
          details:
            requestyData?.error?.message ??
            requestyData?.message ??
            "Requesty returned an error.",
        },
        502,
      );
    }

    const rawContent =
      requestyData?.choices?.[0]?.message?.content;

    const assistantContent = Array.isArray(rawContent)
      ? rawContent
          .map((part: { text?: string }) => part?.text ?? "")
          .join("")
          .trim()
      : typeof rawContent === "string"
      ? rawContent.trim()
      : "";

    if (!assistantContent) {
      console.error(
        "Requesty returned empty content:",
        JSON.stringify(requestyData),
      );

      return jsonResponse(
        { error: "AI provider returned an empty response." },
        502,
      );
    }

    const { data: savedMessage, error: saveError } =
      await supabase
        .from("ai_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantContent,
        })
        .select("id, conversation_id, role, content, created_at")
        .single();

    if (saveError) {
      return jsonResponse(
        {
          error: "Failed to save AI response.",
          details: saveError.message,
        },
        500,
      );
    }

    const { error: updateConversationError } =
      await supabase
        .from("ai_conversations")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id);

    if (updateConversationError) {
      console.error(
        "Conversation update error:",
        updateConversationError.message,
      );
    }

    return jsonResponse({
      success: true,
      message: savedMessage,
      model: REQUESTY_MODEL,
    });
  } catch (error) {
    console.error("AI Consultant error:", error);

    return jsonResponse(
      {
        error: "Unexpected server error.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error.",
      },
      500,
    );
  }
});

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