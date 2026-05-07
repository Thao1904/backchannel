"use client";

import type { AdminSettings, ChatLanguage, ReplySpeed } from "@/lib/chat-types";
import { getChatCopy } from "@/lib/chat-utils";

interface AdminSettingsModalProps {
  open: boolean;
  settings: AdminSettings;
  onClose: () => void;
  onChange: (settings: AdminSettings) => void;
  onRestartAutoChat: () => void;
}

export function AdminSettingsModal({
  open,
  settings,
  onClose,
  onChange,
  onRestartAutoChat,
}: AdminSettingsModalProps) {
  if (!open) {
    return null;
  }

  const copy = getChatCopy(settings.language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel w-full max-w-2xl rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">{copy.adminSettings}</p>
            <h2 className="mt-3 text-4xl text-white">{copy.responseControls}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vault-button rounded-full px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm text-white/70">{copy.language}</span>
            <select
              value={settings.language}
              onChange={(event) =>
                onChange({
                  ...settings,
                  language: event.target.value as ChatLanguage,
                })
              }
              className="vault-input w-full rounded-2xl px-4 py-3"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">{copy.ownerName}</span>
            <input
              value={settings.ownerName}
              onChange={(event) =>
                onChange({
                  ...settings,
                  ownerName: event.target.value,
                })
              }
              className="vault-input w-full rounded-2xl px-4 py-3"
              placeholder="A"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">{copy.replyUnlockSeconds}</span>
            <input
              type="number"
              min={0}
              step={5}
              value={settings.userReplyDelaySeconds}
              onChange={(event) =>
                onChange({
                  ...settings,
                  userReplyDelaySeconds: Math.max(
                    0,
                    Number(event.target.value) || 0,
                  ),
                })
              }
              className="vault-input w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">{copy.autoChatGapSeconds}</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={settings.autoChatGapSeconds}
              onChange={(event) =>
                onChange({
                  ...settings,
                  autoChatGapSeconds: Math.max(
                    0,
                    Number(event.target.value) || 0,
                  ),
                })
              }
              className="vault-input w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">Reply speed</span>
            <select
              value={settings.replySpeed}
              onChange={(event) =>
                onChange({
                  ...settings,
                  replySpeed: event.target.value as ReplySpeed,
                })
              }
              className="vault-input w-full rounded-2xl px-4 py-3"
            >
              <option value="slow">slow</option>
              <option value="normal">normal</option>
              <option value="fast">fast</option>
              <option value="instant">instant</option>
            </select>
          </label>

          <ToggleRow
            label="Typing indicator"
            checked={settings.typingIndicator}
            onToggle={(checked) =>
              onChange({ ...settings, typingIndicator: checked })
            }
          />
          <ToggleRow
            label="Auto scroll"
            checked={settings.autoScroll}
            onToggle={(checked) => onChange({ ...settings, autoScroll: checked })}
          />
          <ToggleRow
            label="Typewriter effect"
            checked={settings.typewriterEffect}
            onToggle={(checked) =>
              onChange({ ...settings, typewriterEffect: checked })
            }
          />
          <ToggleRow
            label="Cipher mode"
            checked={settings.cipherMode}
            onToggle={(checked) => onChange({ ...settings, cipherMode: checked })}
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={onRestartAutoChat}
              className="vault-button-primary rounded-full px-4 py-2 text-sm"
            >
              {copy.restartAutoGossip}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-white/88">{label}</span>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className={`rounded-full border px-4 py-2 text-sm ${
          checked
            ? "border-lime-100/30 bg-lime-300 text-black"
            : "vault-button"
        }`}
      >
        {checked ? "On" : "Off"}
      </button>
    </div>
  );
}
