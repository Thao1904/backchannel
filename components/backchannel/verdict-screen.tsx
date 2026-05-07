"use client";

import Link from "next/link";
import { useBackchannel } from "@/components/backchannel/provider";
import { ScreenFrame } from "@/components/backchannel/shared";

export function VerdictScreen() {
  const { restart, state } = useBackchannel();
  const generation = state.generation;

  return (
    <ScreenFrame
      title={state.content.verdictTitle}
      description={state.content.verdictSubtitle}
      step="Step 06"
    >
      <div className="space-y-6">
        <article className="rounded-[1.75rem] border border-white/10 bg-black/25 p-6">
          <p className="art-label text-xs text-slate-500">
            Poetic diagnosis
          </p>
          <p className="mt-4 text-xl leading-8 text-stone-100">
            {generation?.inference.poeticDiagnosis ??
              "Generate the room to reveal the diagnosis."}
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-black/25 p-6">
          <p className="art-label text-xs text-slate-500">
            What your devices think of you
          </p>
          <p className="mt-3 text-base leading-7 text-slate-100">
            {generation?.inference.deviceVerdict ??
              "Your devices are still gathering their complaints."}
          </p>
        </article>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-full border border-sky-400 bg-sky-400/10 px-5 py-3 text-sm text-sky-200"
          >
            {state.content.restartLabel}
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm text-slate-300"
          >
            Edit content
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}
