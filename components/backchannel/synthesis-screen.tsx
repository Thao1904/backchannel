"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBackchannel } from "@/components/backchannel/provider";
import { ScreenFrame } from "@/components/backchannel/shared";

export function SynthesisScreen() {
  const router = useRouter();
  const { runGeneration, state } = useBackchannel();
  const synthesisLines =
    state.content.synthesisLines.length > 0
      ? state.content.synthesisLines
      : ["building the room..."];
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const cycle = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % synthesisLines.length);
    }, 900);

    runGeneration().then(() => {
      window.setTimeout(() => {
        if (!cancelled) {
          router.push("/chatroom");
        }
      }, 2800);
    });

    return () => {
      cancelled = true;
      window.clearInterval(cycle);
    };
  }, [router, runGeneration, synthesisLines.length]);

  return (
    <ScreenFrame
      title="Synthesis"
        description="The room is assembling itself from your habits."
        step="Step 04"
    >
      <div className="space-y-4">
        {synthesisLines.map((line, index) => (
          <p
            key={line}
            className={`text-lg ${
              index === lineIndex ? "text-sky-200" : "text-slate-500"
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </ScreenFrame>
  );
}
