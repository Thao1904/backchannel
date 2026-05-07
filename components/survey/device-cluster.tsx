import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import { DeviceIllustration } from "@/components/survey/device-illustration";
import { DeviceType } from "@/lib/survey-prototype/types";

const POSITIONS = [
  "left-[7%] top-[26%]",
  "right-[12%] top-[24%]",
  "left-[14%] bottom-[12%]",
  "right-[11%] bottom-[13%]",
  "left-[48%] bottom-[6%] -translate-x-1/2",
];

type DeviceClusterProps = {
  devices: DeviceType[];
  activeDevice?: DeviceType;
  onSelect?: (device: DeviceType) => void;
  mode?: "per-device" | "group";
  emphasizedDevice?: DeviceType;
  emphasisScale?: number;
  emphasisOpacity?: number;
};

export function DeviceCluster({
  devices,
  activeDevice,
  onSelect,
  mode = "per-device",
  emphasizedDevice,
  emphasisScale = 1,
  emphasisOpacity = 1,
}: DeviceClusterProps) {
  const others = activeDevice
    ? devices.filter((device) => device !== activeDevice)
    : devices;
  const centerDevice = activeDevice ?? emphasizedDevice ?? devices[0];
  const orderedOthers = others.slice(0, 5);

  return (
    <div className="relative mx-auto mt-8 h-[380px] w-full max-w-[520px]">
      <div
        className="absolute left-1/2 top-1/2 rounded-full bg-[#ffddef] transition-all duration-500 ease-out"
        style={{
          width: `${176 * emphasisScale}px`,
          height: `${176 * emphasisScale}px`,
          transform: "translate(-50%, -50%)",
          opacity: Math.min(0.56 + emphasisOpacity * 0.16, 0.84),
        }}
      />

      {centerDevice ? (
        <button
          key={centerDevice}
          type="button"
          onClick={onSelect ? () => onSelect(centerDevice) : undefined}
          className={[
            "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[3px] border-transparent transition-all duration-500 ease-out animate-[floatIn_420ms_ease]",
          ].join(" ")}
          style={{
            width: `${190 * emphasisScale}px`,
            height: `${190 * emphasisScale}px`,
            opacity: emphasisOpacity,
          }}
        >
          <div className="text-black">
            <DeviceIllustration
              device={centerDevice}
              size="large"
              emphasized={emphasisScale > 1}
            />
          </div>
          <p className="mt-3 rounded-full border-[2px] border-black/80 bg-white px-4 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-black">
            {getDeviceDefinition(centerDevice).shortLabel}
          </p>
        </button>
      ) : null}

      {orderedOthers.map((device, index) => {
        const definition = getDeviceDefinition(device);
        return (
          <button
            key={device}
            type="button"
            onClick={onSelect ? () => onSelect(device) : undefined}
            className={[
              "absolute flex flex-col items-center gap-2 rounded-[18px] border-[2px] border-transparent px-3 py-2 transition-all duration-500 ease-out animate-[floatIn_520ms_ease]",
              POSITIONS[index],
              mode === "per-device" ? "opacity-55" : "opacity-85",
            ].join(" ")}
          >
            <div className="text-black/75">
              <DeviceIllustration device={device} size="small" muted />
            </div>
            <span className="rounded-full border border-transparent bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black/70">
              {definition.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
