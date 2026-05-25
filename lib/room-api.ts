import { createHash } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function hashJoinCode(value: string) {
  return createHash("sha256").update(value).digest("hex");
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
