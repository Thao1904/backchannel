"use client";

import { useEffect, useState } from "react";
import type { SessionPrompt } from "@/lib/chat-types";
import { createId } from "@/lib/chat-utils";

interface SessionSettingsModalProps {
  open: boolean;
  prompts: SessionPrompt[];
  onClose: () => void;
  onSavePrompt: (prompt: SessionPrompt) => void;
  onDeletePrompt: (id: string) => void;
  onUsePrompt: (prompt: SessionPrompt) => void;
}

export function SessionSettingsModal({
  open,
  prompts,
  onClose,
  onSavePrompt,
  onDeletePrompt,
  onUsePrompt,
}: SessionSettingsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setEditingId(null);
    setTitle("");
    setContent("");
  }, [open]);

  if (!open) {
    return null;
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md">
      <div className="vault-panel vault-scrollbar max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="art-label text-xs text-white/34">Session settings</p>
            <h2 className="mt-3 text-4xl text-white">Prompt library</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              Add, edit, delete, or load prompt templates directly into the input.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vault-button rounded-full px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <article
                key={prompt.id}
                className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl text-white">{prompt.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/62">
                      {prompt.content}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(prompt.id);
                        setTitle(prompt.title);
                        setContent(prompt.content);
                      }}
                      className="vault-button rounded-full px-3 py-2 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onUsePrompt(prompt)}
                      className="vault-button-primary rounded-full px-3 py-2 text-xs"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePrompt(prompt.id)}
                      className="rounded-full border border-rose-200/20 px-3 py-2 text-xs text-rose-100/90"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
            <p className="art-label text-xs text-white/34">
              {isEditing ? "Edit prompt" : "Add prompt"}
            </p>
            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="vault-input w-full rounded-2xl px-4 py-3"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Content</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={8}
                  className="vault-input w-full rounded-2xl px-4 py-3"
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim() || !content.trim()) {
                      return;
                    }

                    onSavePrompt({
                      id: editingId ?? createId("prompt"),
                      title: title.trim(),
                      content: content.trim(),
                    });

                    setEditingId(null);
                    setTitle("");
                    setContent("");
                  }}
                  className="vault-button-primary rounded-full px-4 py-2 text-sm"
                >
                  {isEditing ? "Save changes" : "Add prompt"}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setTitle("");
                      setContent("");
                    }}
                    className="vault-button rounded-full px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
