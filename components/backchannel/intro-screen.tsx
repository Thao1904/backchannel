"use client";

import Link from "next/link";
import { useBackchannel } from "@/components/backchannel/provider";
import { ScreenFrame, ToggleRow } from "@/components/backchannel/shared";

export function IntroScreen() {
  const { state, setParticipantMode, setGenerationMode, resetToSample } =
    useBackchannel();

  return (
    <ScreenFrame
      title={state.content.introTitle}
      description={state.content.introDescription}
      step="Step 01"
    >
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p className="art-label text-xs text-slate-500">Method</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Household ratings become fictional coworkers with memory, ego, and grudges.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p className="art-label text-xs text-slate-500">Mood</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Witty, shady, intimate, slightly mean, never cruel.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p className="art-label text-xs text-slate-500">Engine</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Deterministic rules now, clean seam for an LLM provider later.
            </p>
          </article>
        </div>

        <ToggleRow
          label="Participant input"
          value={state.participantMode}
          onChange={(value) => {
            if (value === "sample") {
              resetToSample();
            } else {
              setParticipantMode("manual");
            }
          }}
          options={[
            { value: "sample", label: state.content.sampleToggleLabel },
            { value: "manual", label: state.content.manualToggleLabel },
          ]}
        />

        <ToggleRow
          label="Generation mode"
          value={state.generationMode}
          onChange={(value) => setGenerationMode(value as "rules" | "llm-stub")}
          options={[
            { value: "rules", label: state.content.rulesModeLabel },
            { value: "llm-stub", label: state.content.llmModeLabel },
          ]}
        />

        <div className="flex gap-3">
          <Link
            href="/selection"
            className="rounded-full border border-sky-300/60 bg-sky-200/10 px-5 py-3 text-sm text-sky-100"
          >
            {state.content.introButton}
          </Link>
          <Link
            href="/live-survey"
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200"
          >
            Try live survey
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}
