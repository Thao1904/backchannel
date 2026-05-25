import { NextResponse } from "next/server";

const ADMIN_PASSWORD = "12345";
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const password = url.searchParams.get("password");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ configured: false, sessions: [] });
  }

  const [sessions, rooms, messages] = await Promise.all([
    readSupabase("survey_sessions?select=*&order=updated_at.desc&limit=200"),
    readSupabase("chat_rooms?select=*&order=updated_at.desc&limit=200"),
    readSupabase("chat_messages?select=*&order=created_at.asc&limit=5000"),
  ]);

  return NextResponse.json({
    configured: true,
    sessions: Array.isArray(sessions) ? sessions : [],
    rooms: Array.isArray(rooms) ? rooms : [],
    messages: Array.isArray(messages) ? messages : [],
  });
}
