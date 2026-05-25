"use client";

import { useEffect, useState } from "react";
import type { PersonaCard, SurveyCollectionPayload } from "@/lib/chat-types";
import { buildRuleBasedPersonas } from "@/lib/survey-intelligence";

interface RoomMessage {
  id: string;
  role: "user" | "assistant";
  speaker?: string;
  content: string;
  created_at: string;
}

interface StoredSurveySession {
  owner_name?: string;
  survey_payload?: SurveyCollectionPayload;
}

export default function RoomReviewPage() {
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [surveySummary, setSurveySummary] = useState("");
  const [survey, setSurvey] = useState<SurveyCollectionPayload | null>(null);
  const [personas, setPersonas] = useState<PersonaCard[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [roomStatus, setRoomStatus] = useState("");
  const [userMessageCount, setUserMessageCount] = useState(0);

  async function loadRoom() {
    setStatus("loading");
    setMessage("");

    const response = await fetch(
      `/api/rooms?joinCode=${encodeURIComponent(joinCode.trim())}`,
    );
    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not open this room.");
      return;
    }

    if (data.configured === false) {
      setStatus("error");
      setMessage(
        "Supabase is not configured yet, so this room only exists on the kiosk browser.",
      );
      return;
    }

    if (data.requiresCode) {
      setStatus("idle");
      setMessage("Enter the exact join code shown on the kiosk screen.");
      return;
    }

    applyRoomData(data);
  }

  function applyRoomData(data: any) {
    const nextMessages = Array.isArray(data.messages) ? data.messages : [];
    setMessages(nextMessages);
    const nextSurvey = (data.survey as StoredSurveySession | null)
      ?.survey_payload;
    setSurvey(nextSurvey ?? null);
    setPersonas(nextSurvey ? buildRuleBasedPersonas(nextSurvey).personas : []);
    setRoomCode(data.room?.room_code ?? "");
    setRoomStatus(data.room?.status ?? "");
    setUserMessageCount(
      typeof data.room?.user_message_count === "number"
        ? data.room.user_message_count
        : nextMessages.filter((item: RoomMessage) => item.role === "user").length,
    );
    setSurveySummary(
      data.survey?.owner_name
        ? `${data.survey.owner_name} · ${data.room?.user_message_count ?? 0} messages`
        : "Backchannel room",
    );
    setStatus("ready");
  }

  useEffect(() => {
    setStatus("idle");
    setMessage("");
  }, []);

  return (
    <main className="min-h-screen bg-[#111] px-4 py-6 text-[#f7f7f3]">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/42">
          Backchannel room
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em]">
          Enter code
        </h1>

        {status !== "ready" ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/16 bg-white/[0.06] p-5">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
              Join code
            </label>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              inputMode="numeric"
              className="mt-3 w-full rounded-[1rem] border border-white/20 bg-black px-4 py-3 text-2xl font-black tracking-[0.18em] outline-none"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={loadRoom}
              disabled={status === "loading" || joinCode.trim().length === 0}
              className="mt-4 rounded-full border border-white bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status === "loading" ? "Opening..." : "Open room"}
            </button>
            {message ? (
              <p className="mt-4 text-sm font-semibold leading-6 text-white/58">
                {message}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <p className="text-sm font-semibold text-white/52">
              {surveySummary}
              {roomCode ? ` · ${roomCode}` : ""}
            </p>
            {survey ? <SurveyStatsPanel survey={survey} /> : null}
            {personas.length > 0 ? <PersonaPanel personas={personas} /> : null}
            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                Conversation history
              </p>
              {messages.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-[1.2rem] border p-4 ${
                    item.role === "user"
                      ? "ml-10 border-white/24 bg-white text-black"
                      : "mr-10 border-white/12 bg-white/[0.07]"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-50">
                    {item.speaker ?? item.role}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6">{item.content}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SurveyStatsPanel({ survey }: { survey: SurveyCollectionPayload }) {
  const stats = getSurveyStats(survey);

  return (
    <section className="mt-5 rounded-[1.5rem] border border-white/14 bg-white/[0.07] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
        Survey statistics
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]">
        {survey.owner.ownerName || "Guest"} · {survey.devices.length} devices
      </h2>
      <div className="mt-4 grid gap-3">
        <MetricBar label="Attachment" value={stats.attachment} />
        <MetricBar label="Usage" value={stats.usage} />
        <MetricBar label="Helpfulness" value={stats.helpfulness} />
        <MetricBar label="Ease" value={stats.ease} />
      </div>
      <div className="mt-5 grid gap-3">
        {survey.devices.map((device) => (
          <DeviceChart key={device.id} device={device} />
        ))}
      </div>
    </section>
  );
}

function PersonaPanel({ personas }: { personas: PersonaCard[] }) {
  return (
    <section className="mt-5 rounded-[1.5rem] border border-white/14 bg-white/[0.07] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
        Assigned device personalities
      </p>
      <div className="mt-4 grid gap-3">
        {personas.map((persona) => (
          <article
            key={persona.deviceId}
            className="rounded-[1.1rem] border border-white/14 bg-black/24 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black">{persona.name}</h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/44">
                  {persona.archetype}
                </p>
              </div>
              <span className="rounded-full border border-white/16 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/58">
                persona
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/72">
              {persona.personality}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-white/48">
              {persona.gossipAngle}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getSurveyStats(survey: SurveyCollectionPayload) {
  const count = Math.max(1, survey.devices.length);
  const frequencyScore: Record<string, number> = {
    rarely: 25,
    sometimes: 50,
    everyday: 75,
    constantly: 100,
  };

  return {
    attachment: Math.round(
      survey.devices.reduce((sum, device) => sum + device.likeScore * 20, 0) /
        count,
    ),
    usage: Math.round(
      survey.devices.reduce(
        (sum, device) => sum + (frequencyScore[device.frequency] ?? 50),
        0,
      ) / count,
    ),
    helpfulness: Math.round(
      survey.devices.reduce((sum, device) => sum + device.helpfulnessPercent, 0) /
        count,
    ),
    ease: Math.round(
      survey.devices.reduce(
        (sum, device) => sum + device.easeOfUseScore * 20,
        0,
      ) / count,
    ),
  };
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/12">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function DeviceChart({
  device,
}: {
  device: SurveyCollectionPayload["devices"][number];
}) {
  const frequencyLabel: Record<string, string> = {
    rarely: "rarely used",
    sometimes: "sometimes used",
    everyday: "daily use",
    constantly: "constant use",
  };

  return (
    <article className="rounded-[1.1rem] border border-white/14 bg-black/24 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-base font-black">{device.name}</h3>
        <span className="shrink-0 rounded-full border border-white/16 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/58">
          {frequencyLabel[device.frequency] ?? device.frequency}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        <MetricBar label="Like" value={device.likeScore * 20} />
        <MetricBar label="Help" value={device.helpfulnessPercent} />
        <MetricBar label="Ease" value={device.easeOfUseScore * 20} />
      </div>
    </article>
  );
}
