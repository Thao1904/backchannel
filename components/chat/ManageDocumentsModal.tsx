"use client";

import type { VaultDocument } from "@/lib/chat-types";

interface ManageDocumentsModalProps {
  open: boolean;
  documents: VaultDocument[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ManageDocumentsModal({
  open,
  documents,
  onClose,
  onDelete,
}: ManageDocumentsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel vault-scrollbar max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">Manage documents</p>
            <h2 className="mt-3 text-4xl text-white">Vault attachments</h2>
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
          {documents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/8 bg-white/[0.03] p-8 text-sm text-white/45">
              No documents stored yet.
            </div>
          ) : null}

          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl text-white">{document.name}</h3>
                  {document.info ? (
                    <p className="mt-2 text-sm text-white/45">{document.info}</p>
                  ) : null}
                  {document.fileName ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/32">
                      {document.fileName} · {document.fileType || "unknown"}
                    </p>
                  ) : null}
                  {document.value ? (
                    <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-white/62">
                      {document.value}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(document.id)}
                  className="rounded-full border border-rose-200/20 px-3 py-2 text-xs text-rose-100/90"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
