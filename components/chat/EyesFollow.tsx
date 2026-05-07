"use client";

import { useEffect, useRef } from "react";

export function EyesFollow() {
  const leftPupilRef = useRef<HTMLDivElement | null>(null);
  const rightPupilRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function updateEyePosition(clientX: number, clientY: number) {
      const x = `${(clientX * 100) / window.innerWidth}%`;
      const y = `${(clientY * 100) / window.innerHeight}%`;

      [leftPupilRef.current, rightPupilRef.current].forEach((pupil) => {
        if (!pupil) return;

        pupil.style.left = x;
        pupil.style.top = y;
        pupil.style.transform = `translate(-${x}, -${y})`;
      });
    }

    function resetEyes() {
      [leftPupilRef.current, rightPupilRef.current].forEach((pupil) => {
        if (!pupil) return;

        pupil.style.left = "50%";
        pupil.style.top = "50%";
        pupil.style.transform = "translate(-50%, -50%)";
      });
    }

    function handlePointerMove(event: PointerEvent) {
      updateEyePosition(event.clientX, event.clientY);
    }

    function handleSliderPointer(
      event: Event,
    ) {
      const detail = (event as CustomEvent<{ clientX: number; clientY: number }>).detail;
      if (!detail) return;
      updateEyePosition(detail.clientX, detail.clientY);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("backchannel:slider-pointer", handleSliderPointer);
    window.addEventListener("blur", resetEyes);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("backchannel:slider-pointer", handleSliderPointer);
      window.removeEventListener("blur", resetEyes);
    };
  }, []);

  return (
    <div
      className="mx-auto mb-4 flex w-full max-w-[360px] items-center justify-center gap-4 sm:mb-6 sm:max-w-[420px] sm:gap-7"
      aria-hidden="true"
    >
      <div className="relative h-[72px] w-[142px] overflow-hidden rounded-[50%] border-[3px] border-black/85 bg-white shadow-[0_8px_0_rgba(24,21,21,0.08)] sm:h-[90px] sm:w-[180px]">
        <div
          ref={leftPupilRef}
          className="absolute left-1/2 top-1/2 h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-black bg-black transition-[left,top,transform] duration-75 ease-out after:absolute after:left-2.5 after:top-2.5 after:h-2 after:w-2 after:rounded-full after:bg-white sm:h-[58px] sm:w-[58px] sm:after:left-3.5 sm:after:top-3.5 sm:after:h-2.5 sm:after:w-2.5"
        />
      </div>
      <div className="relative h-[72px] w-[142px] overflow-hidden rounded-[50%] border-[3px] border-black/85 bg-white shadow-[0_8px_0_rgba(24,21,21,0.08)] sm:h-[90px] sm:w-[180px]">
        <div
          ref={rightPupilRef}
          className="absolute left-1/2 top-1/2 h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-black bg-black transition-[left,top,transform] duration-75 ease-out after:absolute after:left-2.5 after:top-2.5 after:h-2 after:w-2 after:rounded-full after:bg-white sm:h-[58px] sm:w-[58px] sm:after:left-3.5 sm:after:top-3.5 sm:after:h-2.5 sm:after:w-2.5"
        />
      </div>
    </div>
  );
}
