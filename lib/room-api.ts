import { createHash, randomUUID } from "node:crypto";
import type { ChatMessage, PersonaCard, SurveyCollectionPayload } from "@/lib/chat-types";
import { generateInteractiveReplyWithGemini } from "@/lib/gemini";
import { buildRuleBasedPersonas } from "@/lib/survey-intelligence";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FREE_USER_MESSAGE_LIMIT = 8;

function headers() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

async function readSupabase(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: headers(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function writeSupabase(path: string, init: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function hashJoinCode(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function toClientMessage(message: {
  id: string;
  role: "user" | "assistant";
  speaker?: string;
  content: string;
  created_at: string;
}): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    speaker: message.speaker,
    content: message.content,
    createdAt: new Date(message.created_at).getTime(),
  };
}

export async function loadRoomByJoinCode(joinCode: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { configured: false };
  }

  const codeHash = hashJoinCode(joinCode);
  const rooms = await readSupabase(
    `chat_rooms?join_code_hash=eq.${encodeURIComponent(codeHash)}&select=*`,
  );
  const room = Array.isArray(rooms) ? rooms[0] : null;

  if (!room) {
    return { configured: true, requiresCode: true };
  }

  const sessions = await readSupabase(
    `survey_sessions?id=eq.${encodeURIComponent(room.survey_session_id)}&select=*`,
  );
  const messages = await readSupabase(
    `chat_messages?room_id=eq.${encodeURIComponent(room.id)}&order=created_at.asc&select=*`,
  );

  return {
    configured: true,
    room,
    survey: Array.isArray(sessions) ? sessions[0] : null,
    messages,
  };
}

export async function sendRoomMessage(joinCode: string, userMessage: string) {
  const loaded = await loadRoomByJoinCode(joinCode);

  if (!loaded.configured) {
    return loaded;
  }

  if (loaded.requiresCode || !("room" in loaded) || !loaded.room) {
    return { configured: true, requiresCode: true };
  }

  const room = loaded.room as {
    id: string;
    status: string;
    user_message_count: number;
    survey_session_id: string;
  };
  const surveyRecord = loaded.survey as { survey_payload?: SurveyCollectionPayload } | null;
  const survey = surveyRecord?.survey_payload;
  const messages = Array.isArray(loaded.messages) ? loaded.messages : [];
  const currentUserCount =
    typeof room.user_message_count === "number"
      ? room.user_message_count
      : messages.filter((message) => message.role === "user").length;

  if (!survey) {
    return { configured: true, error: "Missing survey payload." };
  }

  if (room.status !== "active" || currentUserCount >= FREE_USER_MESSAGE_LIMIT) {
    return {
      ...loaded,
      locked: true,
    };
  }

  const now = new Date();
  const userRow = {
    id: `mobile-user-${randomUUID()}`,
    room_id: room.id,
    role: "user",
    speaker: "You",
    content: userMessage,
    created_at: now.toISOString(),
  };

  await writeSupabase("chat_messages", {
    method: "POST",
    body: JSON.stringify(userRow),
  });

  const personas: PersonaCard[] = buildRuleBasedPersonas(survey).personas;
  const recentMessages = [...messages, userRow].slice(-8).map(toClientMessage);
  const reply = await generateInteractiveReplyWithGemini({
    owner: survey.owner,
    personas,
    userMessage,
    recentMessages,
  });

  const replyRows = reply.replies.slice(0, 3).map((item) => ({
    id: `mobile-assistant-${randomUUID()}`,
    room_id: room.id,
    role: "assistant",
    speaker: item.speaker,
    content: item.content,
    created_at: new Date().toISOString(),
  }));

  if (replyRows.length > 0) {
    await writeSupabase("chat_messages", {
      method: "POST",
      body: JSON.stringify(replyRows),
    });
  }

  const nextUserCount = currentUserCount + 1;
  const nextStatus =
    nextUserCount >= FREE_USER_MESSAGE_LIMIT ? "locked_free_limit" : "active";

  await writeSupabase(`chat_rooms?id=eq.${encodeURIComponent(room.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_message_count: nextUserCount,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }),
  });

  await writeSupabase(
    `survey_sessions?id=eq.${encodeURIComponent(room.survey_session_id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: nextStatus === "active" ? "active" : "completed",
        updated_at: new Date().toISOString(),
      }),
    },
  );

  return loadRoomByJoinCode(joinCode);
}
