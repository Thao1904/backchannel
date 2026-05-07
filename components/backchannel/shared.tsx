"use client";

import Link from "next/link";
import {
  DEVICE_TYPES,
  USE_FREQUENCIES,
  type DeviceInput,
  type DeviceType,
  type UseFrequency,
} from "@/types/backchannel";

export const deviceLabels: Record<DeviceType, { title: string; emoji: string }> = {
  phone: { title: "Phone", emoji: "📱" },
  laptop: { title: "Laptop", emoji: "💻" },
  microwave: { title: "Microwave", emoji: "📡" },
  vacuum: { title: "Vacuum", emoji: "🌀" },
  rice_cooker: { title: "Rice Cooker", emoji: "🍚" },
  kettle: { title: "Kettle", emoji: "🫖" },
  oven: { title: "Oven", emoji: "🔥" },
  dishwasher: { title: "Dishwasher", emoji: "🫧" },
  washing_machine: { title: "Washing Machine", emoji: "🧺" },
};

export function ScreenFrame({
  title,
  description,
  children,
  step,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  step: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="art-label text-xs text-slate-400">
          Backchannel
        </Link>
        <Link href="/dashboard" className="art-label text-xs text-slate-400">
          Content dashboard
        </Link>
      </div>

      <section className="glass-panel subtle-grid overflow-hidden rounded-[2rem] p-8 md:p-10">
        <p className="art-label text-xs text-sky-200/80">{step}</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-none text-stone-100 md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

export function ToggleRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="art-label text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              value === option.value
                ? "border-sky-300/60 bg-sky-200/10 text-sky-100"
                : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DeviceCardGrid({
  selectedDevices,
  onToggle,
}: {
  selectedDevices: DeviceType[];
  onToggle: (device: DeviceType) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DEVICE_TYPES.map((device) => {
        const meta = deviceLabels[device];
        const selected = selectedDevices.includes(device);

        return (
          <button
            key={device}
            type="button"
            onClick={() => onToggle(device)}
            className={`rounded-[1.6rem] border p-5 text-left transition ${
              selected
                ? "border-sky-300/60 bg-sky-200/10"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
          >
            <p className="text-2xl leading-none">
              {meta.emoji}
            </p>
            <p className="mt-3 text-2xl text-stone-100">{meta.title}</p>
          </button>
        );
      })}
    </div>
  );
}

export function RatingCard({
  input,
  maxHateRank,
  onChange,
}: {
  input: DeviceInput;
  maxHateRank: number;
  onChange: (patch: Partial<DeviceInput>) => void;
}) {
  const meta = deviceLabels[input.deviceType];

  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl leading-none">
            {meta.emoji}
          </p>
          <h2 className="mt-3 text-3xl text-stone-100">{meta.title}</h2>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <SliderField
          label={`Like score: ${input.likeScore}`}
          min={1}
          max={5}
          value={input.likeScore}
          onChange={(value) =>
            onChange({ likeScore: value as DeviceInput["likeScore"] })
          }
        />

        <ChipField
          label="Use frequency"
          options={USE_FREQUENCIES.map((item) => ({
            value: item,
            label: item,
          }))}
          value={input.frequency}
          onChange={(value) => onChange({ frequency: value as UseFrequency })}
        />

        <SliderField
          label={`Love percentage: ${input.lovePercent}%`}
          min={0}
          max={100}
          value={input.lovePercent}
          onChange={(value) => onChange({ lovePercent: value })}
        />

        <SliderField
          label={`Hate rank: ${input.hateRank}`}
          min={1}
          max={maxHateRank}
          value={input.hateRank}
          onChange={(value) => onChange({ hateRank: value })}
        />

        <SliderField
          label={`Dependence score: ${input.dependenceScore ?? 3}`}
          min={1}
          max={5}
          value={input.dependenceScore ?? 3}
          onChange={(value) =>
            onChange({ dependenceScore: value as DeviceInput["dependenceScore"] })
          }
        />
      </div>
    </article>
  );
}

function SliderField({
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

function ChipField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-2 text-sm transition ${
              option.value === value
                ? "border-sky-300/60 bg-sky-200/10 text-sky-100"
                : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
