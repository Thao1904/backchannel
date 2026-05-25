"use client";

import { useMemo, useState } from "react";
import type { PersonaCard, SurveyCollectionPayload } from "@/lib/chat-types";
import { buildRuleBasedPersonas } from "@/lib/survey-intelligence";

interface AdminSession {
  id: string;
  owner_name?: string;
  survey_payload?: SurveyCollectionPayload;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminRoom {
  id: string;
  survey_session_id: string;
  room_code?: string;
  status?: string;
  user_message_count?: number;
  updated_at?: string;
}

interface AdminMessage {
  id: string;
  room_id: string;
  role: "user" | "assistant";
  speaker?: string;
  content: string;
  created_at: string;
}

interface AdminFeedback {
  id: string;
  rating?: number | null;
  message?: string | null;
  contact?: string | null;
  page_path?: string | null;
  created_at: string;
}

interface AdminData {
  configured: boolean;
  sessions: AdminSession[];
  rooms: AdminRoom[];
  messages: AdminMessage[];
  feedback: AdminFeedback[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedSession = useMemo(
    () => data?.sessions.find((session) => session.id === selectedId) ?? null,
    [data, selectedId],
  );
  const selectedRoom = useMemo(
    () =>
      data?.rooms.find((room) => room.survey_session_id === selectedSession?.id) ??
      null,
    [data, selectedSession],
  );
  const selectedMessages = useMemo(
    () =>
      data?.messages.filter((message) => message.room_id === selectedRoom?.id) ??
      [],
    [data, selectedRoom],
  );
  const personas: PersonaCard[] = selectedSession?.survey_payload
    ? buildRuleBasedPersonas(selectedSession.survey_payload).personas
    : [];

  async function unlock() {
    setIsLoading(true);
    setError("");

    const response = await fetch(
      `/api/admin/sessions?password=${encodeURIComponent(password)}`,
    );
    const nextData = await response.json();

    if (!response.ok) {
      setError(nextData.error ?? "Could not open admin.");
      setIsLoading(false);
      return;
    }

    setData(nextData);
    setSelectedId(nextData.sessions?.[0]?.id ?? null);
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#101010] px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/42">
              Backchannel admin
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em]">
              Session database
            </h1>
          </div>
          <div className="flex gap-2">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void unlock();
                }
              }}
              type="password"
              placeholder="Password"
              className="rounded-[0.9rem] border border-white/16 bg-black px-4 py-2 text-sm font-bold outline-none placeholder:text-white/32"
            />
            <button
              type="button"
              onClick={unlock}
              disabled={isLoading || password.length === 0}
              className="rounded-[0.9rem] border border-white bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.1em] text-black disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isLoading ? "Opening..." : "Open"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-[1rem] border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
            {error}
          </p>
        ) : null}

        {!data ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-6 text-white/58">
            Enter the admin password to view all saved survey/chat sessions.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <Panel title={`Feedback (${data.feedback.length})`}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.feedback.length === 0 ? (
                  <p className="text-sm font-semibold text-white/58">
                    No feedback submitted yet.
                  </p>
                ) : null}
                {data.feedback.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1rem] bg-black/28 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/48">
                        Rating {item.rating ?? "-"}
                      </p>
                      <span className="text-[11px] text-white/38">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
                      {item.message || "No message"}
                    </p>
                    {item.contact ? (
                      <p className="mt-2 text-xs font-black text-[#e879b9]">
                        {item.contact}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/48">
                    Sessions
                  </p>
                  <span className="text-xs font-bold text-white/42">
                    {data.sessions.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {data.sessions.map((session) => {
                    const room = data.rooms.find(
                      (item) => item.survey_session_id === session.id,
                    );
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSelectedId(session.id)}
                        className={`w-full rounded-[1rem] px-4 py-3 text-left transition ${
                          selectedId === session.id
                            ? "bg-white text-black"
                            : "bg-black/28 text-white hover:bg-black/42"
                        }`}
                      >
                        <p className="text-sm font-black">
                          {session.owner_name || "Unknown"}
                        </p>
                        <p className="mt-1 text-xs font-semibold opacity-58">
                          {room?.user_message_count ?? 0} user messages ·{" "}
                          {room?.status ?? session.status ?? "active"}
                        </p>
                        <p className="mt-2 text-[11px] font-medium opacity-45">
                          {session.updated_at
                            ? new Date(session.updated_at).toLocaleString()
                            : "No timestamp"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-5">
                {selectedSession ? (
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/48">
                          Detail
                        </p>
                        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
                          {selectedSession.owner_name || "Unknown"}
                        </h2>
                      </div>
                      <span className="rounded-full border border-white/14 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/58">
                        {selectedRoom?.room_code ?? "no room"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="space-y-4">
                        <Panel title="Survey">
                          <p className="text-sm font-semibold leading-6 text-white/68">
                            {selectedSession.survey_payload?.devices
                              .map((device) => device.name)
                              .join(", ") || "No survey payload"}
                          </p>
                        </Panel>
                        <Panel title="Conversation history">
                          <div className="space-y-3">
                            {selectedMessages.map((message) => (
                              <article
                                key={message.id}
                                className="rounded-[1rem] bg-black/28 px-4 py-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/48">
                                    {message.speaker ?? message.role}
                                  </p>
                                  <span className="text-[11px] text-white/38">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
                                  {message.content}
                                </p>
                              </article>
                            ))}
                          </div>
                        </Panel>
                      </div>

                      <Panel title="Assigned personalities">
                        <div className="space-y-3">
                          {personas.map((persona) => (
                            <article
                              key={persona.deviceId}
                              className="rounded-[1rem] bg-black/28 px-4 py-3"
                            >
                              <p className="text-sm font-black">{persona.name}</p>
                              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/42">
                                {persona.archetype}
                              </p>
                              <p className="mt-2 text-xs font-semibold leading-5 text-white/66">
                                {persona.personality}
                              </p>
                            </article>
                          ))}
                        </div>
                      </Panel>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/58">No session selected.</p>
                )}
              </section>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.2rem] border border-white/10 bg-black/18 p-4">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
        {title}
      </p>
      {children}
    </section>
  );
}
