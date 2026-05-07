"use client";

import Link from "next/link";
import { useBackchannel } from "@/components/backchannel/provider";
import { ScreenFrame } from "@/components/backchannel/shared";

export function ContentDashboard() {
  const { state, updateContent } = useBackchannel();

  return (
    <ScreenFrame
      title="Content dashboard"
      description="Edit the text content shown across the prototype without touching the generation rules."
      step="Editor"
    >
      <div className="space-y-6">
        <EditableField
          label="Intro title"
          value={state.content.introTitle}
          onChange={(value) => updateContent({ introTitle: value })}
        />
        <EditableArea
          label="Intro description"
          value={state.content.introDescription}
          onChange={(value) => updateContent({ introDescription: value })}
        />
        <EditableArea
          label="Selection description"
          value={state.content.selectionDescription}
          onChange={(value) => updateContent({ selectionDescription: value })}
        />
        <EditableArea
          label="Rating description"
          value={state.content.ratingDescription}
          onChange={(value) => updateContent({ ratingDescription: value })}
        />
        <EditableArea
          label="Verdict title"
          value={state.content.verdictTitle}
          onChange={(value) => updateContent({ verdictTitle: value })}
        />
        <EditableArea
          label="Verdict subtitle"
          value={state.content.verdictSubtitle}
          onChange={(value) => updateContent({ verdictSubtitle: value })}
        />
        <EditableArea
          label="Synthesis lines"
          value={state.content.synthesisLines.join("\n")}
          onChange={(value) =>
            updateContent({
              synthesisLines: value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
        />

        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full border border-sky-400 bg-sky-400/10 px-5 py-3 text-sm text-sky-200"
          >
            Return to app
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}

function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
      />
    </label>
  );
}

function EditableArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
      />
    </label>
  );
}
