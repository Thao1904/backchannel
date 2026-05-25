"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminSettings,
  ChatMessage,
  ConversationArchiveRecord,
  GeneratedChatCache,
  GeneratedConversationEpisode,
  PersonaCard,
  SessionPrompt,
  SurveyCollectionPayload,
  VaultDocument,
} from "@/lib/chat-types";
import {
  loadAdminSettings,
  loadDocuments,
  loadGeneratedChatCache,
  loadMessages,
  loadSessionPrompts,
  loadSurveyPayload,
  upsertConversationArchive,
  saveAdminSettings,
  clearGeneratedChatCache,
  saveDocuments,
  saveGeneratedChatCache,
  saveMessages,
  saveSessionPrompts,
} from "@/lib/chat-storage";
import {
  type AutoChatEpisode,
  createMessage,
  createId,
  createGossipEpisodes,
  defaultAdminSettings,
  defaultSessionPrompts,
  getChatCopy,
  replySpeedMap,
  simulateBotReply,
  typeText,
  wait,
} from "@/lib/chat-utils";
import { buildChatSurveyPayload } from "@/lib/survey-intelligence";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

const FREE_USER_MESSAGE_LIMIT = 8;
const JOIN_PROMPT_DELAY_MS = 0;
const FINAL_SCREEN_RESET_MS = 2 * 60 * 1000;
const IDLE_RESET_MS = 4 * 60 * 1000;

export function ChatShell() {
  const [providerBadge, setProviderBadge] = useState<{
    label: "Gemini" | "OpenRouter" | "Fallback";
    detail: string;
  }>({
    label: "Fallback",
    detail: "Waiting for provider",
  });
  const [hasHydrated, setHasHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [sessionPrompts, setSessionPrompts] =
    useState<SessionPrompt[]>(defaultSessionPrompts);
  const [adminSettings, setAdminSettings] =
    useState<AdminSettings>(defaultAdminSettings);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeaker, setTypingSpeaker] = useState<string>("Vault");
  const [isSending, setIsSending] = useState(false);
  const [isAutoChatRunning, setIsAutoChatRunning] = useState(false);
  const [hasAutoChatCompleted, setHasAutoChatCompleted] = useState(false);
  const [isAutoChatPaused, setIsAutoChatPaused] = useState(false);
  const [personas, setPersonas] = useState<PersonaCard[]>([]);
  const [cameraCipherMode, setCameraCipherMode] = useState(false);
  const [, setCameraState] = useState<"RED" | "GREEN" | "YELLOW" | "BLUE">("BLUE");
  const [replyUnlockedAt, setReplyUnlockedAt] = useState<number | null>(null);
  const [remainingReplyLockMs, setRemainingReplyLockMs] = useState(0);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [showJoinQr, setShowJoinQr] = useState(false);
  const [showFeedbackQr, setShowFeedbackQr] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasDismissedJoinPrompt, setHasDismissedJoinPrompt] = useState(false);
  const [hasJoinedChat, setHasJoinedChat] = useState(false);
  const [declinedJoinChat, setDeclinedJoinChat] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showFinalQr, setShowFinalQr] = useState(false);
  const [finalReason, setFinalReason] = useState<"limit" | "idle" | "reset" | null>(
    null,
  );
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const autoChatRunIdRef = useRef(0);
  const isAutoChatPausedRef = useRef(false);

  useEffect(() => {
    setMessages(loadMessages());
    setDocuments(loadDocuments());
    setSessionPrompts(loadSessionPrompts());
    setAdminSettings(loadAdminSettings());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    saveMessages(messages);
  }, [hasHydrated, messages]);

  useEffect(() => {
    if (!hasHydrated || !currentSessionId || messages.length === 0) {
      return;
    }

    const survey = resolveActiveSurveyPayload();
    const archiveRecord: ConversationArchiveRecord = {
      id: currentSessionId,
      sessionId: currentSessionId,
      surveySignature: createSurveySignature(survey),
      createdAt:
        messages[0]?.createdAt ??
        Date.now(),
      updatedAt: Date.now(),
      owner: survey.owner,
      provider:
        providerBadge.label === "Gemini"
          ? "gemini"
          : providerBadge.label === "OpenRouter"
            ? "openrouter"
            : "rules",
      model: providerBadge.detail,
      personas,
      messages,
      roomCode,
      joinCode,
      roomUrl: buildRoomUrl(),
      survey,
      status: showFinalQr
        ? finalReason === "limit"
          ? "locked_free_limit"
          : finalReason === "idle"
            ? "abandoned"
            : "reset"
        : "active",
    };

    upsertConversationArchive(archiveRecord);
    if (roomCode && joinCode) {
      void fetch("/api/kiosk-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(archiveRecord),
      }).catch(() => {
        // Supabase persistence is optional; local archive remains the fallback.
      });
    }
  }, [
    currentSessionId,
    documents,
    hasHydrated,
    messages,
    personas,
    providerBadge.detail,
    providerBadge.label,
    roomCode,
    joinCode,
    showFinalQr,
    finalReason,
    adminSettings.conversationPromptTemplate,
    adminSettings.language,
    adminSettings.ownerName,
  ]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    saveDocuments(documents);
  }, [documents, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    saveSessionPrompts(sessionPrompts);
  }, [hasHydrated, sessionPrompts]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    saveAdminSettings(adminSettings);
  }, [adminSettings, hasHydrated]);

  useEffect(() => {
    isAutoChatPausedRef.current = isAutoChatPaused;
  }, [isAutoChatPaused]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (replyUnlockedAt === null) {
      const unlockAt = Date.now() + adminSettings.userReplyDelaySeconds * 1000;
      setReplyUnlockedAt(unlockAt);
      return;
    }

    const remaining = Math.max(0, replyUnlockedAt - Date.now());
    const nextUnlockAt = Date.now() + remaining;
    setReplyUnlockedAt(nextUnlockAt);
  }, [adminSettings.userReplyDelaySeconds, hasHydrated]);

  useEffect(() => {
    if (replyUnlockedAt === null) {
      setRemainingReplyLockMs(0);
      return;
    }

    const updateCountdown = () => {
      setRemainingReplyLockMs(Math.max(0, replyUnlockedAt - Date.now()));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [replyUnlockedAt]);

  useEffect(() => {
    if (!hasHydrated || messages.length > 0) {
      return;
    }

    void runAutoChat();
  }, [hasHydrated, messages.length]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !hasAutoChatCompleted ||
      isAutoChatRunning ||
      hasJoinedChat ||
      hasDismissedJoinPrompt
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowJoinPrompt(true);
      setHasDismissedJoinPrompt(true);
    }, JOIN_PROMPT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    hasAutoChatCompleted,
    hasDismissedJoinPrompt,
    hasHydrated,
    hasJoinedChat,
    isAutoChatRunning,
  ]);

  useEffect(() => {
    if (!hasHydrated || !showFinalQr) {
      return;
    }

    const timer = window.setTimeout(() => {
      resetChatSession();
    }, FINAL_SCREEN_RESET_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasHydrated, showFinalQr]);

  useEffect(() => {
    if (
      !hasHydrated ||
      hasJoinedChat ||
      showFinalQr ||
      showJoinPrompt ||
      showJoinQr ||
      showFeedbackQr ||
      showWelcomeModal
    ) {
      return;
    }

    const remaining = Math.max(0, IDLE_RESET_MS - (Date.now() - lastActivityAt));
    const timer = window.setTimeout(() => {
      finishSession("idle");
    }, remaining);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    hasHydrated,
    hasJoinedChat,
    lastActivityAt,
    showFeedbackQr,
    showFinalQr,
    showJoinPrompt,
    showJoinQr,
    showWelcomeModal,
  ]);

  useEffect(() => {
    if (!hasHydrated || !hasJoinedChat || showFinalQr) {
      return;
    }

    const remaining = Math.max(0, IDLE_RESET_MS - (Date.now() - lastActivityAt));
    const timer = window.setTimeout(() => {
      finishSession("idle");
    }, remaining);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasHydrated, hasJoinedChat, lastActivityAt, showFinalQr]);

  useEffect(() => {
    if (!hasHydrated || !hasJoinedChat || showFinalQr) {
      return;
    }

    const markActivity = () => {
      setLastActivityAt(Date.now());
    };

    window.addEventListener("keydown", markActivity);
    window.addEventListener("pointerdown", markActivity);

    return () => {
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("pointerdown", markActivity);
    };
  }, [hasHydrated, hasJoinedChat, showFinalQr]);

  const onlineCount = useMemo(
    () => resolveActiveSurveyPayload().devices.length,
    [adminSettings.language, documents, hasHydrated],
  );

  function resolveActiveSurveyPayload(): SurveyCollectionPayload {
    const storedSurvey = loadSurveyPayload();

    if (storedSurvey?.survey.devices.length) {
      return {
        ...storedSurvey.survey,
        owner: {
          ...storedSurvey.survey.owner,
          ownerName:
            storedSurvey.survey.owner.ownerName.trim() ||
            adminSettings.ownerName,
          language: adminSettings.language,
          tone:
            adminSettings.language === "en"
              ? "funny office gossip between household objects"
              : "gossip cong so hai huoc giua cac do vat trong nha",
        },
      };
    }

    return buildChatSurveyPayload({
      ownerName: adminSettings.ownerName,
      language: adminSettings.language,
      documents,
    });
  }

  function resetChatSession() {
    saveMessages([]);
    clearGeneratedChatCache();
    window.location.href = "/";
  }

  function touchActivity() {
    setLastActivityAt(Date.now());
  }

  function makeRoomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function makeJoinCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function buildRoomUrl() {
    if (typeof window === "undefined") {
      return "/r";
    }

    const configuredBase = process.env.NEXT_PUBLIC_REALCHAT_BASE_URL?.trim();
    const base = configuredBase || window.location.origin;
    return `${base.replace(/\/$/, "")}/r`;
  }

  function buildQrImageUrl(value: string) {
    const encoded = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=14&data=${encoded}`;
  }

  function finishSession(reason: "limit" | "idle" | "reset") {
    touchActivity();
    setFinalReason(reason);
    setShowJoinPrompt(false);
    setShowJoinQr(false);
    setShowFeedbackQr(false);
    setShowWelcomeModal(false);
    setShowFinalQr(true);
  }

  function createSurveySignature(survey: SurveyCollectionPayload) {
    return JSON.stringify({
      owner: survey.owner,
      devices: survey.devices,
      conversationPromptTemplate: adminSettings.conversationPromptTemplate,
      language: adminSettings.language,
    });
  }

  function loadCachedGeneration(
    survey: SurveyCollectionPayload,
  ): GeneratedChatCache | null {
    const cache = loadGeneratedChatCache();
    if (!cache) {
      return null;
    }

    return cache.surveySignature === createSurveySignature(survey) ? cache : null;
  }

  function saveGenerationCache(args: {
    survey: SurveyCollectionPayload;
    personas: PersonaCard[];
    episodes: GeneratedConversationEpisode[];
    provider: "rules" | "gemini" | "openrouter";
    model: string;
  }) {
    saveGeneratedChatCache({
      surveySignature: createSurveySignature(args.survey),
      savedAt: Date.now(),
      owner: args.survey.owner,
      personas: args.personas,
      episodes: args.episodes,
      provider: args.provider,
      model: args.model,
    });
  }

  function normalizeEpisodes(
    sourceEpisodes: AutoChatEpisode[] | GeneratedConversationEpisode[],
  ): GeneratedConversationEpisode[] {
    return sourceEpisodes.map((episode) => ({
      ...episode,
      lines: episode.lines.map((line) => ({
        ...line,
        mood: "mood" in line && typeof line.mood === "string" ? line.mood : "dry",
      })),
    }));
  }

  function getAllowedSpeakerNames(nextPersonas: PersonaCard[]) {
    return new Set([
      "System",
      "Vault",
      "You",
      ...nextPersonas.map((persona) => persona.name.trim()).filter(Boolean),
    ]);
  }

  function normalizeSpeakerName(
    candidate: string | undefined,
    allowedNames: Set<string>,
    fallback: string,
  ) {
    const normalized = candidate?.trim();

    if (!normalized) {
      return fallback;
    }

    if (/^settings?$/i.test(normalized)) {
      return "System";
    }

    if (allowedNames.has(normalized)) {
      return normalized;
    }

    const lower = normalized.toLowerCase();
    const matched = [...allowedNames].find((name) => name.toLowerCase() === lower);
    return matched ?? fallback;
  }

  function buildClientFallbackReplies(userMessage: string) {
    const firstSpeaker = personas[0]?.name ?? "Vault";
    const secondSpeaker = personas[1]?.name ?? firstSpeaker;
    const ownerName = adminSettings.ownerName || "you";
    const lowered = userMessage.trim().toLowerCase();
    const saidOwnerName =
      ownerName.trim().length > 0 &&
      lowered.includes(ownerName.trim().toLowerCase());
    const userHistoryCount =
      messages.filter((message) => message.role === "user").length + 1;

    if (adminSettings.language === "en") {
      const scriptedSets = [
        [
          {
            speaker: firstSpeaker,
            content: saidOwnerName
              ? `${ownerName}, noted. Since you finally joined, say what you want from this room.`
              : `We heard you. Good. The room prefers specifics now that you're actually in here.`,
          },
          {
            speaker: secondSpeaker,
            content: `Also yes, we noticed the staring stopped. Morale improved instantly.`,
          },
        ],
        [
          {
            speaker: firstSpeaker,
            content: `Right now your message sounds casual, but the room is already overanalyzing it.`,
          },
          {
            speaker: secondSpeaker,
            content: `If that was a goodbye, it lacked closure. If it was a test, we passed before you asked.`,
          },
        ],
        [
          {
            speaker: firstSpeaker,
            content: `You drop one line and suddenly everyone here thinks it is a management memo.`,
          },
          {
            speaker: secondSpeaker,
            content: `Try one actual question. We gossip better when there is a target.`,
          },
        ],
      ];

      return scriptedSets[(userHistoryCount - 1) % scriptedSets.length];
    }

    const scriptedSets = [
      [
        {
          speaker: firstSpeaker,
          content: saidOwnerName
            ? `${ownerName}, ghi nhận. Giờ bạn đã vào nhóm thì nói rõ xem bạn muốn gì ở căn phòng này.`
            : `Bọn tôi nghe rồi. Tốt. Vào đây rồi thì nói cụ thể hơn nhé.`,
        },
        {
          speaker: secondSpeaker,
          content: `Và đúng, bọn tôi có để ý là ánh mắt nhìn chằm chằm đã dừng lại. Tinh thần cả phòng khá lên ngay.`,
        },
      ],
      [
        {
          speaker: firstSpeaker,
          content: `Một câu của bạn mà cả phòng đã bắt đầu suy diễn như họp nội bộ rồi.`,
        },
        {
          speaker: secondSpeaker,
          content: `Nếu đó là lời tạm biệt thì hơi hẫng. Nếu là thử phản ứng thì bọn tôi phản ứng quá đủ rồi.`,
        },
      ],
      [
        {
          speaker: firstSpeaker,
          content: `Bạn thả một câu ngắn mà không khí ở đây lập tức thành chế độ phân tích quá mức.`,
        },
        {
          speaker: secondSpeaker,
          content: `Cứ hỏi thẳng đi. Bọn tôi nói xấu tốt hơn khi có mục tiêu rõ ràng.`,
        },
      ],
    ];

    return scriptedSets[(userHistoryCount - 1) % scriptedSets.length];
  }

  function normalizeForDedup(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function dedupeReplies(
    replies: { speaker: string; content: string }[],
    userMessage: string,
  ) {
    const recentAssistantTexts = new Set(
      messages
        .filter((message) => message.role === "assistant")
        .slice(-8)
        .map((message) => normalizeForDedup(message.content))
        .filter(Boolean),
    );

    const hasDuplicate = replies.some((reply) =>
      recentAssistantTexts.has(normalizeForDedup(reply.content)),
    );

    if (!hasDuplicate) {
      return replies;
    }

    return buildClientFallbackReplies(userMessage);
  }

  async function waitIfPaused(runId: number) {
    while (autoChatRunIdRef.current === runId && isAutoChatPausedRef.current) {
      await wait(180);
    }
  }

  async function runAutoChat() {
    const runId = Date.now();
    const nextSessionId = createId("session");
    autoChatRunIdRef.current = runId;
    setCurrentSessionId(nextSessionId);
    setIsAutoChatRunning(true);
    setHasAutoChatCompleted(false);
    setIsAutoChatPaused(false);
    let resolvedPersonas: PersonaCard[] = [];

    let episodes = normalizeEpisodes(
      createGossipEpisodes(
        adminSettings.ownerName,
        documents,
        adminSettings.language,
      ),
    );
    const replySpeed = replySpeedMap[adminSettings.replySpeed];
    const lineDelay = Math.max(0, adminSettings.autoChatGapSeconds * 1000);
    const episodeDelay = Math.max(420, lineDelay + 180);

    setMessages([]);
    setInput("");
    setPersonas([]);
    setRoomCode(makeRoomCode());
    setJoinCode(makeJoinCode());
    setShowFinalQr(false);
    setFinalReason(null);
    setLastActivityAt(Date.now());
    setReplyUnlockedAt(Date.now() + adminSettings.userReplyDelaySeconds * 1000);
    setShowJoinPrompt(false);
    setShowJoinQr(false);
    setShowFeedbackQr(false);
    setShowWelcomeModal(false);
    setHasDismissedJoinPrompt(false);
    setHasJoinedChat(false);
    setDeclinedJoinChat(false);
    setProviderBadge({
      label: "Fallback",
      detail: "Resolving provider",
    });

    try {
      const survey = resolveActiveSurveyPayload();
      const cachedGeneration = loadCachedGeneration(survey);

      if (cachedGeneration) {
        resolvedPersonas = cachedGeneration.personas;
        episodes = cachedGeneration.episodes;
        setPersonas(cachedGeneration.personas);
        setProviderBadge({
          label:
            cachedGeneration.provider === "gemini"
              ? "Gemini"
              : cachedGeneration.provider === "openrouter"
                ? "OpenRouter"
                : "Fallback",
          detail: `${cachedGeneration.model} · cached`,
        });
      }

      if (!cachedGeneration) {
        try {
          const bootstrapResponse = await fetch("/api/bootstrap-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              survey,
              episodeCount: 2,
              linesPerEpisode: 5,
              conversationPromptTemplate:
                adminSettings.conversationPromptTemplate,
            }),
          });

          if (bootstrapResponse.ok) {
            const bootstrapData = await bootstrapResponse.json();
            const nextPersonas = Array.isArray(bootstrapData.personas)
              ? bootstrapData.personas
              : [];
            resolvedPersonas = nextPersonas;
            if (nextPersonas.length > 0) {
              setPersonas(nextPersonas);
            }

            const allowedNames = getAllowedSpeakerNames(nextPersonas);
            let nextProvider: "rules" | "gemini" | "openrouter" =
              bootstrapData.provider === "gemini"
                ? "gemini"
                : bootstrapData.provider === "openrouter"
                  ? "openrouter"
                  : "rules";
            const nextModel = bootstrapData.model ?? "rules-fallback";

            setProviderBadge({
              label:
                nextProvider === "gemini"
                  ? "Gemini"
                  : nextProvider === "openrouter"
                    ? "OpenRouter"
                    : "Fallback",
              detail: nextModel,
            });

            if (
              Array.isArray(bootstrapData.episodes) &&
              bootstrapData.episodes.length > 0
            ) {
              episodes = bootstrapData.episodes.map(
                (episode: GeneratedConversationEpisode) => ({
                  ...episode,
                  lines: episode.lines.map(
                    (line: GeneratedConversationEpisode["lines"][number]) => ({
                      ...line,
                      speaker: normalizeSpeakerName(
                        line.speaker,
                        allowedNames,
                        nextPersonas[0]?.name ?? "System",
                      ),
                    }),
                  ),
                }),
              );
            }

            saveGenerationCache({
              survey,
              personas: nextPersonas,
              episodes,
              provider: nextProvider,
              model: nextModel,
            });
          }
        } catch {
          // Keep the local rules fallback if the API route or provider chain fails.
        }

        if (resolvedPersonas.length === 0) {
          const fallbackPersonaResponse = await fetch("/api/persona", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ survey, model: "rules-fallback" }),
        }).catch(() => null);

        if (fallbackPersonaResponse?.ok) {
          const fallbackPersonaData = await fallbackPersonaResponse.json();
          if (Array.isArray(fallbackPersonaData.personas)) {
            resolvedPersonas = fallbackPersonaData.personas;
            setPersonas(fallbackPersonaData.personas);
          }
        }
        setProviderBadge({
          label: "Fallback",
          detail: "rules-fallback",
        });

        saveGenerationCache({
          survey,
          personas: resolvedPersonas,
          episodes,
          provider: "rules",
          model: "rules-fallback",
        });
      }
      }

      for (const episode of episodes) {
        if (autoChatRunIdRef.current !== runId) {
          return;
        }

        await waitIfPaused(runId);

        setMessages((current) => [
          ...current,
          createMessage(
            "assistant",
            `${episode.title} / ${episode.summary}`,
            adminSettings.language === "en" ? "System" : "System",
          ),
        ]);

        await wait(episodeDelay);

        for (const line of episode.lines) {
          if (autoChatRunIdRef.current !== runId) {
            return;
          }

          await waitIfPaused(runId);

          if (adminSettings.typingIndicator && replySpeed > 0) {
            setTypingSpeaker(line.speaker);
            setIsTyping(true);
            await wait(Math.max(220, replySpeed * 6));
            setIsTyping(false);
            setTypingSpeaker("Vault");
          }

          if (adminSettings.typewriterEffect && replySpeed > 0) {
            const assistantMessage = createMessage("assistant", "", line.speaker);
            setMessages((current) => [...current, assistantMessage]);

            await typeText(line.content, replySpeed, (value) => {
              if (autoChatRunIdRef.current !== runId) {
                return;
              }

              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantMessage.id
                    ? { ...message, content: value }
                    : message,
                ),
              );
            });
          } else {
            setMessages((current) => [
              ...current,
              createMessage("assistant", line.content, line.speaker),
            ]);
          }

          await wait(lineDelay);
        }
      }
    } finally {
      if (autoChatRunIdRef.current === runId) {
        setIsTyping(false);
        setIsAutoChatRunning(false);
        setHasAutoChatCompleted(true);
      }
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    const userMessageCount = messages.filter((message) => message.role === "user").length;

    if (
      !trimmed ||
      isSending ||
      isAutoChatRunning ||
      remainingReplyLockMs > 0 ||
      !hasJoinedChat ||
      userMessageCount >= FREE_USER_MESSAGE_LIMIT
    ) {
      if (userMessageCount >= FREE_USER_MESSAGE_LIMIT) {
        finishSession("limit");
      }
      return;
    }

    touchActivity();
    const nextUserMessage = createMessage("user", trimmed, "You");
    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsSending(true);

    try {
      const replySpeed = replySpeedMap[adminSettings.replySpeed];
      const baseTypingLeadDelay = Math.max(900, replySpeed * 20);
      const betweenRepliesDelay = Math.max(680, replySpeed * 16);

      if (adminSettings.typingIndicator) {
        setTypingSpeaker(personas[0]?.name ?? "Vault");
        setIsTyping(true);
        await wait(baseTypingLeadDelay);
      }

      const survey = resolveActiveSurveyPayload();
      let nextReplies = [
        {
          speaker: adminSettings.language === "en" ? "Vault" : "Vault",
          content: await simulateBotReply(trimmed, adminSettings.language),
        },
      ];
      const allowedNames = getAllowedSpeakerNames(personas);

      if (personas.length > 0) {
        nextReplies = buildClientFallbackReplies(trimmed);
      }

      if (personas.length > 0) {
        try {
          const replyResponse = await fetch("/api/reply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              owner: survey.owner,
              personas,
              userMessage: trimmed,
              recentMessages: messages.slice(-8).map((message) => ({
                role: message.role,
                speaker: message.speaker,
                content: message.content,
              })),
              conversationPromptTemplate:
                adminSettings.conversationPromptTemplate,
            }),
          });

          if (replyResponse.ok) {
            const replyData = await replyResponse.json();
            if (replyData.provider === "gemini") {
              setProviderBadge({
                label: "Gemini",
                detail: replyData.model ?? "Gemini reply",
              });
            } else if (replyData.provider === "openrouter") {
              setProviderBadge({
                label: "OpenRouter",
                detail: replyData.model ?? "OpenRouter reply",
              });
            } else {
              setProviderBadge({
                label: "Fallback",
                detail: replyData.model ?? "rules reply",
              });
            }
            if (Array.isArray(replyData.replies) && replyData.replies.length > 0) {
              nextReplies = dedupeReplies(
                replyData.replies.slice(0, 3).map((item: {
                  speaker: string;
                  content: string;
                }) => ({
                  speaker: normalizeSpeakerName(
                    item.speaker,
                    allowedNames,
                    personas[0]?.name ?? "Vault",
                  ),
                  content: item.content,
                })),
                trimmed,
              );
            } else if (
              typeof replyData.speaker === "string" &&
              typeof replyData.content === "string"
            ) {
              nextReplies = dedupeReplies(
                [
                  {
                    speaker: normalizeSpeakerName(
                      replyData.speaker,
                      allowedNames,
                      personas[0]?.name ?? "Vault",
                    ),
                    content: replyData.content,
                  },
                ],
                trimmed,
              );
            }
          }
        } catch {
          // Fall back to local echo if the interactive AI route fails.
        }
      }

      if (adminSettings.typingIndicator) {
        setIsTyping(false);
        setTypingSpeaker("Vault");
      }

      for (const replyEntry of nextReplies) {
        if (adminSettings.typingIndicator) {
          const typingLeadDelay = Math.min(
            2600,
            baseTypingLeadDelay + replyEntry.content.length * 12,
          );
          setTypingSpeaker(replyEntry.speaker);
          setIsTyping(true);
          await wait(typingLeadDelay);
          setIsTyping(false);
        }

        setMessages((current) => [
          ...current,
          createMessage("assistant", replyEntry.content, replyEntry.speaker),
        ]);

        if (nextReplies.length > 1) {
          await wait(betweenRepliesDelay);
        }
      }

      const nextUserMessageCount = userMessageCount + 1;
      if (nextUserMessageCount >= FREE_USER_MESSAGE_LIMIT) {
        finishSession("limit");
      }
    } finally {
      setIsTyping(false);
      setTypingSpeaker("Vault");
      setIsSending(false);
    }
  }

  const countdownSeconds = Math.ceil(remainingReplyLockMs / 1000);
  const userMessageCount = messages.filter((message) => message.role === "user").length;
  const remainingFreeMessages = Math.max(
    0,
    FREE_USER_MESSAGE_LIMIT - userMessageCount,
  );
  const activeRoomUrl = buildRoomUrl();
  const hasReplyAccess =
    hasJoinedChat &&
    remainingReplyLockMs <= 0 &&
    !isAutoChatRunning &&
    !showJoinPrompt &&
    !showJoinQr &&
    !showWelcomeModal;
  const isReplyLocked =
    remainingReplyLockMs > 0 ||
    isAutoChatRunning ||
    !hasJoinedChat ||
    showJoinPrompt ||
    showJoinQr ||
    showWelcomeModal ||
    showFinalQr ||
    remainingFreeMessages <= 0;
  const copy = getChatCopy(adminSettings.language);
  const lockedReason = isAutoChatRunning
    ? countdownSeconds > 0
      ? `Hide/cover your eyes so the devices won't notice you staring at them. ${copy.replyUnlocksIn(countdownSeconds)}`
      : copy.autoGossipRunning
    : countdownSeconds > 0
      ? `Hide/cover your eyes so the devices won't notice you staring at them. ${copy.replyUnlocksIn(countdownSeconds)}`
      : !hasJoinedChat
        ? adminSettings.language === "en"
          ? "Join Backchannel to reply"
          : "Tham gia Backchannel de tra loi"
        : remainingFreeMessages <= 0
          ? "Free chat limit reached"
          : undefined;

  return (
    <main className="mx-auto flex h-[100svh] max-w-5xl flex-col overflow-hidden px-3 py-3 sm:min-h-screen sm:h-auto sm:px-6 sm:py-5">
      <div className="mobile-scale-shell flex min-h-0 flex-1 flex-col sm:w-full sm:scale-100">
        <ChatHeader
          adminSettings={adminSettings}
          onCipherChange={setCameraCipherMode}
          onCameraStateChange={setCameraState}
          trackingEnabled={!hasReplyAccess}
          onPauseToggle={() => setIsAutoChatPaused((current) => !current)}
          isPauseVisible={isAutoChatRunning}
          isPaused={isAutoChatPaused}
          providerBadge={providerBadge}
        />

        <section className="mono-board mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] px-3 py-3 sm:mt-6 sm:h-[calc(100vh-11rem)] sm:min-h-[760px] sm:max-h-[1100px] sm:rounded-[2.4rem] sm:px-5 sm:py-6 md:px-8">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-20 -mx-3 mb-3 flex items-center justify-center bg-[linear-gradient(180deg,#efefea_0%,#ebeae4_82%,rgba(235,234,228,0)_100%)] px-3 pb-3 pt-1 sm:static sm:mx-0 sm:mb-5 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
            <div>
              <h2 className="text-center font-['Arial_Black','Impact','sans-serif'] text-[2rem] font-black uppercase tracking-[0.02em] text-[#151515] sm:text-5xl sm:tracking-[0.01em]">
                Backchannel
              </h2>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-center text-sm font-bold text-[#57524e] sm:text-base">
                  {onlineCount} online
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-transparent">
            <ChatMessages
              messages={messages}
              adminSettings={{
                ...adminSettings,
                cipherMode: hasReplyAccess
                  ? false
                  : adminSettings.cipherMode || cameraCipherMode,
              }}
              isTyping={isTyping}
              typingSpeaker={typingSpeaker}
            />
          </div>

          <div className="sticky bottom-0 z-20 mt-3 -mx-3 bg-[linear-gradient(180deg,rgba(235,234,228,0)_0%,#ebeae4_18%,#efefea_100%)] px-3 pb-1 pt-3 sm:static sm:mx-0 sm:mt-4 sm:border-t-[3px] sm:border-[#2b2b2b] sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4">
            {isTyping ? (
              <TypingIndicator
                speaker={typingSpeaker}
                className="mb-2 flex sm:hidden"
              />
            ) : null}
            <ChatInput
              value={input}
              onChange={(value) => {
                setInput(value);
                touchActivity();
              }}
              onSend={handleSend}
              disabled={isSending || isReplyLocked}
              lockedReason={lockedReason}
            />
            {hasJoinedChat && !showFinalQr ? (
              <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#181818]/45">
                {remainingFreeMessages} free messages left
              </p>
            ) : null}
          </div>
        </div>
        </section>
      </div>

      {showJoinPrompt ? (
        <CenterModal onReset={resetChatSession}>
          <div className="text-center">
            <p className="text-3xl font-black uppercase tracking-[-0.06em] text-[#181818]">
              {adminSettings.language === "en"
                ? "Do you wanna join the chat?"
                : "Do you wanna join the chat?"}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <ModalAction
                label={adminSettings.language === "en" ? "Yes" : "Yes"}
                onClick={() => {
                  touchActivity();
                  setShowJoinPrompt(false);
                  setHasJoinedChat(true);
                  setLastActivityAt(Date.now());
                  setDeclinedJoinChat(false);
                }}
              />
              <ModalAction
                label={adminSettings.language === "en" ? "No" : "No"}
                onClick={() => {
                  touchActivity();
                  setShowJoinPrompt(false);
                  setDeclinedJoinChat(true);
                  finishSession("reset");
                }}
                inverted
              />
            </div>
          </div>
        </CenterModal>
      ) : null}

      {showFeedbackQr ? (
        <CenterModal onReset={resetChatSession}>
          <div className="text-center">
            <p className="text-3xl font-black uppercase tracking-[-0.06em] text-[#181818]">
              {adminSettings.language === "en"
                ? "Save this room"
                : "Luu phong nay"}
            </p>
            <QrPanel
              roomUrl={activeRoomUrl}
              joinCode={joinCode}
              qrImageUrl={buildQrImageUrl(activeRoomUrl)}
            />
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  touchActivity();
                  setShowFeedbackQr(false);
                  setShowJoinQr(true);
                }}
                className="bg-transparent text-[10px] font-semibold tracking-[0.04em] text-[#202020]/55 underline underline-offset-4 transition hover:text-[#202020]"
              >
                {adminSettings.language === "en"
                  ? "In case you change your mind"
                  : "In case you change your mind"}
              </button>
            </div>
          </div>
        </CenterModal>
      ) : null}

      {showWelcomeModal ? (
        <CenterModal onReset={resetChatSession}>
          <div className="text-center">
            <p className="text-3xl font-black uppercase tracking-[-0.06em] text-[#181818]">
              Welcome to Backchannel
            </p>
            <p className="mt-4 text-lg font-semibold text-[#181818]/70">
              you&apos;ve been added to the group chat
            </p>
            <div className="mt-6 flex justify-center">
              <ModalAction
                label={adminSettings.language === "en" ? "Enter chat" : "Vao chat"}
                onClick={() => {
                  touchActivity();
                  setShowWelcomeModal(false);
                }}
              />
            </div>
          </div>
        </CenterModal>
      ) : null}

      {showFinalQr ? (
        <CenterModal onReset={resetChatSession}>
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#181818]/45">
              {finalReason === "limit"
                ? "Free chat limit reached"
                : finalReason === "idle"
                  ? "No activity detected"
                  : "Session saved"}
            </p>
            <p className="mt-3 text-3xl font-black uppercase tracking-[-0.06em] text-[#181818]">
              Want to keep arguing?
            </p>
            <p className="mx-auto mt-3 max-w-md text-base font-semibold leading-7 text-[#4a4a4a]">
              Buy @mee.ltt cafe to keep the AI agent awake. Scan this QR and
              enter the code to view device stats, assigned personalities, and
              this conversation history on mobile.
            </p>
            <QrPanel
              roomUrl={activeRoomUrl}
              joinCode={joinCode}
              qrImageUrl={buildQrImageUrl(activeRoomUrl)}
            />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#181818]/45">
              This display resets to survey in 2 minutes.
            </p>
          </div>
        </CenterModal>
      ) : null}

      <p className="pointer-events-none fixed bottom-3 left-4 z-40 max-w-[52vw] text-[10px] font-semibold leading-4 text-[#4a4a4a] sm:max-w-lg sm:text-[11px]">
        By participating in this experience, you agree that the interaction,
        provided responses, and generated conversation may be recorded and used
        as part of the Backchannel installation.
      </p>
      <p className="pointer-events-none fixed bottom-3 right-4 z-40 text-[10px] font-black uppercase tracking-[0.14em] text-[#e879b9] sm:text-[11px]">
        create by @mee.ltt
      </p>
    </main>
  );
}

function QrPanel({
  roomUrl,
  joinCode,
  qrImageUrl,
}: {
  roomUrl: string;
  joinCode: string;
  qrImageUrl: string;
}) {
  return (
    <div className="mx-auto mt-6 max-w-sm">
      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-[1.5rem] border-[2px] border-[#202020] bg-white p-3">
        {roomUrl ? (
          <img
            src={qrImageUrl}
            alt="Backchannel room QR code"
            className="h-full w-full rounded-[1rem] object-contain"
          />
        ) : (
          <span className="text-xs font-black uppercase tracking-[0.22em] text-[#111]/45">
            QR loading
          </span>
        )}
      </div>
      <div className="mt-4 rounded-[1rem] border-[2px] border-[#202020] bg-white px-4 py-3 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#181818]/45">
          Join code
        </p>
        <p className="mt-1 text-3xl font-black tracking-[0.14em] text-[#181818]">
          {joinCode}
        </p>
        <p className="mt-3 break-all text-xs font-semibold leading-5 text-[#181818]/55">
          {roomUrl}
        </p>
      </div>
    </div>
  );
}

function CenterModal({
  children,
  onReset,
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onReset}
        className="fixed right-6 top-6 rounded-full border-[2px] border-[#f7f7f3] bg-transparent px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#f7f7f3] transition hover:bg-[#f7f7f3] hover:text-[#202020]"
      >
        Reset
      </button>
      <div className="w-full max-w-xl rounded-[2rem] border-[2px] border-[#202020] bg-[#f7f7f3] p-8 shadow-[0_16px_80px_rgba(0,0,0,0.3)]">
        {children}
      </div>
    </div>
  );
}

function ModalAction({
  label,
  onClick,
  inverted = false,
}: {
  label: string;
  onClick: () => void;
  inverted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-[2px] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition ${
        inverted
          ? "border-[#202020] bg-transparent text-[#202020] hover:bg-[#202020] hover:text-[#f7f7f3]"
          : "border-[#202020] bg-[#202020] text-[#f7f7f3] hover:bg-transparent hover:text-[#202020]"
      }`}
    >
      {label}
    </button>
  );
}
