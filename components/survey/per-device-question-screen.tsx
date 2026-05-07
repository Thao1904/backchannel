import { DeviceCluster } from "@/components/survey/device-cluster";
import { EaseHeartSlider } from "@/components/survey/ease-heart-slider";
import { FrequencyVerticalSlider } from "@/components/survey/frequency-vertical-slider";
import { HelpPercentSlider } from "@/components/survey/help-percent-slider";
import { LikeVerticalSlider } from "@/components/survey/like-vertical-slider";
import { StepHeader } from "@/components/survey/step-header";
import { VerticalDeviceStack } from "@/components/survey/vertical-device-stack";
import { DeviceType, FrequencyOption } from "@/lib/survey-prototype/types";
import type { ReactNode } from "react";

type PerDeviceQuestionScreenProps = {
  device: DeviceType;
  devices: DeviceType[];
  questionNumber: number;
  title: string;
  description?: ReactNode;
  type: "like" | "frequency" | "helpPercent" | "easeOfUse";
  value?: number | FrequencyOption;
  onChange: (value: number | FrequencyOption) => void;
};

function PerDeviceControlLayout({
  devices,
  activeDevice,
  children,
}: {
  devices: DeviceType[];
  activeDevice: DeviceType;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto mt-8 grid w-full max-w-[560px] select-none grid-cols-[minmax(0,1fr)_136px] items-center gap-5 pt-4 sm:gap-7">
      <div className="flex min-w-0 justify-center">
        <VerticalDeviceStack devices={devices} activeDevice={activeDevice} />
      </div>
      <div className="flex min-w-[136px] justify-center">{children}</div>
    </div>
  );
}

export function PerDeviceQuestionScreen({
  device,
  devices,
  questionNumber,
  title,
  description,
  type,
  value,
  onChange,
}: PerDeviceQuestionScreenProps) {
  return (
    <div className="flex flex-1 flex-col justify-between pt-10">
      <div>
        <StepHeader
          eyebrow={`Question ${questionNumber}`}
          title={title}
          description={description}
        />

        {type === "like" ? (
          <PerDeviceControlLayout devices={devices} activeDevice={device}>
            <LikeVerticalSlider
              value={typeof value === "number" ? value : undefined}
              onChange={(nextValue) => onChange(nextValue)}
            />
          </PerDeviceControlLayout>
        ) : type === "helpPercent" ? (
          <PerDeviceControlLayout devices={devices} activeDevice={device}>
            <HelpPercentSlider
              value={typeof value === "number" ? value : 0}
              onChange={(nextValue) => onChange(nextValue)}
            />
          </PerDeviceControlLayout>
        ) : type === "frequency" ? (
          <PerDeviceControlLayout devices={devices} activeDevice={device}>
            <FrequencyVerticalSlider
              value={typeof value === "string" ? value : undefined}
              onChange={(nextValue) => onChange(nextValue)}
            />
          </PerDeviceControlLayout>
        ) : type === "easeOfUse" ? (
          <PerDeviceControlLayout devices={devices} activeDevice={device}>
            <EaseHeartSlider
              value={typeof value === "number" ? value : undefined}
              onChange={(nextValue) => onChange(nextValue)}
            />
          </PerDeviceControlLayout>
        ) : (
          <DeviceCluster
            devices={devices}
            activeDevice={device}
            emphasisScale={1}
            emphasisOpacity={1}
          />
        )}
      </div>

      <div className="mx-auto mt-2 w-full max-w-[420px]">
      </div>
    </div>
  );
}
