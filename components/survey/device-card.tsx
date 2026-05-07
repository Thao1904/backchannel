import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import { DeviceIllustration } from "@/components/survey/device-illustration";
import { DeviceType } from "@/lib/survey-prototype/types";

type DeviceCardProps = {
  device: DeviceType;
  selected?: boolean;
  faded?: boolean;
  compact?: boolean;
  onClick?: () => void;
  annotation?: string;
};

export function DeviceCard({
  device,
  selected,
  faded,
  compact,
  onClick,
  annotation,
}: DeviceCardProps) {
  const definition = getDeviceDefinition(device);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative select-none rounded-[30px] border-[3px] text-left transition duration-300 hover:-translate-y-1",
        compact ? "p-3 pt-8" : "p-4 pt-9 sm:p-5 sm:pt-10",
        selected
          ? "border-black/85 bg-[#ffc3ea] shadow-[0_10px_0_rgba(24,21,21,0.08)]"
          : "border-black/85 bg-[var(--panel-strong)]",
        faded ? "opacity-40" : "opacity-100",
      ].join(" ")}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {selected ? (
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-black/75 bg-[var(--acid)] text-base font-bold text-black">
          ✓
        </span>
      ) : (
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-black/75 bg-[var(--acid)] text-base font-bold text-black opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          +
        </span>
      )}
      <div className="flex items-start justify-center gap-3">
        <div className="text-black/80">
          <DeviceIllustration
            device={device}
            size={compact ? "medium" : "large"}
            muted={!selected}
            emphasized={selected}
          />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-lg font-bold tracking-normal text-black">{definition.label}</p>
        {annotation ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/48">
            {annotation}
          </p>
        ) : null}
      </div>
    </button>
  );
}
