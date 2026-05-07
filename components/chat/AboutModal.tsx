"use client";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel w-full max-w-2xl rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">About</p>
            <h2 className="mt-3 text-4xl text-white">Offline vault shell</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vault-button rounded-full px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>
        <div className="mt-6 space-y-4 text-sm leading-7 text-white/62">
          <p>
            This module is designed as a reusable chat surface for an offline-first
            assistant experience. It stores local session state, documents, prompts,
            and rendering preferences without mutating the original chat content.
          </p>
          <p>
            The current bot reply is simulated, but the component structure is ready
            for a real API provider later.
          </p>
        </div>
      </div>
    </div>
  );
}
