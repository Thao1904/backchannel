import { DeviceCard } from "@/components/survey/device-card";
import { StepHeader } from "@/components/survey/step-header";
import { DeviceType } from "@/lib/survey-prototype/types";
import type { ReactNode } from "react";

type MultiSelectQuestionScreenProps = {
  title: string;
  description?: ReactNode;
  devices: DeviceType[];
  selectedDevices: DeviceType[];
  onToggle: (device: DeviceType) => void;
};

export function MultiSelectQuestionScreen({
  title,
  description,
  devices,
  selectedDevices,
  onToggle,
}: MultiSelectQuestionScreenProps) {
  return (
    <div className="flex flex-1 flex-col pt-10">
      <StepHeader title={title} description={description} />
      <div className="mx-auto mt-12 grid w-full max-w-[620px] grid-cols-2 gap-4 sm:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device}
            device={device}
            selected={selectedDevices.includes(device)}
            onClick={() => onToggle(device)}
            compact
          />
        ))}
      </div>
    </div>
  );
}
