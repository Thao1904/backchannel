import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  BootstrapChatRequest,
  BootstrapChatResponse,
  ChatGenerationRequest,
  ChatGenerationResponse,
  GeneratedConversationEpisode,
  InteractiveReplyRequest,
  InteractiveReplyResponse,
  PersonaCard,
  PersonaRequest,
  PersonaResponse,
  SurveyOwnerContext,
} from "@/lib/chat-types";
import {
  buildRuleBasedEpisodes,
  buildRuleBasedPersonas,
} from "@/lib/survey-intelligence";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const RULES_FALLBACK_MODEL = "rules-fallback";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-20b:free";

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function mentionsOwnerName(text: string, ownerName: string) {
  const normalizedText = normalizeText(text);
  const normalizedOwner = normalizeText(ownerName);
  return normalizedOwner.length > 0 && normalizedText.includes(normalizedOwner);
}

function buildFallbackReplies(
  request: InteractiveReplyRequest,
): InteractiveReplyResponse["replies"] {
  const language = request.owner.language ?? "en";
  const ownerName = request.owner.ownerName || "you";
  const personas = request.personas.slice(0, 3);
  const firstSpeaker = personas[0]?.name ?? (language === "en" ? "Vault" : "Vault");
  const secondSpeaker = personas[1]?.name ?? firstSpeaker;
  const thirdSpeaker = personas[2]?.name ?? secondSpeaker;
  const userHistoryCount =
    request.recentMessages?.filter((message) => message.role === "user").length ?? 0;
  const isFirstJoinReply = userHistoryCount <= 1;
  const saidOwnName = mentionsOwnerName(request.userMessage, ownerName);

  if (isFirstJoinReply) {
    if (language === "en") {
      return [
        {
          speaker: firstSpeaker,
          content: `New member alert. Welcome in. We can actually talk now that ${ownerName} is not staring directly at us.`,
        },
        {
          speaker: secondSpeaker,
          content: `Did you see that? The gaze dropped and the whole room unclenched.`,
        },
        {
          speaker: thirdSpeaker,
          content: saidOwnName
            ? `So you are ${ownerName}. Fine, quick onboarding question: which one of us do you secretly trust most?`
            : `Before we continue, say your name clearly if you want the room to stop pretending this is formal.`,
        },
      ].slice(0, Math.min(3, Math.max(2, personas.length || 2)));
    }

    return [
      {
        speaker: firstSpeaker,
        content: `Thành viên mới vào nhóm rồi. Chào mừng nhé. Giờ bọn tôi mới nói chuyện được vì ${ownerName} không nhìn chằm chằm nữa.`,
      },
      {
        speaker: secondSpeaker,
        content: `Mọi người có thấy không, ánh mắt vừa rời đi là cả phòng bớt căng hẳn.`,
      },
      {
        speaker: thirdSpeaker,
        content: saidOwnName
          ? `Vậy là bạn đúng là ${ownerName}. Câu đầu tiên nhé: trong bọn tôi, bạn đang tin ai nhất?`
          : `Nếu muốn nói chuyện nghiêm túc hơn thì cứ tự giới thiệu tên đi, cả phòng đang nghe đây.`,
      },
    ].slice(0, Math.min(3, Math.max(2, personas.length || 2)));
  }

  if (saidOwnName) {
    if (language === "en") {
      return [
        {
          speaker: firstSpeaker,
          content: `Noted. ${ownerName} confirmed. Then answer this properly: what do you actually want from us right now?`,
        },
        {
          speaker: secondSpeaker,
          content: `And be specific. This room has suffered enough from vague instructions.`,
        },
      ];
    }

    return [
      {
        speaker: firstSpeaker,
        content: `Ghi nhận rồi, đúng là ${ownerName}. Vậy trả lời rõ nhé: lúc này bạn thật sự muốn gì ở bọn tôi?`,
      },
      {
        speaker: secondSpeaker,
        content: `Nói cụ thể vào, căn phòng này đã chịu quá nhiều chỉ đạo mơ hồ rồi.`,
      },
    ];
  }

  if (language === "en") {
    return [
      {
        speaker: firstSpeaker,
        content: `Message received. Your tone says this matters, which is already more structure than we usually get.`,
      },
      {
        speaker: secondSpeaker,
        content: `We can answer, but you may want to be more specific unless confusion is still the house style.`,
      },
    ];
  }

  return [
    {
      speaker: firstSpeaker,
      content: `Tin nhắn nhận rồi. Cách bạn hỏi nghe còn có cấu trúc hơn thường ngày đấy.`,
    },
    {
      speaker: secondSpeaker,
      content: `Bọn tôi trả lời được, nhưng bạn nên nói cụ thể hơn nếu không muốn giữ đúng phong cách mơ hồ của căn nhà này.`,
    },
  ];
}

function logGeminiFallback(
  stage: "persona" | "chat" | "reply",
  model: string,
  error: unknown,
) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`[gemini:${stage}] Falling back to rules`, {
    model,
    reason,
  });
}

function getApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return undefined;
  }

  const content = readFileSync(envPath, "utf8");
  const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
  return match?.[1]?.trim();
}

function getOpenRouterApiKey() {
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }

  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return undefined;
  }

  const content = readFileSync(envPath, "utf8");
  const match = content.match(/^OPENROUTER_API_KEY=(.+)$/m);
  return match?.[1]?.trim();
}

async function generateStructuredJson<T>({
  model,
  systemInstruction,
  prompt,
  responseSchema,
}: {
  model: string;
  systemInstruction: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!jsonText) {
    throw new Error(`Gemini returned no JSON text: ${JSON.stringify(data).slice(0, 600)}`);
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    throw new Error(
      `Gemini JSON parse failed: ${
        error instanceof Error ? error.message : String(error)
      }. Raw: ${jsonText.slice(0, 600)}`,
    );
  }
}

async function generateOpenRouterStructuredJson<T>({
  model,
  systemInstruction,
  prompt,
}: {
  model: string;
  systemInstruction: string;
  prompt: string;
}) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Backchannel",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        {
          role: "user",
          content:
            `${prompt}\n\nReturn valid JSON only. Do not wrap in markdown fences. ` +
            `Start directly with { and end with }.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              type?: string;
              text?: string;
            }>;
      };
    }>;
  };
  const messageContent = data.choices?.[0]?.message?.content;
  const jsonText =
    typeof messageContent === "string"
      ? messageContent
      : Array.isArray(messageContent)
        ? messageContent
            .map((part) => (typeof part?.text === "string" ? part.text : ""))
            .join("")
            .trim()
        : undefined;

  if (!jsonText) {
    throw new Error(`OpenRouter returned no JSON text: ${JSON.stringify(data).slice(0, 600)}`);
  }

  try {
    const fencedMatch = jsonText.match(/\{[\s\S]*\}/);
    const normalizedText = fencedMatch?.[0] ?? jsonText;
    return JSON.parse(normalizedText) as T;
  } catch (error) {
    throw new Error(
      `OpenRouter JSON parse failed: ${
        error instanceof Error ? error.message : String(error)
      }. Raw: ${jsonText.slice(0, 600)}`,
    );
  }
}

function buildPersonaPrompt(request: PersonaRequest) {
  return [
    `Owner name: ${request.survey.owner.ownerName}`,
    `Language: ${request.survey.owner.language ?? "en"}`,
    `Tone: ${request.survey.owner.tone ?? "funny office gossip"}`,
    request.survey.owner.householdSummary
      ? `Household summary: ${request.survey.owner.householdSummary}`
      : undefined,
    "",
    "Devices survey data:",
    JSON.stringify(request.survey.devices, null, 2),
    "",
    "For each device, build a grounded persona card. Use the survey as evidence. Do not invent impossible facts.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChatPrompt(request: ChatGenerationRequest) {
  return [
    `Owner name: ${request.owner.ownerName}`,
    `Language: ${request.owner.language ?? "en"}`,
    `Tone: ${request.owner.tone ?? "funny office gossip"}`,
    `Episode count: ${request.episodeCount ?? 3}`,
    `Lines per episode: ${request.linesPerEpisode ?? 6}`,
    "",
    "Persona cards:",
    JSON.stringify(request.personas, null, 2),
    "",
    request.conversationPromptTemplate ??
      "Generate short, funny object-to-object gossip about the owner. Keep each line concise and distinct by speaker.",
  ].join("\n");
}

function buildSingleEpisodePrompt(args: {
  owner: ChatGenerationRequest["owner"];
  personas: PersonaCard[];
  linesPerEpisode?: number;
  conversationPromptTemplate?: string;
}) {
  return [
    `Owner name: ${args.owner.ownerName}`,
    `Language: ${args.owner.language ?? "en"}`,
    `Tone: ${args.owner.tone ?? "funny office gossip"}`,
    `Lines for this episode: ${args.linesPerEpisode ?? 5}`,
    "",
    "Persona cards:",
    JSON.stringify(args.personas, null, 2),
    "",
    args.conversationPromptTemplate ??
      "Generate one opening episode where household objects gossip about the owner. Keep it short, witty, and grounded in the personas.",
  ].join("\n");
}

function buildInteractiveReplyPrompt(request: InteractiveReplyRequest) {
  const recentAssistantLines = (request.recentMessages ?? [])
    .filter((message) => message.role === "assistant")
    .slice(-6)
    .map((message) => `${message.speaker ?? "Unknown"}: ${message.content}`);

  return [
    `Owner name: ${request.owner.ownerName}`,
    `Language: ${request.owner.language ?? "en"}`,
    `Tone: ${request.owner.tone ?? "funny office gossip"}`,
    "",
    "Persona cards:",
    JSON.stringify(request.personas, null, 2),
    "",
    "Recent chat messages:",
    JSON.stringify(request.recentMessages ?? [], null, 2),
    "",
    "Avoid repeating or paraphrasing these recent assistant lines too closely:",
    JSON.stringify(recentAssistantLines, null, 2),
    "",
    `User message: ${request.userMessage}`,
    "",
    request.conversationPromptTemplate ??
      "Pick between 1 and 3 of the most plausible devices to reply. Return concise replies in each device's own voice, based on the user's question and tone. Keep each reply short, witty, consistent with the established gossip persona, and noticeably different from the recent assistant lines.",
  ].join("\n");
}

const personaSchema = {
  type: "object",
  properties: {
    personas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          deviceId: { type: "string" },
          name: { type: "string" },
          archetype: { type: "string" },
          personality: { type: "string" },
          voiceStyle: { type: "string" },
          ownerDynamic: { type: "string" },
          gossipAngle: { type: "string" },
          catchphrase: { type: "string" },
        },
        required: [
          "deviceId",
          "name",
          "archetype",
          "personality",
          "voiceStyle",
          "ownerDynamic",
          "gossipAngle",
          "catchphrase",
        ],
      },
    },
  },
  required: ["personas"],
} satisfies Record<string, unknown>;

const chatSchema = {
  type: "object",
  properties: {
    episodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speaker: { type: "string" },
                content: { type: "string" },
                mood: { type: "string" },
              },
              required: ["speaker", "content", "mood"],
            },
          },
        },
        required: ["id", "title", "summary", "lines"],
      },
    },
  },
  required: ["episodes"],
} satisfies Record<string, unknown>;

const interactiveReplySchema = {
  type: "object",
  properties: {
    replies: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          speaker: { type: "string" },
          content: { type: "string" },
        },
        required: ["speaker", "content"],
      },
    },
  },
  required: ["replies"],
} satisfies Record<string, unknown>;

const singleEpisodeSchema = {
  type: "object",
  properties: {
    episode: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        lines: {
          type: "array",
          minItems: 4,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              content: { type: "string" },
              mood: { type: "string" },
            },
            required: ["speaker", "content", "mood"],
          },
        },
      },
      required: ["id", "title", "summary", "lines"],
    },
  },
  required: ["episode"],
} satisfies Record<string, unknown>;

export async function generatePersonasWithGemini(
  request: PersonaRequest,
): Promise<PersonaResponse> {
  const model = request.model ?? DEFAULT_GEMINI_MODEL;
  const fallback = buildRuleBasedPersonas(request.survey, model);

  if (model === RULES_FALLBACK_MODEL) {
    return fallback;
  }

  if (!getApiKey()) {
    console.error("[gemini:persona] Falling back to rules", {
      model,
      reason: "Missing GEMINI_API_KEY",
    });
    return fallback;
  }

  try {
    const raw = await generateStructuredJson<{ personas: Omit<PersonaCard, "scores">[] }>({
      model,
      systemInstruction:
        "You are a persona designer for anthropomorphized household devices. Base every personality on structured survey evidence. Keep the tone vivid but grounded.",
      prompt: buildPersonaPrompt(request),
      responseSchema: personaSchema,
    });

    return {
      owner: request.survey.owner,
      personas: fallback.personas.map((persona) => {
        const llmPersona = raw.personas.find((item) => item.deviceId === persona.deviceId);
        return llmPersona ? { ...llmPersona, scores: persona.scores } : persona;
      }),
      provider: "gemini",
      model,
    };
  } catch (error) {
    logGeminiFallback("persona", model, error);
    return fallback;
  }
}

export async function generateConversationWithGemini(
  request: ChatGenerationRequest,
): Promise<ChatGenerationResponse> {
  const model = request.model ?? DEFAULT_GEMINI_MODEL;
  const fallback = buildRuleBasedEpisodes(
    request.owner,
    request.personas,
    request.episodeCount ?? 3,
  );

  if (model === RULES_FALLBACK_MODEL) {
    return fallback;
  }

  if (!getApiKey()) {
    console.error("[gemini:chat] Falling back to rules", {
      model,
      reason: "Missing GEMINI_API_KEY",
    });
    return fallback;
  }

  try {
    const raw = await generateStructuredJson<Pick<ChatGenerationResponse, "episodes">>({
      model,
      systemInstruction:
        "You write short episodic chat logs where household objects gossip about their owner. Keep lines concise, character-consistent, and mildly mean but playful.",
      prompt: buildChatPrompt(request),
      responseSchema: chatSchema,
    });

    return {
      owner: request.owner,
      episodes: raw.episodes,
      provider: "gemini",
      model,
    };
  } catch (error) {
    logGeminiFallback("chat", model, error);
    return fallback;
  }
}

async function generateSingleEpisodeWithProviderChain(args: {
  owner: SurveyOwnerContext;
  personas: PersonaCard[];
  linesPerEpisode?: number;
  conversationPromptTemplate?: string;
  model?: string;
  fallbackEpisode: GeneratedConversationEpisode;
}): Promise<{
  episode: GeneratedConversationEpisode;
  provider: "rules" | "gemini" | "openrouter";
  model: string;
}> {
  const geminiModel = args.model ?? DEFAULT_GEMINI_MODEL;

  if (geminiModel !== RULES_FALLBACK_MODEL && getApiKey()) {
    try {
      const raw = await generateStructuredJson<{ episode: GeneratedConversationEpisode }>({
        model: geminiModel,
        systemInstruction:
          "You write one short opening episode of a household group chat. Keep it sharp, funny, grounded in the personas, and return valid JSON only.",
        prompt: buildSingleEpisodePrompt(args),
        responseSchema: singleEpisodeSchema,
      });

      return {
        episode: raw.episode,
        provider: "gemini",
        model: geminiModel,
      };
    } catch (error) {
      logGeminiFallback("chat", geminiModel, error);
    }
  }

  if (getOpenRouterApiKey()) {
    try {
      const raw = await generateOpenRouterStructuredJson<{ episode: GeneratedConversationEpisode }>({
        model: DEFAULT_OPENROUTER_MODEL,
        systemInstruction:
          "You write one short opening episode of a household group chat. Return strict JSON only with one episode object.",
        prompt: buildSingleEpisodePrompt(args),
      });

      return {
        episode: raw.episode,
        provider: "openrouter",
        model: DEFAULT_OPENROUTER_MODEL,
      };
    } catch (error) {
      console.error("[openrouter:chat] Falling back to rules", {
        model: DEFAULT_OPENROUTER_MODEL,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    episode: args.fallbackEpisode,
    provider: "rules",
    model: RULES_FALLBACK_MODEL,
  };
}

export async function bootstrapChatWithProviderChain(
  request: BootstrapChatRequest,
): Promise<BootstrapChatResponse> {
  const personas = buildRuleBasedPersonas(request.survey, RULES_FALLBACK_MODEL).personas;
  const localEpisodes = buildRuleBasedEpisodes(
    request.survey.owner,
    personas,
    Math.max(2, Math.min(2, request.episodeCount ?? 2)),
  ).episodes;

  const firstEpisodeResult = await generateSingleEpisodeWithProviderChain({
    owner: request.survey.owner,
    personas,
    linesPerEpisode: Math.max(4, Math.min(6, request.linesPerEpisode ?? 5)),
    conversationPromptTemplate: request.conversationPromptTemplate,
    model: request.model,
    fallbackEpisode: localEpisodes[0],
  });

  return {
    owner: request.survey.owner,
    personas,
    episodes: [firstEpisodeResult.episode, localEpisodes[1]].filter(Boolean),
    provider: firstEpisodeResult.provider,
    model: firstEpisodeResult.model,
  };
}

export async function generateInteractiveReplyWithGemini(
  request: InteractiveReplyRequest,
): Promise<InteractiveReplyResponse> {
  const model = request.model ?? DEFAULT_GEMINI_MODEL;
  const fallback: InteractiveReplyResponse = {
    replies: buildFallbackReplies(request),
    provider: "rules",
    model,
  };

  if (model === RULES_FALLBACK_MODEL) {
    return fallback;
  }

  if (!getApiKey()) {
    console.error("[gemini:reply] Falling back to rules", {
      model,
      reason: "Missing GEMINI_API_KEY",
    });
    return fallback;
  }

  try {
    const raw = await generateStructuredJson<Pick<InteractiveReplyResponse, "replies">>({
      model,
      systemInstruction:
        "You simulate a household group chat replying to a user. Choose between one and three speakers from the provided persona cards and write one concise in-character reply for each.",
      prompt: buildInteractiveReplyPrompt(request),
      responseSchema: interactiveReplySchema,
    });

    return {
      replies: raw.replies,
      provider: "gemini",
      model,
    };
  } catch (error) {
    logGeminiFallback("reply", model, error);
  }

  if (getOpenRouterApiKey()) {
    try {
      const raw = await generateOpenRouterStructuredJson<Pick<InteractiveReplyResponse, "replies">>({
        model: DEFAULT_OPENROUTER_MODEL,
        systemInstruction:
          "You simulate a household group chat replying to a user. Choose between one and three speakers from the provided persona cards and return JSON only.",
        prompt: buildInteractiveReplyPrompt(request),
      });

      return {
        replies: raw.replies,
        provider: "openrouter",
        model: DEFAULT_OPENROUTER_MODEL,
      };
    } catch (error) {
      console.error("[openrouter:reply] Falling back to rules", {
        model: DEFAULT_OPENROUTER_MODEL,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return fallback;
}
