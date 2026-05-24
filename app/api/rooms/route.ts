import { NextResponse } from "next/server";
import { loadRoomByJoinCode } from "@/lib/room-api";

const DEMO_JOIN_CODE = "000000";

function demoRoom() {
  const now = Date.now();

  return {
    configured: true,
    room: {
      id: "demo-room",
      room_code: "DEMO",
      user_message_count: 3,
      status: "locked_free_limit",
    },
    survey: {
      owner_name: "Mee",
      survey_payload: {
        owner: {
          ownerName: "Mee",
          language: "en",
          tone: "funny office gossip between household objects",
        },
        devices: [
          {
            id: "demo-iron",
            name: "Iron",
            type: "iron",
            likeScore: 2,
            frequency: "rarely",
            helpfulnessPercent: 58,
            easeOfUseScore: 3,
          },
          {
            id: "demo-coffee",
            name: "Coffee machine",
            type: "coffeemachine",
            likeScore: 5,
            frequency: "constantly",
            helpfulnessPercent: 96,
            easeOfUseScore: 4,
          },
          {
            id: "demo-hairdryer",
            name: "Hair dryer",
            type: "hairdryer",
            likeScore: 4,
            frequency: "everyday",
            helpfulnessPercent: 74,
            easeOfUseScore: 4,
          },
          {
            id: "demo-fan",
            name: "Fan",
            type: "fan",
            likeScore: 3,
            frequency: "sometimes",
            helpfulnessPercent: 66,
            easeOfUseScore: 5,
          },
          {
            id: "demo-blender",
            name: "Blender",
            type: "blender",
            likeScore: 2,
            frequency: "rarely",
            helpfulnessPercent: 42,
            easeOfUseScore: 2,
          },
        ],
      },
    },
    messages: [
      {
        id: "demo-message-1",
        role: "assistant",
        speaker: "Coffee machine",
        content: "Mee calls this a routine, but we all know I am the operating system.",
        created_at: new Date(now - 180000).toISOString(),
      },
      {
        id: "demo-message-2",
        role: "user",
        speaker: "You",
        content: "Why is everyone being so dramatic?",
        created_at: new Date(now - 120000).toISOString(),
      },
      {
        id: "demo-message-3",
        role: "assistant",
        speaker: "Iron",
        content: "Because I only get touched during emergencies and weddings.",
        created_at: new Date(now - 90000).toISOString(),
      },
      {
        id: "demo-message-4",
        role: "assistant",
        speaker: "Fan",
        content: "At least you get a narrative. I get switched on and blamed for noise.",
        created_at: new Date(now - 60000).toISOString(),
      },
    ],
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const joinCode = url.searchParams.get("joinCode")?.trim() ?? "";

  if (joinCode === DEMO_JOIN_CODE) {
    return NextResponse.json(demoRoom());
  }

  if (!joinCode) {
    return NextResponse.json({
      configured: true,
      requiresCode: true,
    });
  }

  const data = await loadRoomByJoinCode(joinCode);
  return NextResponse.json(data);
}
