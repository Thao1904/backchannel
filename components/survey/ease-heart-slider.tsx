"use client";

import Image from "next/image";
import { PointerEvent, useEffect, useRef, useState } from "react";

type EaseHeartSliderProps = {
  value?: number;
  onChange: (value: number) => void;
};

const OPTIONS = [1, 2, 3, 4, 5] as const;
const MAX_OVERFLOW = 12;
const SLIDER_HEIGHT = 286;
const HANDLE_HEIGHT = 18;
const HANDLE_EDGE_INSET = 8;

function decay(value: number, max: number) {
  if (max === 0) return 0;

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

function notifyPointerPosition(clientX: number, clientY: number) {
  window.dispatchEvent(
    new CustomEvent("backchannel:slider-pointer", {
      detail: { clientX, clientY },
    }),
  );
}

export function EaseHeartSlider({
  value,
  onChange,
}: EaseHeartSliderProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const [overflow, setOverflow] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function measure() {
    if (sliderRef.current) {
      boundsRef.current = sliderRef.current.getBoundingClientRect();
    }
  }

  function updateFromClientY(clientY: number) {
    const bounds = boundsRef.current;
    if (!bounds) return;

    const raw = ((bounds.bottom - clientY) / bounds.height) * (OPTIONS.length - 1);
    const snapped = Math.round(raw);
    const clampedIndex = Math.min(Math.max(snapped, 0), OPTIONS.length - 1);
    onChange(OPTIONS[clampedIndex]);
    setOverflow(decay(raw - clampedIndex, MAX_OVERFLOW));
    notifyPointerPosition(bounds.left + bounds.width / 2, clientY);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    measure();
    setIsDragging(true);
    updateFromClientY(event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging || event.buttons === 0) return;
    updateFromClientY(event.clientY);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    setIsDragging(false);
    setOverflow(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const activeIndex =
    typeof value === "number"
      ? OPTIONS.indexOf(value as (typeof OPTIONS)[number])
      : 1;
  const fillHeight = `${(activeIndex / (OPTIONS.length - 1)) * 100}%`;
  const handleBottom = `${
    HANDLE_EDGE_INSET +
    (activeIndex / (OPTIONS.length - 1)) *
      (SLIDER_HEIGHT - HANDLE_HEIGHT - HANDLE_EDGE_INSET * 2)
  }px`;
  const heartScale = typeof value === "number" ? 1 + value * 0.2 : 0.82;
  const heartOpacity = typeof value === "number" ? 1 : 0.42;
  const scaleX = 1 - Math.abs(overflow) / 180;
  const scaleY = 1 + Math.abs(overflow) / 120;

  return (
    <div className="flex select-none items-center gap-5" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      <div className="relative flex h-[360px] w-[122px] flex-col items-center justify-center">
        <span className="mb-2 text-sm font-bold text-black/42">5</span>
        <div
          ref={sliderRef}
          className="relative h-[286px] w-[42px] cursor-grab touch-none select-none rounded-[18px] border-[3px] border-black/70 bg-white p-[4px] shadow-[0_8px_0_rgba(24,21,21,0.06)] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="absolute inset-[4px] overflow-hidden rounded-[14px]">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-[12px] bg-[#ff4fc0] transition-[height,transform] duration-200 ease-out"
              style={{
                height: fillHeight,
                transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: overflow >= 0 ? "bottom" : "top",
              }}
            />
          </div>
          <div
            className="pointer-events-none absolute left-1/2 z-10 h-[18px] w-[34px] -translate-x-1/2 rounded-[9px] border-[3px] border-black/75 bg-white shadow-[0_4px_0_rgba(24,21,21,0.12)] transition-[bottom] duration-200 ease-out"
            style={{ bottom: handleBottom }}
          />
          <div
            className="pointer-events-none absolute right-full mr-3 top-1/2 h-[78px] w-[78px] transition-all duration-300 ease-out"
            style={{
              transform: `translateY(-50%) scale(${heartScale})`,
              transformOrigin: "50% 50%",
              opacity: heartOpacity,
            }}
          >
            <div className="relative h-[78px] w-[78px]">
              <Image
                src="/devices/heart.svg"
                alt=""
                fill
                sizes="78px"
                className="object-contain"
              />
              {typeof value === "number" ? (
                <span className="absolute inset-0 flex items-center justify-center pt-0.5 text-[12px] font-bold text-white">
                  {value}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <span className="mt-2 text-sm font-bold text-black/42">1</span>
      </div>
    </div>
  );
}
