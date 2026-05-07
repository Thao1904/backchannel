import { NextResponse } from "next/server";
import type {
  ChatGenerationRequest,
  PersonaCard,
  SurveyOwnerContext,
} from "@/lib/chat-types";
import { generateConversationWithGemini } from "@/lib/gemini";

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
    typeof candidate.archetype === "string" &&
    typeof candidate.personality === "string" &&
    typeof candidate.voiceStyle === "string" &&
    typeof candidate.ownerDynamic === "string" &&
    typeof candidate.gossipAngle === "string" &&
    typeof candidate.catchphrase === "string" &&
    !!candidate.scores &&
    typeof candidate.scores === "object"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChatGenerationRequest>;

    if (!isValidOwner(body.owner) || !Array.isArray(body.personas) || !body.personas.every(isValidPersona)) {
      return NextResponse.json(
        {
          error:
            "Invalid chat payload. Expected owner + personas[] from /api/persona.",
        },
        { status: 400 },
      );
    }

    const response = await generateConversationWithGemini({
      owner: body.owner,
      personas: body.personas,
      episodeCount: body.episodeCount,
      linesPerEpisode: body.linesPerEpisode,
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
            : "Failed to generate chat episodes.",
      },
      { status: 500 },
    );
  }
}
