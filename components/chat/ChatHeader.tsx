"use client";

import Link from "next/link";
import { CameraTracker } from "@/components/chat/CameraTracker";
import { EyesFollow } from "@/components/chat/EyesFollow";
import type { AdminSettings, CameraTrackingState } from "@/lib/chat-types";

interface ChatHeaderProps {
  adminSettings: AdminSettings;
  onCipherChange: (enabled: boolean) => void;
  onCameraStateChange?: (state: CameraTrackingState) => void;
  trackingEnabled?: boolean;
  onPauseToggle?: () => void;
  isPauseVisible?: boolean;
  isPaused?: boolean;
  providerBadge?: {
    label: "Gemini" | "OpenRouter" | "Fallback";
    detail: string;
  };
}

export function ChatHeader({
  adminSettings,
  onCipherChange,
  onCameraStateChange,
  trackingEnabled = true,
  onPauseToggle,
  isPauseVisible = false,
  isPaused = false,
  providerBadge,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[linear-gradient(180deg,rgba(10,10,10,0.96)_0%,rgba(10,10,10,0.9)_72%,rgba(10,10,10,0)_100%)] px-1 pt-1 pb-2 sm:relative sm:bg-transparent sm:px-2 sm:pt-2 sm:pb-0">
      <EyesFollow />

      <div className="absolute left-0 top-0">
        {providerBadge ? (
          <span
            className={`rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] sm:px-3 sm:py-2 sm:text-[10px] ${
              providerBadge.label === "Gemini"
                ? "border-[#1d7f4a] bg-[#dcfce7] text-[#14532d]"
                : providerBadge.label === "OpenRouter"
                  ? "border-[#2457b8] bg-[#dbeafe] text-[#1d4ed8]"
                : "border-[#6b625a] bg-[#ece8e1] text-[#5a534d]"
            }`}
            title={providerBadge.detail}
          >
            {providerBadge.label}
          </span>
        ) : null}
      </div>

      <div className="absolute right-0 top-0 flex items-center gap-2">
        {isPauseVisible ? (
          <button
            type="button"
            onClick={onPauseToggle}
            className="rounded-full border-2 border-[#2c2c2c] bg-[#f7f7f3] px-2.5 py-1.5 text-xs font-black text-[#181818] transition hover:bg-[#181818] hover:text-[#f7f7f3] sm:px-3 sm:py-2 sm:text-sm"
            aria-label={isPaused ? "Resume auto chat" : "Pause auto chat"}
            title={isPaused ? "Resume auto chat" : "Pause auto chat"}
          >
            {isPaused ? ">" : "||"}
          </button>
        ) : null}
        <Link
          href="/chat/settings"
          className="rounded-full border-2 border-[#2c2c2c] bg-[#f7f7f3] px-3 py-1.5 text-xs font-bold text-[#181818] transition hover:bg-[#181818] hover:text-[#f7f7f3] sm:px-4 sm:py-2 sm:text-sm"
        >
          Settings
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[360px] flex-col items-center sm:max-w-[420px]">
        <CameraTracker
          enabled={trackingEnabled}
          settings={adminSettings}
          onCipherChange={onCipherChange}
          onStateChange={onCameraStateChange}
        />
      </div>
    </header>
  );
}
