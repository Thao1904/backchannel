"use client";

import { useEffect, useRef } from "react";
import type { AdminSettings, ChatMessage } from "@/lib/chat-types";
import { formatTimestamp, transformToCipher } from "@/lib/chat-utils";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface ChatMessagesProps {
  messages: ChatMessage[];
  adminSettings: AdminSettings;
  isTyping: boolean;
  typingSpeaker?: string;
}

export function ChatMessages({
  messages,
  adminSettings,
  isTyping,
  typingSpeaker,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const latestMessageText = messages[messages.length - 1]?.content ?? "";

  useEffect(() => {
    if (!adminSettings.autoScroll) {
      return;
    }

    const scrollToBottom = () => {
      const container = scrollRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    };

    scrollToBottom();
    const frame = window.requestAnimationFrame(scrollToBottom);
    const timer = window.setTimeout(scrollToBottom, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [adminSettings.autoScroll, isTyping, latestMessageText, messages.length]);

  return (
    <div
      ref={scrollRef}
      className="vault-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-0.5 py-1.5 sm:px-1 sm:py-2"
    >
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[320px] flex-col items-start justify-center px-6 py-10">
          <div className="max-w-[280px] rounded-[1.35rem] border-[2px] border-[#2b2b2b] bg-[#f7f7f3] px-6 py-5 text-left text-[#181818]">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#181818]/70">
              Waiting for chatter
            </p>
            <p className="mt-3 text-sm leading-7 text-[#181818]/62">
              The room is quiet for now. Add objects in settings or restart the
              gossip loop.
            </p>
          </div>
        </div>
      ) : null}

      {messages.map((message) => {
        const isUser = message.role === "user";
        const shouldCipher = !isUser && adminSettings.cipherMode;
        const displayText = shouldCipher
          ? transformToCipher(message.content)
          : message.content;
        const avatarLabel = (message.speaker ?? (isUser ? "User" : "Vault"))
          .slice(0, 1)
          .toUpperCase();

        return (
          <div
            key={message.id}
            className={`flex items-end gap-2 sm:gap-3 ${isUser ? "justify-end pl-8 sm:pl-14" : "justify-start pr-8 sm:pr-14"}`}
          >
            {isUser ? null : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2px] border-[#2c2c2c] bg-[#1f1f1f] text-[11px] font-black text-[#f5f5f1] sm:h-10 sm:w-10 sm:text-xs">
                {avatarLabel}
              </div>
            )}
            <article
              className={`max-w-[calc(100%-2.75rem)] rounded-[1.05rem] border-[2px] px-3 py-3 sm:max-w-[88%] sm:rounded-[1.25rem] sm:px-4 sm:py-4 md:max-w-[64%] ${
                isUser
                  ? "border-[#2c2c2c] bg-[#1f1f1f] text-[#f5f5f1]"
                  : "border-[#2c2c2c] bg-[#fafaf7] text-[#161616]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-current/60">
                  {isUser ? message.speaker ?? "User" : message.speaker ?? "Vault"}
                </p>
                <p className="text-[11px] font-medium text-current/45">
                  {formatTimestamp(message.createdAt)}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] font-semibold leading-6 sm:text-base sm:leading-7">
                {displayText}
              </p>
            </article>
            {isUser ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2px] border-[#2c2c2c] bg-[#f5f5f1] text-[11px] font-black text-[#161616] sm:h-10 sm:w-10 sm:text-xs">
                {avatarLabel}
              </div>
            ) : null}
          </div>
        );
      })}

      {isTyping ? (
        <TypingIndicator speaker={typingSpeaker} className="hidden sm:flex" />
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
