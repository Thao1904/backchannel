"use client";

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel w-full max-w-2xl rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">Changelog</p>
            <h2 className="mt-3 text-4xl text-white">Session 2 build notes</h2>
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
          <p>v0.1: Initial offline vault chat shell.</p>
          <p>v0.2: Added session prompts, document storage, typing effect, and admin settings persistence.</p>
          <p>v0.3: Added cipher rendering mode and modular overlay dialogs for future expansion.</p>
        </div>
      </div>
    </div>
  );
}
