import { NextResponse } from "next/server";
import type {
  BootstrapChatRequest,
  SurveyCollectionPayload,
  SurveyDeviceRecord,
} from "@/lib/chat-types";
import { bootstrapChatWithProviderChain } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidDevice(device: unknown): device is SurveyDeviceRecord {
  if (!device || typeof device !== "object") {
    return false;
  }

  const candidate = device as Partial<SurveyDeviceRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    [1, 2, 3, 4, 5].includes(candidate.likeScore as number) &&
    ["rarely", "sometimes", "everyday", "constantly"].includes(
      candidate.frequency as string,
    ) &&
    typeof candidate.helpfulnessPercent === "number" &&
    [1, 2, 3, 4, 5].includes(candidate.easeOfUseScore as number)
  );
}

function isValidSurveyPayload(payload: unknown): payload is SurveyCollectionPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<SurveyCollectionPayload>;
  return (
    !!candidate.owner &&
    typeof candidate.owner === "object" &&
    typeof candidate.owner.ownerName === "string" &&
    Array.isArray(candidate.devices) &&
    candidate.devices.every(isValidDevice)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BootstrapChatRequest>;

    if (!isValidSurveyPayload(body.survey)) {
      return NextResponse.json(
        {
          error:
            "Invalid bootstrap payload. Expected survey owner + devices[] with scores.",
        },
        { status: 400 },
      );
    }

    const response = await bootstrapChatWithProviderChain({
      survey: body.survey,
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
          error instanceof Error ? error.message : "Failed to bootstrap chat.",
      },
      { status: 500 },
    );
  }
}
