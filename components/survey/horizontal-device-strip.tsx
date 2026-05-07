import { DeviceIllustration } from "@/components/survey/device-illustration";
import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import { DeviceType } from "@/lib/survey-prototype/types";

type HorizontalDeviceStripProps = {
  devices: DeviceType[];
  activeDevice: DeviceType;
};

export function HorizontalDeviceStrip({
  devices,
  activeDevice,
}: HorizontalDeviceStripProps) {
  const activeIndex = devices.indexOf(activeDevice);

  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[920px] px-8">
      {devices.map((device, index) => {
        const relative = index - activeIndex;
        const distance = Math.abs(relative);
        const isActive = relative === 0;
        const isAdjacent = distance === 1;
        const isVisible = isActive || isAdjacent;
        const translateX =
          relative === 0
            ? 0
            : relative > 0
              ? isAdjacent
                ? 236
                : 236 + (distance - 1) * 188
              : isAdjacent
                ? -236
                : -236 - (distance - 1) * 188;
        const translateY = isActive ? 34 : 44;

        return (
          <div
            key={device}
            className="absolute left-[55.5%] top-[64%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-all duration-500 ease-out"
            style={{
              opacity: isActive ? 1 : isAdjacent ? 0.34 : 0,
              transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${isActive ? 1.08 : 0.82})`,
              pointerEvents: isVisible ? "auto" : "none",
            }}
          >
            <div
              className="absolute left-1/2 top-[58px] rounded-full bg-black/[0.04] transition-all duration-500 ease-out"
              style={{
                width: isActive ? 178 : 0,
                height: isActive ? 178 : 0,
                transform: "translate(-50%, -50%)",
              }}
            />
            <div className="relative">
              <DeviceIllustration
                device={device}
                size="large"
                emphasized={isActive}
                muted={!isActive}
              />
            </div>
            <span
              className="mt-4 text-[11px] uppercase tracking-[0.26em] transition-opacity duration-500 ease-out"
              style={{ opacity: isActive ? 0.62 : isAdjacent ? 0.28 : 0 }}
            >
              {getDeviceDefinition(device).shortLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
