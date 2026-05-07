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
    };

    upsertConversationArchive(archiveRecord);
  }, [
    currentSessionId,
    documents,
    hasHydrated,
    messages,
    personas,
    providerBadge.detail,
    providerBadge.label,
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
      isAutoChatRunning ||
      remainingReplyLockMs > 0 ||
      hasJoinedChat ||
      hasDismissedJoinPrompt
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowJoinPrompt(true);
      setHasDismissedJoinPrompt(true);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    hasDismissedJoinPrompt,
    hasHydrated,
    hasJoinedChat,
    isAutoChatRunning,
    remainingReplyLockMs,
  ]);

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
    window.location.href = "/chat";
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
      }
    }
  }

  async function handleSend() {
    const trimmed = input.trim();

    if (
      !trimmed ||
      isSending ||
      isAutoChatRunning ||
      remainingReplyLockMs > 0 ||
      !hasJoinedChat
    ) {
      return;
    }

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
    } finally {
      setIsTyping(false);
      setTypingSpeaker("Vault");
      setIsSending(false);
    }
  }

  const countdownSeconds = Math.ceil(remainingReplyLockMs / 1000);
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
    showWelcomeModal;
  const copy = getChatCopy(adminSettings.language);
  const lockedReason = isAutoChatRunning
    ? copy.autoGossipRunning
    : countdownSeconds > 0
      ? copy.replyUnlocksIn(countdownSeconds)
      : !hasJoinedChat
        ? adminSettings.language === "en"
          ? "Join Backchannel to reply"
          : "Tham gia Backchannel de tra loi"
      : undefined;

  return (
    <main className="mx-auto flex h-[100svh] max-w-5xl flex-col overflow-hidden px-3 py-3 sm:min-h-screen sm:h-auto sm:px-6 sm:py-5">
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
              <h2 className="text-center font-['Arial_Black','Impact','sans-serif'] text-[2rem] font-black uppercase tracking-[-0.09em] text-[#151515] sm:text-5xl">
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
              onChange={setInput}
              onSend={handleSend}
              disabled={isSending || isReplyLocked}
              lockedReason={lockedReason}
            />
          </div>
        </div>
      </section>

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
                  setShowJoinPrompt(false);
                  setShowJoinQr(true);
                }}
              />
              <ModalAction
                label={adminSettings.language === "en" ? "No" : "No"}
                onClick={() => {
                  setShowJoinPrompt(false);
                  setDeclinedJoinChat(true);
                  setShowFeedbackQr(true);
                }}
                inverted
              />
            </div>
          </div>
        </CenterModal>
      ) : null}

      {showJoinQr ? (
        <CenterModal onReset={resetChatSession}>
          <div className="text-center">
            <p className="text-3xl font-black uppercase tracking-[-0.06em] text-[#181818]">
              {adminSettings.language === "en"
                ? "Scan to join Backchannel"
                : "Scan de vao Backchannel"}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowJoinQr(false);
                setShowWelcomeModal(true);
                setHasJoinedChat(true);
                setDeclinedJoinChat(false);
              }}
              className="mx-auto mt-6 flex h-56 w-56 items-center justify-center rounded-[1.75rem] border-[2px] border-[#202020] bg-[repeating-linear-gradient(45deg,#111_0px,#111_12px,#2c2c2c_12px,#2c2c2c_24px)] text-xs font-black uppercase tracking-[0.22em] text-white"
            >
              QR Placeholder
            </button>
            <p className="mt-3 text-sm font-medium text-[#181818]/60">
              {adminSettings.language === "en"
                ? "Click the QR placeholder to simulate a successful scan."
                : "Click vao QR placeholder de gia lap scan thanh cong."}
            </p>
          </div>
        </CenterModal>
      ) : null}

      {showFeedbackQr ? (
        <CenterModal onReset={resetChatSession}>
          <div className="text-center">
            <p className="text-3xl font-black uppercase tracking-[-0.06em] text-[#181818]">
              {adminSettings.language === "en"
                ? "Feedback QR"
                : "Feedback QR"}
            </p>
            <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center rounded-[1.75rem] border-[2px] border-[#202020] bg-[repeating-linear-gradient(45deg,#dad7d0_0px,#dad7d0_12px,#b8b2a8_12px,#b8b2a8_24px)] text-xs font-black uppercase tracking-[0.22em] text-[#111]">
              QR Placeholder
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
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
                  setShowWelcomeModal(false);
                }}
              />
            </div>
          </div>
        </CenterModal>
      ) : null}
    </main>
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
