"use client";

import Link from "next/link";
import { useBackchannel } from "@/components/backchannel/provider";
import { DeviceCardGrid, ScreenFrame } from "@/components/backchannel/shared";

export function SelectionScreen() {
  const { state, toggleDevice } = useBackchannel();
  const isManual = state.participantMode === "manual";
  const selectionCount = state.selectedDevices.length;
  const canContinue = !isManual || (selectionCount >= 5 && selectionCount <= 6);

  return (
    <ScreenFrame
      title={state.content.selectionTitle}
      description={state.content.selectionDescription}
      step="Step 02"
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-400">
          {isManual
            ? `Select 5 to 6 devices. Currently selected: ${selectionCount}.`
            : "Sample participant mode is active. The seeded set is already loaded."}
        </p>

        <DeviceCardGrid
          selectedDevices={state.selectedDevices}
          onToggle={(device) => {
            if (isManual) {
              toggleDevice(device);
            }
          }}
        />

        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm text-slate-300"
          >
            Back
          </Link>
          <Link
            href={canContinue ? "/rating" : "/selection"}
            className={`rounded-full border px-5 py-3 text-sm ${
              canContinue
                ? "border-sky-400 bg-sky-400/10 text-sky-200"
                : "border-slate-700 text-slate-500"
            }`}
          >
            Continue
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}
