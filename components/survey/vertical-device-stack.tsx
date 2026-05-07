import { DeviceIllustration } from "@/components/survey/device-illustration";
import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import { DeviceType } from "@/lib/survey-prototype/types";

type VerticalDeviceStackProps = {
  devices: DeviceType[];
  activeDevice: DeviceType;
};

export function VerticalDeviceStack({
  devices,
  activeDevice,
}: VerticalDeviceStackProps) {
  const activeIndex = devices.indexOf(activeDevice);

  return (
    <div className="relative h-[500px] w-[300px] max-w-full select-none">
      {devices.map((device, index) => {
        const relative = index - activeIndex;
        const distance = Math.abs(relative);
        const isActive = relative === 0;
        const isAdjacent = distance === 1;
        const isVisible = isActive || isAdjacent;
        const translateY =
          relative === 0
            ? 0
            : relative > 0
              ? isAdjacent
                ? 184
                : 184 + (distance - 1) * 132
              : isAdjacent
                ? -142
                : -142 - (distance - 1) * 118;
        const translateX = isActive ? 0 : isAdjacent ? 4 : 10;
        const scale = isActive ? 1.18 : isAdjacent ? 0.64 : 0.42;
        const opacity = isActive ? 1 : isAdjacent ? 0.3 : 0;
        const labelOpacity = isActive ? 1 : isAdjacent ? 0.2 : 0;

        return (
          <div
            key={device}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-500 ease-out"
            style={{
              transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`,
              opacity,
              zIndex: 20 - distance,
              pointerEvents: isVisible ? "auto" : "none",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 rounded-full bg-[#ffddef] transition-all duration-500 ease-out"
              style={{
                width: isActive ? 176 : 0,
                height: isActive ? 176 : 0,
                transform: "translate(-50%, -50%)",
                opacity: isActive ? 0.82 : 0,
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
            {isActive ? (
              <span
                className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 rounded-full border-[2px] border-black/75 bg-[var(--acid)] px-3 py-0.5 text-[12px] font-bold uppercase tracking-[0.14em] text-black transition-all duration-500 ease-out"
                style={{ opacity: labelOpacity }}
              >
                {getDeviceDefinition(device).shortLabel}
              </span>
            ) : isAdjacent ? (
              <span
                className="mt-4 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black/70 transition-opacity duration-500 ease-out"
                style={{ opacity: labelOpacity }}
              >
                {getDeviceDefinition(device).shortLabel}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
