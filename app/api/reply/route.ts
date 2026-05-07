import { NextResponse } from "next/server";
import type {
  InteractiveReplyRequest,
  PersonaCard,
  SurveyOwnerContext,
} from "@/lib/chat-types";
import { generateInteractiveReplyWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidOwner(owner: unknown): owner is SurveyOwnerContext {
  if (!owner || typeof owner !== "object") {
    return false;
  }

  return typeof (owner as Partial<SurveyOwnerContext>).ownerName === "string";
}

function isValidPersona(persona: unknown): persona is PersonaCard {
  if (!persona || typeof persona !== "object") {
    return false;
  }

  const candidate = persona as Partial<PersonaCard>;
  return (
    typeof candidate.deviceId === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.personality === "string" &&
    !!candidate.scores
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<InteractiveReplyRequest>;

    if (
      !isValidOwner(body.owner) ||
      !Array.isArray(body.personas) ||
      !body.personas.every(isValidPersona) ||
      typeof body.userMessage !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid reply payload. Expected owner, personas[], and userMessage.",
        },
        { status: 400 },
      );
    }

    const response = await generateInteractiveReplyWithGemini({
      owner: body.owner,
      personas: body.personas,
      userMessage: body.userMessage,
      recentMessages: body.recentMessages,
      model: body.model,
      conversationPromptTemplate: body.conversationPromptTemplate,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate interactive reply.",
      },
      { status: 500 },
    );
  }
}
