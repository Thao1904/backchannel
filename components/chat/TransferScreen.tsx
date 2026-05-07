"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAdminSettings } from "@/lib/chat-storage";

export function TransferScreen() {
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [title, setTitle] = useState("The arrangement is recorded.");
  const [subtitle, setSubtitle] = useState(
    "Backchannel is opening. The room is turning your survey into a live conversation.",
  );
  const [durationMs, setDurationMs] = useState(3200);
  const [blackPhase, setBlackPhase] = useState(false);
  const [textPhase, setTextPhase] = useState(false);

  useEffect(() => {
    const settings = loadAdminSettings();
    setTitle(settings.transferScreenTitle);
    setSubtitle(settings.transferScreenSubtitle);
    setDurationMs(settings.transferScreenDurationMs);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const blackTimer = window.setTimeout(() => {
      setBlackPhase(true);
    }, 380);

    const textTimer = window.setTimeout(() => {
      setTextPhase(true);
    }, 780);

    const routeTimer = window.setTimeout(() => {
      router.push("/chat");
    }, Math.max(1800, durationMs));

    return () => {
      window.clearTimeout(blackTimer);
      window.clearTimeout(textTimer);
      window.clearTimeout(routeTimer);
    };
  }, [durationMs, hasHydrated, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4bfd6]">
      <div
        className={`absolute inset-0 transition-opacity duration-[1400ms] ${
          blackPhase ? "opacity-100" : "opacity-0"
        } bg-black`}
      />

      <div
        className={`relative z-10 flex min-h-screen items-center justify-center px-6 transition-all duration-[1200ms] ${
          textPhase ? "opacity-100 blur-0" : "translate-y-3 opacity-0 blur-sm"
        }`}
      >
        <div className="max-w-3xl text-center text-white">
          <p className="text-4xl font-black uppercase tracking-[-0.08em] sm:text-6xl">
            {title}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-white/70 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </main>
  );
}
