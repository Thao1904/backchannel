import Image from "next/image";
import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import { DeviceType } from "@/lib/survey-prototype/types";

type DeviceIllustrationProps = {
  device: DeviceType;
  size: "small" | "medium" | "large";
  muted?: boolean;
  emphasized?: boolean;
};

const sizeClasses = {
  small: "h-11 w-11 sm:h-14 sm:w-14",
  medium: "h-12 w-12 sm:h-16 sm:w-16",
  large: "h-28 w-28 sm:h-32 sm:w-32",
};

export function DeviceIllustration({
  device,
  size,
  muted,
  emphasized,
}: DeviceIllustrationProps) {
  const definition = getDeviceDefinition(device);

  return (
    <div
      className={[
        "relative transition duration-500 ease-out",
        sizeClasses[size],
        emphasized ? "scale-[1.06]" : "scale-100",
        muted ? "opacity-70 grayscale-[0.08]" : "opacity-100",
      ].join(" ")}
    >
      <Image
        src={definition.imagePath}
        alt={definition.label}
        fill
        sizes="(max-width: 640px) 96px, 160px"
        className="object-contain"
      />
    </div>
  );
}
