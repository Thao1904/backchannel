"use client";

import Link from "next/link";
import { useBackchannel } from "@/components/backchannel/provider";
import { RatingCard, ScreenFrame } from "@/components/backchannel/shared";

export function RatingScreen() {
  const { activeInputs, state, updateRating } = useBackchannel();

  return (
    <ScreenFrame
      title={state.content.ratingTitle}
      description={state.content.ratingDescription}
      step="Step 03"
    >
      <div className="space-y-6">
        <div className="grid gap-4">
          {activeInputs.map((input, index) => (
            <RatingCard
              key={input.deviceType}
              input={{
                ...input,
                hateRank: Math.min(input.hateRank, activeInputs.length || index + 1),
              }}
              maxHateRank={Math.max(activeInputs.length, 1)}
              onChange={(patch) => updateRating(input.deviceType, patch)}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Link
            href="/selection"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm text-slate-300"
          >
            Back
          </Link>
          <Link
            href="/synthesis"
            className="rounded-full border border-sky-400 bg-sky-400/10 px-5 py-3 text-sm text-sky-200"
          >
            Generate room
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}
