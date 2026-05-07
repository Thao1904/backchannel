"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBackchannel } from "@/components/backchannel/provider";
import { ScreenFrame } from "@/components/backchannel/shared";

export function ChatroomScreen() {
  const { state } = useBackchannel();
  const [visibleCount, setVisibleCount] = useState(1);
  const generation = state.generation;

  useEffect(() => {
    if (!generation) {
      return;
    }

    setVisibleCount(1);

    const interval = window.setInterval(() => {
      setVisibleCount((current) =>
        current >= generation.messages.length ? current : current + 1,
      );
    }, 850);

    return () => window.clearInterval(interval);
  }, [generation]);

  if (!generation) {
    return (
      <ScreenFrame
        title={state.content.chatroomTitle}
        description="No generation result found yet."
        step="Step 05"
      >
        <Link
          href="/synthesis"
          className="rounded-full border border-sky-400 bg-sky-400/10 px-5 py-3 text-sm text-sky-200"
        >
          Rebuild room
        </Link>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      title={state.content.chatroomTitle}
      description={generation.inference.summary}
      step="Step 05"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {generation.characters.map((character) => (
            <article
              key={character.deviceType}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
            >
              <p className="text-2xl leading-none">
                {character.emoji}
              </p>
              <p className="mt-3 text-lg text-stone-100">{character.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                {character.relationshipLabel}
              </p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          {generation.messages.slice(0, visibleCount).map((message) => (
            <article
              key={message.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                {message.emoji} {message.speakerName}
              </p>
              <p className="mt-2 text-[15px] leading-7 text-slate-100">{message.text}</p>
            </article>
          ))}
        </div>

        <div className="flex gap-3">
          <Link
            href="/verdict"
            className="rounded-full border border-sky-400 bg-sky-400/10 px-5 py-3 text-sm text-sky-200"
          >
            Continue
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}
