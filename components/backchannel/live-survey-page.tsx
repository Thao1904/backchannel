"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buildLiveReactionSnapshot } from "@/lib/generation/live-reactions";
import type { DeviceInput, DeviceType, UseFrequency } from "@/types/backchannel";
import { deviceLabels } from "@/components/backchannel/shared";

const initialInputs: DeviceInput[] = [
  {
    deviceType: "phone",
    likeScore: 5,
    frequency: "constantly",
    lovePercent: 92,
    hateRank: 3,
    dependenceScore: 5,
  },
  {
    deviceType: "laptop",
    likeScore: 4,
    frequency: "everyday",
    lovePercent: 70,
    hateRank: 2,
    dependenceScore: 4,
  },
  {
    deviceType: "microwave",
    likeScore: 2,
    frequency: "everyday",
    lovePercent: 20,
    hateRank: 1,
    dependenceScore: 4,
  },
];

const deviceOptions: DeviceType[] = [
  "phone",
  "laptop",
  "microwave",
  "vacuum",
  "rice_cooker",
  "kettle",
  "oven",
  "dishwasher",
  "washing_machine",
];

const frequencyOptions: UseFrequency[] = [
  "rarely",
  "sometimes",
  "everyday",
  "constantly",
];

export function LiveSurveyPage() {
  const [inputs, setInputs] = useState<DeviceInput[]>(initialInputs);
  const snapshot = useMemo(() => buildLiveReactionSnapshot(inputs), [inputs]);

  function updateInput(
    index: number,
    patch: Partial<DeviceInput>,
  ) {
    setInputs((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="art-label text-xs text-slate-400">
          Backchannel
        </Link>
        <p className="art-label text-xs text-slate-500">
          Repo-inspired live survey demo
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[2rem] p-6 md:p-8">
          <p className="art-label text-xs text-sky-200/80">Survey</p>
          <h1 className="mt-3 max-w-2xl text-5xl leading-none text-stone-100 md:text-6xl">
            Let the devices react while the user is still answering.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Dựa trên tinh thần UI auth card của repo MERN mẫu: một form sạch, tập trung,
            nhưng đầu ra là speculative character gossip thay vì login state.
          </p>

          <div className="mt-8 grid gap-4">
            {inputs.map((input, index) => (
              <article
                key={`${input.deviceType}-${index}`}
                className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <label className="block space-y-2">
                      <span className="art-label text-xs text-slate-500">Device</span>
                      <select
                        value={input.deviceType}
                        onChange={(event) =>
                          updateInput(index, {
                            deviceType: event.target.value as DeviceType,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-100"
                      >
                        {deviceOptions.map((device) => (
                          <option key={device} value={device}>
                            {deviceLabels[device].title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <RangeField
                      label={`Like score: ${input.likeScore}`}
                      min={1}
                      max={5}
                      value={input.likeScore}
                      onChange={(value) =>
                        updateInput(index, {
                          likeScore: value as DeviceInput["likeScore"],
                        })
                      }
                    />

                    <RangeField
                      label={`Love: ${input.lovePercent}%`}
                      min={0}
                      max={100}
                      value={input.lovePercent}
                      onChange={(value) =>
                        updateInput(index, {
                          lovePercent: value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="art-label text-xs text-slate-500">
                        Frequency
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {frequencyOptions.map((frequency) => (
                          <button
                            key={frequency}
                            type="button"
                            onClick={() =>
                              updateInput(index, {
                                frequency,
                              })
                            }
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              input.frequency === frequency
                                ? "border-sky-300/60 bg-sky-200/10 text-sky-100"
                                : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                            }`}
                          >
                            {frequency}
                          </button>
                        ))}
                      </div>
                    </div>

                    <RangeField
                      label={`Hate rank: ${input.hateRank}`}
                      min={1}
                      max={inputs.length}
                      value={input.hateRank}
                      onChange={(value) =>
                        updateInput(index, {
                          hateRank: value,
                        })
                      }
                    />

                    <RangeField
                      label={`Dependence: ${input.dependenceScore ?? 3}`}
                      min={1}
                      max={5}
                      value={input.dependenceScore ?? 3}
                      onChange={(value) =>
                        updateInput(index, {
                          dependenceScore: value as DeviceInput["dependenceScore"],
                        })
                      }
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="glass-panel rounded-[2rem] p-6 md:p-8">
            <p className="art-label text-xs text-slate-500">Immediate read</p>
            <h2 className="mt-3 text-4xl leading-none text-stone-100">
              {snapshot.headline}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              {snapshot.subheadline}
            </p>
          </section>

          <section className="glass-panel rounded-[2rem] p-6 md:p-8">
            <p className="art-label text-xs text-slate-500">Characters</p>
            <div className="mt-5 grid gap-3">
              {snapshot.characters.map((character) => (
                <article
                  key={character.deviceType}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl leading-none">{character.emoji}</p>
                      <h3 className="mt-3 text-2xl text-stone-100">
                        {character.name}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {character.relationshipLabel}
                      </p>
                    </div>
                    <div className="text-right text-xs leading-6 text-slate-400">
                      <div>Pride {character.pride}</div>
                      <div>Resentment {character.resentment}</div>
                      <div>Neglect {character.neglect}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6 md:p-8">
            <p className="art-label text-xs text-slate-500">Live reactions</p>
            <div className="mt-5 space-y-3">
              {snapshot.reactions.map((reaction, index) => (
                <article
                  key={`${reaction.speaker}-${index}`}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    {reaction.emoji} {reaction.speaker} · {reaction.tone}
                  </p>
                  <p className="mt-2 text-[15px] leading-7 text-slate-100">
                    {reaction.text}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-sky-200"
      />
    </label>
  );
}
