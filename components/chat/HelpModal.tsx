"use client";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel w-full max-w-2xl rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">Help</p>
            <h2 className="mt-3 text-4xl text-white">How to use the vault</h2>
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
          <p>1. Type a message and press Send.</p>
          <p>2. Load a session prompt if you want a reusable instruction pattern.</p>
          <p>3. Add documents to keep contextual notes locally.</p>
          <p>4. Toggle Cipher when you want the interface to render obfuscated text without altering the stored messages.</p>
        </div>
      </div>
    </div>
  );
}
