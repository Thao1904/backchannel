"use client";

import { useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  lockedReason?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  lockedReason,
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const topLabel = lockedReason ?? "Reply";

  return (
    <div
      className={`w-full rounded-[1.45rem] border-[2px] bg-[#f7f7f3] p-3 text-[#181818] transition sm:rounded-[1.7rem] sm:p-4 ${
        isFocused ? "border-[#161616]" : "border-[#2c2c2c]"
      }`}
    >
      <div className="mb-2 flex items-center justify-start gap-3 sm:mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#181818]/70">
          {topLabel}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        disabled={disabled}
        rows={2}
        placeholder={
          disabled && lockedReason ? lockedReason : "Ask the vault something..."
        }
        className="min-h-[24px] w-full resize-none bg-transparent text-[15px] font-medium leading-6 text-[#181818] outline-none placeholder:text-[#181818]/34 sm:text-base"
      />

      <div className="mt-3 flex items-center justify-end gap-3 sm:mt-4">
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-full border-2 border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-xs font-bold text-[#f7f7f3] transition hover:bg-transparent hover:text-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
