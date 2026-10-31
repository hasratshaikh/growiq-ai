import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Bot,
  CreditCard,
  Pin,
  Pencil,
  Trash2,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MarkdownMessage from "../components/MarkdownMessage";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

function AIConsultant() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [creditAccess, setCreditAccess] = useState(true);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [creditMessage, setCreditMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /*
   * Open an existing conversation.
   */
  const openConversation = useCallback(
    async (conversation: Conversation) => {
      setActiveConversation(conversation);
      setMessages([]);
      setMobileSidebar(false);

      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Messages fetch error:", error);
        window.alert("Unable to load this conversation.");
        return;
      }

      setMessages((data || []) as Message[]);
    },
    [],
  );

  /*
   * Load conversations and credit access.
   * Always open a blank chat when the user returns to this page.
   */
  const loadConversations = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      navigate("/login");
      return;
    }

    const { data: accessData, error: accessError } =
      await supabase.rpc("get_credit_access");

    if (accessError) {
      console.error("Credit access check error:", accessError);
      setCreditAccess(false);
      setCreditMessage(
        "Unable to verify your plan. Please refresh or contact support.",
      );
    } else {
      const allowed = accessData?.allowed === true;

      setCreditAccess(allowed);
      setAvailableCredits(
        typeof accessData?.credits === "number"
          ? accessData.credits
          : null,
      );

      setCreditMessage(
        allowed
          ? ""
          : accessData?.reason === "TRIAL_EXPIRED"
            ? "Your trial has expired. Upgrade your plan to continue chatting."
            : accessData?.reason === "INSUFFICIENT_CREDITS"
              ? "You have no credits remaining. Upgrade your plan to continue chatting."
              : "Activate a plan with available credits to continue chatting.",
      );
    }

    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at, is_pinned")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Conversation fetch error:", error);
      setConversations([]);
    } else {
      setConversations((data || []) as Conversation[]);
    }

    // Do not automatically reopen the previous chat.
    setActiveConversation(null);
    setMessages([]);
    setInput("");
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  /*
   * Auto-scroll when messages change.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
   * Start a blank conversation.
   * A database row is created only after the first message is sent.
   */
  const createConversation = () => {
    if (sending) return;

    setActiveConversation(null);
    setMessages([]);
    setInput("");
    setMobileSidebar(false);
  };

  /*
   * Generate a readable title from the first user message.
   */
  const makeConversationTitle = (message: string) => {
    const cleaned = message
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const firstSentence =
      cleaned.split(/[.!?\n]/)[0]?.trim() || cleaned;

    if (!firstSentence) {
      return "New Conversation";
    }

    return firstSentence.length > 52
      ? `${firstSentence.slice(0, 49).trim()}...`
      : firstSentence;
  };

  /*
   * Rename a conversation.
   */
  const renameConversation = async (conversation: Conversation) => {
    const nextTitle = window.prompt(
      "Enter a new conversation title:",
      conversation.title,
    );

    if (nextTitle === null) return;

    const title = nextTitle.trim();

    if (!title) {
      window.alert("Conversation title cannot be empty.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      navigate("/login");
      return;
    }

    const { error } = await supabase
      .from("ai_conversations")
      .update({ title })
      .eq("id", conversation.id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Rename conversation error:", error);
      window.alert(
        "Could not rename this conversation. Check your database UPDATE policy.",
      );
      return;
    }

    setConversations((previous) =>
      previous.map((item) =>
        item.id === conversation.id
          ? { ...item, title }
          : item,
      ),
    );

    setActiveConversation((current) =>
      current?.id === conversation.id
        ? { ...current, title }
        : current,
    );
  };

  /*
   * Pin or unpin a conversation.
   */
  const togglePinConversation = async (conversation: Conversation) => {
    const isPinned = !conversation.is_pinned;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      navigate("/login");
      return;
    }

    const { error } = await supabase
      .from("ai_conversations")
      .update({ is_pinned: isPinned })
      .eq("id", conversation.id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Pin conversation error:", error);
      window.alert(
        "Could not update pinned status. Make sure the SQL migration has been run.",
      );
      return;
    }

    setConversations((previous) =>
      previous
        .map((item) =>
          item.id === conversation.id
            ? { ...item, is_pinned: isPinned }
            : item,
        )
        .sort(
          (a, b) =>
            Number(Boolean(b.is_pinned)) -
              Number(Boolean(a.is_pinned)) ||
            new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
        ),
    );

    setActiveConversation((current) =>
      current?.id === conversation.id
        ? { ...current, is_pinned: isPinned }
        : current,
    );
  };

  /*
   * Delete a conversation and its messages.
   */
  const deleteConversation = async (conversation: Conversation) => {
    const confirmed = window.confirm(
      `Delete "${conversation.title}" permanently? This cannot be undone.`,
    );

    if (!confirmed) return;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      navigate("/login");
      return;
    }

    // Delete messages first. This also works without ON DELETE CASCADE,
    // provided the user's RLS policies permit deleting their own messages.
    const { error: messagesDeleteError } = await supabase
      .from("ai_messages")
      .delete()
      .eq("conversation_id", conversation.id);

    if (messagesDeleteError) {
      console.error(
        "Delete conversation messages error:",
        messagesDeleteError,
      );
      window.alert(
        "Could not delete this chat's messages. Check your ai_messages DELETE policy.",
      );
      return;
    }

    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", conversation.id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Delete conversation error:", error);
      window.alert(
        "Could not delete this conversation. Check your ai_conversations DELETE policy.",
      );
      return;
    }

    setConversations((previous) =>
      previous.filter((item) => item.id !== conversation.id),
    );

    if (activeConversation?.id === conversation.id) {
      setActiveConversation(null);
      setMessages([]);
      setInput("");
    }
  };

  /*
   * Send a message.
   */
  const sendMessage = async () => {
    const message = input.trim();

    if (!message || sending) return;

    setSending(true);
    setCreditMessage("");

    try {
      // Check credit access before processing the message.
      const { data: freshAccess, error: accessCheckError } =
        await supabase.rpc("get_credit_access");

      if (accessCheckError || freshAccess?.allowed !== true) {
        setCreditAccess(false);

        setAvailableCredits(
          typeof freshAccess?.credits === "number"
            ? freshAccess.credits
            : availableCredits,
        );

        setCreditMessage(
          freshAccess?.reason === "TRIAL_EXPIRED"
            ? "Your trial has expired. Upgrade your plan to continue chatting."
            : freshAccess?.reason === "INSUFFICIENT_CREDITS"
              ? "You have no credits remaining. Upgrade your plan to continue chatting."
              : "Your plan does not currently allow AI Consultant chats.",
        );

        return;
      }

      setCreditAccess(true);

      setAvailableCredits(
        typeof freshAccess.credits === "number"
          ? freshAccess.credits
          : availableCredits,
      );

      // Get the current user.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      let conversation = activeConversation;

      // Create a database conversation on the first message.
      if (!conversation) {
        const title = makeConversationTitle(message);

        const { data, error } = await supabase
          .from("ai_conversations")
          .insert({
            user_id: user.id,
            title,
            is_pinned: false,
          })
          .select(
            "id, title, created_at, updated_at, is_pinned",
          )
          .single();

        if (error || !data) {
          console.error("Conversation creation error:", error);
          window.alert("Unable to create a new conversation.");
          return;
        }

        conversation = data as Conversation;

        setActiveConversation(conversation);
        setConversations((previous) => [
          conversation as Conversation,
          ...previous,
        ]);
      }

      setInput("");

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        optimisticMessage,
      ]);

      // Save the user message.
      const {
        data: savedMessage,
        error: messageError,
      } = await supabase
        .from("ai_messages")
        .insert({
          conversation_id: conversation.id,
          role: "user",
          content: message,
        })
        .select("id, role, content, created_at")
        .single();

      if (messageError || !savedMessage) {
        console.error("Message save error:", messageError);

        setMessages((previous) =>
          previous.filter(
            (item) => item.id !== optimisticMessage.id,
          ),
        );

        window.alert("Unable to save your message. Please try again.");
        return;
      }

      setMessages((previous) =>
        previous.map((item) =>
          item.id === optimisticMessage.id
            ? (savedMessage as Message)
            : item,
        ),
      );

      // Deduct 2 credits for this AI Consultant message.
      const { data: debitData, error: debitError } =
        await supabase.rpc("consume_feature_credits", {
          p_feature: "ai-consultant-chat",
        });

      if (
        debitError ||
        debitData?.allowed === false ||
        debitData?.success === false
      ) {
        const reason = debitData?.reason || debitData?.error;

        setCreditAccess(false);

        setCreditMessage(
          reason === "TRIAL_EXPIRED"
            ? "Your trial has expired. Upgrade your plan to continue chatting."
            : reason === "INSUFFICIENT_CREDITS"
              ? "You need 2 credits to send a message. Please upgrade your plan."
              : debitError?.message ||
                "Unable to use credits. Please try again.",
        );

        // Remove the unsent user message from the chat UI.
        setMessages((previous) =>
          previous.filter(
            (item) => item.id !== savedMessage.id,
          ),
        );

        // Also remove it from the database because no AI response was requested.
        await supabase
          .from("ai_messages")
          .delete()
          .eq("id", savedMessage.id);

        return;
      }

      if (typeof debitData?.credits === "number") {
        setAvailableCredits(debitData.credits);
      } else if (typeof debitData?.credits_remaining === "number") {
        setAvailableCredits(debitData.credits_remaining);
      } else {
        setAvailableCredits((previous) =>
          previous === null
            ? null
            : Math.max(0, previous - 2),
        );
      }

      // Get the current authenticated session.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate("/login");
        return;
      }

      // Call the AI Consultant Edge Function.
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-consultant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversationId: conversation.id,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to generate AI response.",
        );
      }

      if (!result?.message?.id || !result?.message?.content) {
        throw new Error("The AI returned an invalid response.");
      }

      const assistantMessage: Message = {
        id: result.message.id,
        role: "assistant",
        content: result.message.content,
        created_at: result.message.created_at,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      // Update conversation timestamp and move it to the top.
      const updatedAt = new Date().toISOString();

      setConversations((previous) =>
        previous
          .map((item) =>
            item.id === conversation?.id
              ? { ...item, updated_at: updatedAt }
              : item,
          )
          .sort(
            (a, b) =>
              Number(Boolean(b.is_pinned)) -
                Number(Boolean(a.is_pinned)) ||
              new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
          ),
      );
    } catch (error) {
      console.error("AI Consultant error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "I couldn't process that request right now. Please try again in a moment.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  /*
   * Enter = Send
   * Shift + Enter = New line
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-violet-700" />
          Loading AI Consultant...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      {/* MOBILE SIDEBAR */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        >
          <aside
            className="h-full w-[290px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <ConversationSidebar
              conversations={conversations}
              activeConversation={activeConversation}
              onNewConversation={createConversation}
              onSelectConversation={openConversation}
              onRenameConversation={renameConversation}
              onTogglePinConversation={togglePinConversation}
              onDeleteConversation={deleteConversation}
            />
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-[285px] shrink-0 border-r border-slate-200 bg-white lg:block">
        <ConversationSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onNewConversation={createConversation}
          onSelectConversation={openConversation}
          onRenameConversation={renameConversation}
          onTogglePinConversation={togglePinConversation}
          onDeleteConversation={deleteConversation}
        />
      </aside>

      {/* CHAT AREA */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebar(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hidden items-center gap-2 text-sm text-slate-500 transition hover:text-slate-800 sm:flex"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <div className="hidden h-5 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Sparkles size={18} />
              </div>

              <div>
                <h1 className="text-sm font-semibold text-slate-900">
                  AI Consultant
                </h1>

                <p className="hidden text-[11px] text-slate-400 sm:block">
                  Your personal growth advisor
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI Online
          </div>
        </header>

        {/* CREDIT WARNING */}
        {!creditAccess && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-[900px] flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {creditMessage || "Your plan does not have chat access."}
                </p>

                {availableCredits !== null && (
                  <p className="mt-1 text-xs text-amber-800">
                    Available credits: {availableCredits}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate("/subscription")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-800"
              >
                <CreditCard size={14} />
                Upgrade Your Plan
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[900px] flex-col px-4 py-6 sm:px-6 sm:py-8">
            {messages.length === 0 ? (
              <EmptyState
                onSuggestion={(text) => setInput(text)}
              />
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))}

                {sending && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                      <Bot size={16} />
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* COMPOSER */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-[900px]">
            <div className="relative rounded-2xl border border-slate-300 bg-slate-50 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  creditAccess
                    ? "Ask anything about your career, goals or growth..."
                    : "Upgrade your plan to continue chatting..."
                }
                rows={1}
                disabled={sending || !creditAccess}
                className="max-h-32 min-h-[52px] w-full resize-none bg-transparent px-4 py-4 pr-14 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={
                  !input.trim() ||
                  sending ||
                  !creditAccess
                }
                className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-700 text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send size={16} />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              AI responses may not always be perfect. Review important
              decisions independently.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   CONVERSATION SIDEBAR
========================================================= */

function ConversationSidebar({
  conversations,
  activeConversation,
  onNewConversation,
  onSelectConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
}: {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onRenameConversation: (conversation: Conversation) => void;
  onTogglePinConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
}) {
  const pinnedConversations = conversations.filter(
    (conversation) => conversation.is_pinned,
  );

  const recentConversations = conversations.filter(
    (conversation) => !conversation.is_pinned,
  );

  const renderConversation = (conversation: Conversation) => {
    const active =
      activeConversation?.id === conversation.id;

    return (
      <div
        key={conversation.id}
        className={`group flex items-center gap-1 rounded-xl px-2 transition ${
          active
            ? "bg-violet-50"
            : "hover:bg-slate-50"
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectConversation(conversation)}
          className={`flex min-w-0 flex-1 items-center gap-3 py-3 text-left ${
            active
              ? "text-violet-800"
              : "text-slate-600"
          }`}
        >
          <MessageCircle
            size={16}
            className={
              active
                ? "shrink-0 text-violet-700"
                : "shrink-0 text-slate-400"
            }
          />

          <span className="min-w-0 flex-1 truncate text-sm">
            {conversation.title}
          </span>

          {conversation.is_pinned && (
            <Pin
              size={12}
              className="shrink-0 fill-current text-violet-600"
            />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            title={
              conversation.is_pinned
                ? "Unpin chat"
                : "Pin chat"
            }
            aria-label={
              conversation.is_pinned
                ? "Unpin chat"
                : "Pin chat"
            }
            onClick={() => onTogglePinConversation(conversation)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-700"
          >
            <Pin size={13} />
          </button>

          <button
            type="button"
            title="Rename chat"
            aria-label="Rename chat"
            onClick={() => onRenameConversation(conversation)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-700"
          >
            <Pencil size={13} />
          </button>

          <button
            type="button"
            title="Delete chat"
            aria-label="Delete chat"
            onClick={() => onDeleteConversation(conversation)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center justify-between border-b border-slate-100 px-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-indigo-800">
            <Sparkles
              size={15}
              className="text-white"
            />
          </div>

          <span className="font-semibold text-slate-900">
            GrowIQ{" "}
            <span className="text-violet-700">
              AI
            </span>
          </span>
        </Link>
      </div>

      <div className="p-4">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-violet-800"
        >
          <Plus size={17} />
          New Conversation
        </button>
      </div>

      <div className="px-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Conversations
        </p>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto px-3 pb-4">
        {conversations.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageCircle
              size={22}
              className="mx-auto text-slate-300"
            />

            <p className="mt-2 text-xs text-slate-400">
              No conversations yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedConversations.length > 0 && (
              <section>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-600">
                  Pinned
                </p>

                <div className="space-y-1">
                  {pinnedConversations.map(renderConversation)}
                </div>
              </section>
            )}

            {recentConversations.length > 0 && (
              <section>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Recent Chats
                </p>

                <div className="space-y-1">
                  {recentConversations.map(renderConversation)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  const suggestions = [
    "Help me plan my next career move",
    "How can I improve my professional profile?",
    "Create a 30-day personal growth plan",
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <Sparkles size={25} />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-slate-900">
        How can I help you grow?
      </h2>

      <p className="mt-2 max-w-md text-center text-sm leading-6 text-slate-500">
        Ask me about your career, professional presence, goals,
        content strategy or your next growth opportunity.
      </p>

      <div className="mt-7 grid w-full max-w-[620px] gap-2 sm:grid-cols-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs leading-5 text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   CHAT MESSAGE
========================================================= */

function ChatMessage({
  message,
}: {
  message: Message;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "justify-end" : ""
      }`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <Bot size={16} />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "rounded-tr-md bg-violet-700 text-white"
            : "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
        }`}
      >
        {message.role === "assistant" ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
          <UserRound size={16} />
        </div>
      )}
    </div>
  );
}

export default AIConsultant;