"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ConversationArchiveRecord } from "@/lib/chat-types";
import {
  deleteConversationArchive,
  loadConversationArchives,
} from "@/lib/chat-storage";

export default function ChatDatabasePage() {
  const [records, setRecords] = useState<ConversationArchiveRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const nextRecords = loadConversationArchives();
    setRecords(nextRecords);
    setSelectedId(nextRecords[0]?.id ?? null);
  }, []);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId],
  );

  function handleDelete(id: string) {
    deleteConversationArchive(id);
    const nextRecords = loadConversationArchives();
    setRecords(nextRecords);
    setSelectedId((current) =>
      current === id ? (nextRecords[0]?.id ?? null) : current,
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6">
      <section className="rounded-[2rem] border-[2px] border-white/90 bg-[#1d1d1d] p-5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-white/48">
              Backchannel archive
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.08em] sm:text-5xl">
              Database
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/chat/settings"
              className="rounded-[0.95rem] border-[2px] border-white/30 bg-[#343434] px-4 py-2 text-sm font-black uppercase transition hover:bg-white hover:text-black"
            >
              Settings
            </Link>
            <Link
              href="/chat"
              className="rounded-[0.95rem] border-[2px] border-white/90 px-4 py-2 text-sm font-black uppercase transition hover:bg-white hover:text-black"
            >
              Back to chat
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[1.6rem] bg-[#252525] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-white/62">
                Sessions
              </p>
              <span className="text-xs font-bold text-white/45">
                {records.length} stored
              </span>
            </div>

            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="rounded-[1.15rem] bg-[#333] px-4 py-5 text-sm text-white/58">
                  No chat sessions stored yet.
                </div>
              ) : null}

              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedId(record.id)}
                  className={`w-full rounded-[1.15rem] px-4 py-4 text-left transition ${
                    selectedId === record.id
                      ? "bg-white text-black"
                      : "bg-[#333] text-white hover:bg-[#3b3b3b]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] opacity-60">
                        {record.owner.ownerName || "Unknown owner"}
                      </p>
                      <p className="mt-2 text-sm font-bold">
                        {record.messages.length} messages
                      </p>
                    </div>
                    <span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                      {record.provider}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs opacity-68">
                    {record.messages[record.messages.length - 1]?.content ??
                      "No messages"}
                  </p>
                  <p className="mt-3 text-[11px] font-medium opacity-52">
                    {new Date(record.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[1.6rem] bg-[#252525] p-4 sm:p-5">
            {selectedRecord ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/48">
                      Session detail
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em]">
                      {selectedRecord.owner.ownerName}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-[#3a3a3a] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]">
                      {selectedRecord.provider}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedRecord.id)}
                      className="rounded-full border border-white/18 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/72 transition hover:bg-white hover:text-black"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetaCard label="Model" value={selectedRecord.model} />
                  <MetaCard
                    label="Updated"
                    value={new Date(selectedRecord.updatedAt).toLocaleString()}
                  />
                  <MetaCard
                    label="Cast"
                    value={`${selectedRecord.personas.length} devices`}
                  />
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-[1.2rem] bg-[#303030] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">
                      Transcript
                    </p>
                    <div className="mt-4 space-y-3">
                      {selectedRecord.messages.map((message) => (
                        <article
                          key={message.id}
                          className="rounded-[1rem] bg-[#3a3a3a] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/58">
                              {message.speaker ?? message.role}
                            </p>
                            <span className="text-[11px] text-white/45">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-white/88">
                            {message.content}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] bg-[#303030] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">
                      Personas
                    </p>
                    <div className="mt-4 space-y-3">
                      {selectedRecord.personas.map((persona) => (
                        <article
                          key={persona.deviceId}
                          className="rounded-[1rem] bg-[#3a3a3a] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black uppercase tracking-[0.12em]">
                              {persona.name}
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                              {persona.archetype}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-white/72">
                            {persona.personality}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.2rem] bg-[#303030] px-5 py-8 text-white/58">
                Pick a stored session to inspect its generated dialogue and user
                replies.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-[#303030] px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white/88">{value}</p>
    </div>
  );
}
