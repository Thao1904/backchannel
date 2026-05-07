"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DeviceCard } from "@/components/survey/device-card";
import { MultiSelectQuestionScreen } from "@/components/survey/multi-select-question-screen";
import { OnboardingShell } from "@/components/survey/onboarding-shell";
import { PerDeviceQuestionScreen } from "@/components/survey/per-device-question-screen";
import { RankingQuestionScreen } from "@/components/survey/ranking-question-screen";
import { SingleChoiceQuestionScreen } from "@/components/survey/single-choice-question-screen";
import { StepHeader } from "@/components/survey/step-header";
import {
  createInitialState,
  DEVICE_DEFINITIONS,
  getDeviceDefinition,
} from "@/lib/survey-prototype/backchannel-data";
import {
  DeviceResponse,
  DeviceType,
  FrequencyOption,
  OnboardingState,
} from "@/lib/survey-prototype/types";

type BackchannelPrototypeProps = {
  onComplete?: (state: OnboardingState) => void;
};

type PerDevicePrompt = {
  kind: "like" | "frequency" | "helpPercent" | "easeOfUse";
  title: string;
  description: string;
};

type FlowStep =
  | { kind: "name" }
  | { kind: "start" }
  | { kind: "select" }
  | { kind: "per-device"; prompt: PerDevicePrompt; device: DeviceType }
  | { kind: "favorite" }
  | { kind: "replace" }
  | { kind: "essential" }
  | { kind: "neverReplace" }
  | { kind: "handoff" };

const perDevicePrompts: PerDevicePrompt[] = [
  {
    kind: "like",
    title: "How much do you like this?",
    description: "A simple measure from 1 to 5, held briefly against the object in the center.",
  },
  {
    kind: "frequency",
    title: "How often do you use it?",
    description: "Choose the rhythm that feels closest.",
  },
  {
    kind: "helpPercent",
    title: "How much does it help you?",
    description: "Slide somewhere between absence and total dependence.",
  },
  {
    kind: "easeOfUse",
    title: "How easy is it to use?",
    description: "Keep the answer plain. 1 to 5 is enough.",
  },
];

function buildFlow(selectedDevices: DeviceType[]): FlowStep[] {
  const steps: FlowStep[] = [{ kind: "name" }, { kind: "start" }, { kind: "select" }];

  if (selectedDevices.length === 5) {
    perDevicePrompts.forEach((prompt) => {
      selectedDevices.forEach((device) => {
        steps.push({ kind: "per-device", prompt, device });
      });
    });

    steps.push(
      { kind: "favorite" },
      { kind: "replace" },
      { kind: "essential" },
      { kind: "neverReplace" },
      { kind: "handoff" },
    );
  }

  return steps;
}

function isPerDeviceAnswerComplete(
  response: DeviceResponse | undefined,
  kind: PerDevicePrompt["kind"],
) {
  if (!response) return false;

  switch (kind) {
    case "like":
      return typeof response.like === "number";
    case "frequency":
      return typeof response.frequency === "string";
    case "helpPercent":
      return typeof response.helpPercent === "number";
    case "easeOfUse":
      return typeof response.easeOfUse === "number";
  }
}

export function BackchannelPrototype({
  onComplete,
}: BackchannelPrototypeProps) {
  const [state, setState] = useState<OnboardingState>(createInitialState);
  const [stepIndex, setStepIndex] = useState(0);
  const addressee = state.userName.trim() || "you";
  const addressedName = <span className="font-bold text-[var(--accent-strong)]">{addressee}</span>;

  const flow = useMemo(() => buildFlow(state.selectedDevices), [state.selectedDevices]);
  const step = flow[Math.min(stepIndex, flow.length - 1)];
  const currentStep = step.kind === "handoff" ? flow.length - 1 : stepIndex + 1;

  function updateState(updater: (current: OnboardingState) => OnboardingState) {
    setState((current) => updater(current));
  }

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, flow.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function updateDeviceResponse(
    device: DeviceType,
    patch: Partial<DeviceResponse>,
  ) {
    updateState((current) => ({
      ...current,
      deviceResponses: {
        ...current.deviceResponses,
        [device]: {
          ...current.deviceResponses[device],
          ...patch,
        },
      },
    }));
  }

  function toggleSelection(device: DeviceType) {
    updateState((current) => {
      const exists = current.selectedDevices.includes(device);
      if (exists) {
        const selectedDevices = current.selectedDevices.filter((item) => item !== device);
        return {
          ...current,
          selectedDevices,
          favorite:
            current.favorite && selectedDevices.includes(current.favorite)
              ? current.favorite
              : undefined,
          replaceRanking: current.replaceRanking.filter((item) => item !== device),
          essentialRanking: current.essentialRanking.filter((item) => item !== device),
          neverReplace: current.neverReplace.filter((item) => item !== device),
        };
      }

      if (current.selectedDevices.length >= 5) {
        return current;
      }

      return {
        ...current,
        selectedDevices: [...current.selectedDevices, device],
      };
    });
  }

  function setSelectedDevices(devices: DeviceType[]) {
    updateState((current) => ({
      ...current,
      selectedDevices: devices,
    }));
  }

  function restart() {
    setState(createInitialState());
    setStepIndex(0);
  }

  let nextDisabled = false;
  let nextLabel = "Next";
  let footerSlot: React.ReactNode = null;
  let content: React.ReactNode = null;

  if (step.kind === "name") {
    nextLabel = "Continue";
    nextDisabled = !state.userName.trim();
    content = (
      <div className="flex flex-1 flex-col justify-center">
        <StepHeader
          eyebrow="Backchannel"
          title="What should we call you?"
          description="A name or nickname is enough. The system will use it as it speaks to you."
        />
        <div className="mx-auto mt-16 w-full max-w-[740px]">
          <label className="mb-4 block text-center text-[13px] font-bold uppercase tracking-[0.18em] text-black/32">
            name/nickname
          </label>
          <input
            type="text"
            value={state.userName}
            onChange={(event) =>
              updateState((current) => ({
                ...current,
                userName: event.target.value,
              }))
            }
            placeholder="Enter a name"
            className="w-full rounded-[36px] border-[4px] border-black/80 bg-white px-4 py-2 text-center text-[112px] font-bold leading-none normal-case text-[#c72f68] outline-none transition placeholder:text-center placeholder:text-[40px] placeholder:font-bold placeholder:leading-none placeholder:normal-case placeholder:text-black/20 focus:-translate-y-0.5 focus:border-black focus:bg-[var(--acid)] sm:text-[176px] sm:placeholder:text-[56px]"
          />
        </div>
      </div>
    );
  }

  if (step.kind === "start") {
    nextLabel = "Begin";
    content = (
      <div className="flex flex-1 flex-col justify-center">
        <StepHeader
          eyebrow="Backchannel"
          title="Onboarding Survey"
          description={
            <>
              Select a small constellation of devices, {addressedName}, then answer a sequence of calm, slightly odd questions about dependence, use, replacement, and attachment.
            </>
          }
        />
        <div className="mx-auto mt-14 flex h-[420px] w-full max-w-[860px] items-center justify-center">
          <div className="relative aspect-[2/1] w-full max-w-[650px] sm:max-w-[780px]">
            <Image
              src="/devices/v2/onboarding.png"
              alt="A constellation of household devices"
              fill
              priority
              sizes="(max-width: 640px) 650px, 780px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "select") {
    const exactlyFive = state.selectedDevices.length === 5;
    nextDisabled = !exactlyFive;
    nextLabel = "Continue";
    content = (
      <div className="flex min-h-0 flex-1 flex-col pt-10">
        <StepHeader
          eyebrow="Step 1"
          title="Pick five devices."
          description={
            <>
              Keep the set limited, {addressedName}. Five objects only.
            </>
          }
        />
        <div className="soft-scrollbar mx-auto mt-8 grid max-h-[min(52vh,560px)] w-full max-w-[660px] grid-cols-2 gap-4 overflow-y-auto pr-2 pb-2 sm:grid-cols-3">
          {DEVICE_DEFINITIONS.map((device) => (
            <DeviceCard
              key={device.id}
              device={device.id}
              selected={state.selectedDevices.includes(device.id)}
              onClick={() => toggleSelection(device.id)}
              annotation={`${state.selectedDevices.length}/5 chosen`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step.kind === "per-device") {
    const response = state.deviceResponses[step.device] ?? {};
    const label = getDeviceDefinition(step.device).label.toLowerCase();
    nextDisabled = !isPerDeviceAnswerComplete(response, step.prompt.kind);
    content = (
      <PerDeviceQuestionScreen
        device={step.device}
        devices={state.selectedDevices}
        questionNumber={perDevicePrompts.findIndex((prompt) => prompt.kind === step.prompt.kind) + 1}
        title={step.prompt.title}
        description={
          <>
            For {label}, {addressedName}. {step.prompt.description}
          </>
        }
        type={step.prompt.kind}
        value={
          step.prompt.kind === "like"
            ? response.like
            : step.prompt.kind === "frequency"
              ? response.frequency
              : step.prompt.kind === "helpPercent"
                ? response.helpPercent
                : response.easeOfUse
        }
        onChange={(value) => {
          if (step.prompt.kind === "like") {
            updateDeviceResponse(step.device, { like: value as number });
          }
          if (step.prompt.kind === "frequency") {
            updateDeviceResponse(step.device, { frequency: value as FrequencyOption });
          }
          if (step.prompt.kind === "helpPercent") {
            updateDeviceResponse(step.device, { helpPercent: value as number });
          }
          if (step.prompt.kind === "easeOfUse") {
            updateDeviceResponse(step.device, { easeOfUse: value as number });
          }
        }}
      />
    );
  }

  if (step.kind === "favorite") {
    nextDisabled = !state.favorite;
    content = (
      <SingleChoiceQuestionScreen
        title="Which is your favorite?"
        description={
          <>
            Pick one from the five, {addressedName}.
          </>
        }
        devices={state.selectedDevices}
        value={state.favorite}
        onSelect={(device) => updateState((current) => ({ ...current, favorite: device }))}
      />
    );
  }

  if (step.kind === "replace") {
    nextDisabled = state.replaceRanking.length !== 5;
    content = (
      <RankingQuestionScreen
        title="Which would you replace?"
        description={
          <>
            Arrange them from most replaceable to least replaceable, {addressedName}.
          </>
        }
        devices={
          state.replaceRanking.length === state.selectedDevices.length
            ? state.replaceRanking
            : state.selectedDevices
        }
        onChange={(devices) =>
          updateState((current) => ({
            ...current,
            replaceRanking: devices,
          }))
        }
      />
    );
  }

  if (step.kind === "essential") {
    nextDisabled = state.essentialRanking.length !== 5;
    content = (
      <RankingQuestionScreen
        title="Which can you not live without?"
        description={
          <>
            Arrange them from most essential to least essential, {addressedName}.
          </>
        }
        devices={
          state.essentialRanking.length === state.selectedDevices.length
            ? state.essentialRanking
            : state.selectedDevices
        }
        onChange={(devices) =>
          updateState((current) => ({
            ...current,
            essentialRanking: devices,
          }))
        }
      />
    );
  }

  if (step.kind === "neverReplace") {
    content = (
      <MultiSelectQuestionScreen
        title="Which would you never replace?"
        description={
          <>
            Choose any number of devices from the five, {addressedName}.
          </>
        }
        devices={state.selectedDevices}
        selectedDevices={state.neverReplace}
        onToggle={(device) =>
          updateState((current) => ({
            ...current,
            neverReplace: current.neverReplace.includes(device)
              ? current.neverReplace.filter((item) => item !== device)
              : [...current.neverReplace, device],
          }))
        }
      />
    );
  }

  if (step.kind === "handoff") {
    content = (
      <div className="relative flex min-h-full flex-1 items-center justify-center">
        <Link
          href="/chat/settings?source=survey"
          className="absolute right-0 top-0 rounded-full border-[3px] border-black/85 bg-white px-5 py-2.5 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe2f3]"
        >
          Settings
        </Link>
        <div className="mx-auto max-w-[560px] rounded-[36px] border-[4px] border-black/80 bg-white/78 px-8 py-10 text-center shadow-[0_14px_0_rgba(24,21,21,0.08)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/38">
            backchannel
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-black sm:text-5xl">
            Oh. Something sounds loud over there.
          </h2>
          <p className="mt-5 text-base leading-8 text-black/62">
            It looks like they want to avoid your gaze. If your eyes are fully
            exposed, the conversation may not stay readable for long.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                onComplete?.(state);
              }}
              className="rounded-full border-[3px] border-black/85 bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe2f3]"
            >
              Check it out
            </button>
            <button
              type="button"
              onClick={restart}
              className="rounded-full border-[3px] border-black/85 bg-white px-6 py-3 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe2f3]"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "select") {
    footerSlot = (
      <p className="text-center text-[11px] uppercase tracking-[0.14em] text-black/35">
        {state.selectedDevices.length === 5
          ? "Five held in view"
          : `${5 - state.selectedDevices.length} remaining`}
      </p>
    );
  }

  if (step.kind === "handoff") {
    return (
      <OnboardingShell
        currentStep={currentStep}
        totalSteps={flow.length}
        hideFooter
      >
        {content}
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      currentStep={currentStep}
      totalSteps={flow.length}
      canGoBack={stepIndex > 0}
      onBack={goBack}
      onNext={() => {
        if (step.kind === "select") {
          setSelectedDevices(state.selectedDevices);
          updateState((current) => ({
            ...current,
            replaceRanking: [...current.selectedDevices],
            essentialRanking: [...current.selectedDevices],
          }));
        }
        goNext();
      }}
      nextLabel={nextLabel}
      nextDisabled={nextDisabled}
      footerSlot={footerSlot}
    >
      <div className="flex min-h-full flex-col animate-[fadeIn_480ms_ease]">
        {content}
      </div>
    </OnboardingShell>
  );
}
