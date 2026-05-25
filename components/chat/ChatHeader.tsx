"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  const router = useRouter();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function openSettingsPrompt() {
    setPassword("");
    setPasswordError("");
    setShowPasswordPrompt(true);
  }

  function submitSettingsPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== "1234") {
      setPasswordError("Wrong password.");
      return;
    }

    window.sessionStorage.setItem("chat.settingsAdmin", "true");
    router.push("/chat/settings");
  }

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
        <button
          type="button"
          onClick={openSettingsPrompt}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#2c2c2c] bg-[#f7f7f3] text-base font-black text-[#181818] transition hover:bg-[#181818] hover:text-[#f7f7f3] sm:h-9 sm:w-9"
          aria-label="Open admin settings"
          title="Settings"
        >
          ⚙︎
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[360px] flex-col items-center sm:max-w-[420px]">
        <CameraTracker
          enabled={trackingEnabled}
          settings={adminSettings}
          onCipherChange={onCipherChange}
          onStateChange={onCameraStateChange}
        />
      </div>

      {showPasswordPrompt ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={submitSettingsPassword}
            className="w-full max-w-sm rounded-[1.4rem] border-[3px] border-[#2b2b2b] bg-[#fff7fb] p-5 text-[#20151b] shadow-[8px_8px_0_rgba(0,0,0,0.22)]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#20151b]/50">
              Admin settings
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase">
              Enter password
            </h2>
            <input
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              type="password"
              autoFocus
              className="mt-4 w-full rounded-[0.9rem] border-[2px] border-[#2b2b2b] bg-white px-4 py-3 text-base font-black outline-none"
              placeholder="Password"
            />
            {passwordError ? (
              <p className="mt-3 text-sm font-black text-[#c02660]">
                {passwordError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordPrompt(false)}
                className="rounded-full border-[2px] border-[#2b2b2b] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#20151b] transition hover:bg-[#ffd4ec]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full border-[2px] border-[#2b2b2b] bg-[#ff8bc8] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#20151b] transition hover:bg-white"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </header>
  );
}
