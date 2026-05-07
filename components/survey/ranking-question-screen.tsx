"use client";

import {
  DragEvent,
  PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getDeviceDefinition, moveItem } from "@/lib/survey-prototype/backchannel-data";
import { DeviceIllustration } from "@/components/survey/device-illustration";
import { DeviceType } from "@/lib/survey-prototype/types";
import { StepHeader } from "@/components/survey/step-header";

type RankingQuestionScreenProps = {
  title: string;
  description?: ReactNode;
  devices: DeviceType[];
  onChange: (devices: DeviceType[]) => void;
};

export function RankingQuestionScreen({
  title,
  description,
  devices,
  onChange,
}: RankingQuestionScreenProps) {
  const itemRefs = useRef(new Map<DeviceType, HTMLDivElement>());
  const positionsRef = useRef(new Map<DeviceType, DOMRect>());
  const movedRef = useRef<DeviceType | null>(null);
  const draggedRef = useRef<DeviceType | null>(null);
  const pointerDragStartedRef = useRef(false);
  const pointerTimeoutRef = useRef<number | null>(null);
  const hasAnimatedInRef = useRef(false);
  const [draggingDevice, setDraggingDevice] = useState<DeviceType | null>(null);
  const prefersTouchDrag = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("drag-select-lock", Boolean(draggingDevice));
    document.body.classList.toggle("drag-select-lock", Boolean(draggingDevice));
    window.getSelection()?.removeAllRanges();

    return () => {
      document.documentElement.classList.remove("drag-select-lock");
      document.body.classList.remove("drag-select-lock");
    };
  }, [draggingDevice]);

  useEffect(() => {
    if (hasAnimatedInRef.current) {
      return;
    }

    hasAnimatedInRef.current = true;

    devices.forEach((device, index) => {
      const node = itemRefs.current.get(device);
      if (!node) return;

      node.animate(
        [
          {
            opacity: 0,
            transform: "translateY(26px) scale(0.985)",
          },
          {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        ],
        {
          duration: 560,
          delay: index * 55,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
    });
  }, [devices]);

  useLayoutEffect(() => {
    const nextPositions = new Map<DeviceType, DOMRect>();

    devices.forEach((device) => {
      const node = itemRefs.current.get(device);
      if (!node) return;
      const nextRect = node.getBoundingClientRect();
      nextPositions.set(device, nextRect);

      const previousRect = positionsRef.current.get(device);
      if (!previousRect) return;

      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaY) < 1) return;

      node.animate(
        [
          {
            transform:
              movedRef.current === device
                ? `translateY(${deltaY}px) scale(1.035)`
                : `translateY(${deltaY}px) scale(1)`,
            boxShadow:
              movedRef.current === device
                ? "0 10px 30px rgba(0,0,0,0.04)"
                : "0 0 0 rgba(0,0,0,0)",
          },
          {
            transform: "translateY(0) scale(1)",
            boxShadow: "0 0 0 rgba(0,0,0,0)",
          },
        ],
        {
          duration: movedRef.current === device ? 520 : 460,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });

    if (positionsRef.current.size === 0) {
      positionsRef.current = nextPositions;
      movedRef.current = null;
      return;
    }

    positionsRef.current = nextPositions;
    movedRef.current = null;
  }, [devices]);

  function handleDragStart(event: DragEvent<HTMLDivElement>, device: DeviceType) {
    draggedRef.current = device;
    setDraggingDevice(device);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", device);

    const target = event.currentTarget;
    const preview = target.cloneNode(true) as HTMLDivElement;
    preview.style.position = "absolute";
    preview.style.top = "-9999px";
    preview.style.left = "-9999px";
    preview.style.width = `${target.offsetWidth}px`;
    preview.style.transform = "rotate(2deg)";
    preview.style.opacity = "0.96";
    preview.style.pointerEvents = "none";
    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(preview, preview.offsetWidth / 2, preview.offsetHeight / 2);
    window.setTimeout(() => preview.remove(), 0);
  }

  function handleDragEnd() {
    if (pointerTimeoutRef.current !== null) {
      window.clearTimeout(pointerTimeoutRef.current);
      pointerTimeoutRef.current = null;
    }
    draggedRef.current = null;
    pointerDragStartedRef.current = false;
    setDraggingDevice(null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(targetDevice: DeviceType) {
    const draggedDevice = draggedRef.current;
    if (!draggedDevice || draggedDevice === targetDevice) {
      handleDragEnd();
      return;
    }

    const fromIndex = devices.indexOf(draggedDevice);
    const toIndex = devices.indexOf(targetDevice);
    if (fromIndex === -1 || toIndex === -1) {
      handleDragEnd();
      return;
    }

    movedRef.current = draggedDevice;
    onChange(moveItem(devices, fromIndex, toIndex));
    handleDragEnd();
  }

  function reorderToward(targetDevice: DeviceType) {
    const draggedDevice = draggedRef.current;
    if (!draggedDevice || draggedDevice === targetDevice) {
      return;
    }

    const fromIndex = devices.indexOf(draggedDevice);
    const toIndex = devices.indexOf(targetDevice);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    movedRef.current = draggedDevice;
    onChange(moveItem(devices, fromIndex, toIndex));
  }

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>,
    device: DeviceType,
  ) {
    if (!prefersTouchDrag) {
      return;
    }

    draggedRef.current = device;
    pointerDragStartedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);

    pointerTimeoutRef.current = window.setTimeout(() => {
      pointerDragStartedRef.current = true;
      setDraggingDevice(device);
    }, 180);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!prefersTouchDrag || !pointerDragStartedRef.current) {
      return;
    }

    event.preventDefault();

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-ranking-device]");

    const targetDevice = target?.dataset.rankingDevice as DeviceType | undefined;
    if (targetDevice) {
      reorderToward(targetDevice);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!prefersTouchDrag) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    handleDragEnd();
  }

  return (
    <div className="flex flex-1 flex-col pt-10">
      <StepHeader title={title} description={description} />
      <p className="mx-auto mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b06d95]">
        {prefersTouchDrag ? "Hold and move to reorder" : "Drag to reorder"}
      </p>
      <div className="soft-scrollbar mx-auto mt-8 flex w-full max-w-[560px] select-none flex-col gap-3 overflow-auto pr-1">
        {devices.map((device, index) => {
          const definition = getDeviceDefinition(device);
          return (
            <div
              key={device}
              data-ranking-device={device}
              ref={(node) => {
                if (node) itemRefs.current.set(device, node);
                else itemRefs.current.delete(device);
              }}
              draggable={!prefersTouchDrag}
              onDragStart={(event) => handleDragStart(event, device)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(device)}
              onPointerDown={(event) => handlePointerDown(event, device)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={[
                "flex items-center gap-4 rounded-[24px] border-[4px] border-black bg-[#ffc7e8] px-4 py-4 will-change-transform hover:bg-[var(--acid)] hover:shadow-[0_6px_0_rgba(255,79,192,0.24)]",
                prefersTouchDrag ? "cursor-default touch-none" : "cursor-grab active:cursor-grabbing",
                draggingDevice === device
                  ? "scale-[1.015] rotate-[1deg] shadow-[0_6px_0_rgba(255,79,192,0.24)]"
                  : "transition-transform duration-300",
              ].join(" ")}
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold tracking-normal text-black sm:h-14 sm:w-14 sm:text-lg">
                {index + 1}
              </div>
              <div className="text-[#8d5572]">
                <DeviceIllustration device={device} size="medium" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-[#1f1420]">{definition.label}</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 pr-1 text-black">
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
