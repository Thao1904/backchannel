import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    rating?: number;
    message?: string;
    contact?: string;
    pagePath?: string;
  };

  const message = body.message?.trim() ?? "";
  const contact = body.contact?.trim() ?? "";
  const rating = Number(body.rating);

  if (!message && !Number.isFinite(rating)) {
    return NextResponse.json(
      { error: "Please add a rating or feedback message." },
      { status: 400 },
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ stored: "local-only" });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: `feedback-${randomUUID()}`,
      rating: Number.isFinite(rating) ? Math.max(1, Math.min(5, rating)) : null,
      message,
      contact,
      page_path: body.pagePath ?? null,
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: await response.text() },
      { status: response.status },
    );
  }

  return NextResponse.json({ stored: "supabase" });
}
