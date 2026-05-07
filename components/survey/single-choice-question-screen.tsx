import { DeviceCard } from "@/components/survey/device-card";
import { StepHeader } from "@/components/survey/step-header";
import { DeviceType } from "@/lib/survey-prototype/types";
import type { ReactNode } from "react";

type SingleChoiceQuestionScreenProps = {
  title: string;
  description?: ReactNode;
  devices: DeviceType[];
  value?: DeviceType;
  onSelect: (device: DeviceType) => void;
};

export function SingleChoiceQuestionScreen({
  title,
  description,
  devices,
  value,
  onSelect,
}: SingleChoiceQuestionScreenProps) {
  return (
    <div className="flex flex-1 flex-col pt-10">
      <StepHeader title={title} description={description} />
      <div className="mx-auto mt-12 grid w-full max-w-[620px] grid-cols-2 gap-4 sm:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device}
            device={device}
            selected={value === device}
            onClick={() => onSelect(device)}
            compact
          />
        ))}
      </div>
    </div>
  );
}
