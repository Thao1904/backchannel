import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import type { ConversationArchiveRecord } from "@/lib/chat-types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseHeaders(extra?: HeadersInit) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabaseRequest(path: string, init: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: supabaseHeaders(init.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${path} failed: ${detail}`);
  }

  return response;
}

function hashJoinCode(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const record = (await request.json()) as ConversationArchiveRecord;

  if (!record?.sessionId || !record.roomCode || !record.joinCode || !record.survey) {
    return NextResponse.json(
      { error: "Missing sessionId, roomCode, joinCode, or survey." },
      { status: 400 },
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ stored: "local-only" });
  }

  const userMessageCount = record.messages.filter(
    (message) => message.role === "user",
  ).length;

  await supabaseRequest("survey_sessions?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: record.sessionId,
      owner_name: record.owner.ownerName,
      survey_payload: record.survey,
      survey_signature: record.surveySignature,
      status: record.status ?? "active",
      created_at: new Date(record.createdAt).toISOString(),
      updated_at: new Date(record.updatedAt).toISOString(),
    }),
  });

  await supabaseRequest("chat_rooms?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: record.sessionId,
      survey_session_id: record.sessionId,
      room_code: record.roomCode,
      join_code_hash: hashJoinCode(record.joinCode),
      room_url: record.roomUrl,
      status: record.status ?? "active",
      free_message_limit: 8,
      user_message_count: userMessageCount,
      created_at: new Date(record.createdAt).toISOString(),
      updated_at: new Date(record.updatedAt).toISOString(),
    }),
  });

  await supabaseRequest(`chat_messages?room_id=eq.${encodeURIComponent(record.sessionId)}`, {
    method: "DELETE",
  });

  if (record.messages.length > 0) {
    await supabaseRequest("chat_messages", {
      method: "POST",
      body: JSON.stringify(
        record.messages.map((message) => ({
          id: message.id,
          room_id: record.sessionId,
          role: message.role,
          speaker: message.speaker,
          content: message.content,
          created_at: new Date(message.createdAt).toISOString(),
        })),
      ),
    });
  }

  return NextResponse.json({ stored: "supabase" });
}
