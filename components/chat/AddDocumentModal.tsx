"use client";

import { useEffect, useState } from "react";
import type { VaultDocument } from "@/lib/chat-types";
import { createId } from "@/lib/chat-utils";

interface AddDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (document: VaultDocument) => void;
}

export function AddDocumentModal({
  open,
  onClose,
  onAdd,
}: AddDocumentModalProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [info, setInfo] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [fileType, setFileType] = useState<string | undefined>();
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setValue("");
    setInfo("");
    setFileName(undefined);
    setFileType(undefined);
    setFileDataUrl(undefined);
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel vault-scrollbar max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">Add document</p>
            <h2 className="mt-3 text-4xl text-white">Attach something to the vault</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vault-button rounded-full px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-4">
          <label className="block space-y-2">
            <span className="text-sm text-white/70">Document name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="vault-input w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">Info</span>
            <input
              value={info}
              onChange={(event) => setInfo(event.target.value)}
              className="vault-input w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">Text content</span>
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={8}
              className="vault-input w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">Optional file upload</span>
            <input
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                setFileName(file.name);
                setFileType(file.type);

                const reader = new FileReader();
                reader.onload = () => {
                  setFileDataUrl(String(reader.result ?? ""));
                };
                reader.readAsDataURL(file);
              }}
              className="vault-input block w-full rounded-2xl px-4 py-3 text-sm text-white/65 file:mr-4 file:rounded-full file:border-0 file:bg-[#f2f2eb] file:px-4 file:py-2 file:text-sm file:text-[#080808]"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (!name.trim() || (!value.trim() && !fileDataUrl)) {
                  return;
                }

                onAdd({
                  id: createId("document"),
                  name: name.trim(),
                  value: value.trim(),
                  info: info.trim() || undefined,
                  fileName,
                  fileType,
                  fileDataUrl,
                  createdAt: Date.now(),
                });
                onClose();
              }}
              className="vault-button-primary rounded-full px-4 py-2 text-sm"
            >
              Save document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
