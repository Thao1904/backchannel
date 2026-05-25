"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function buildFeedbackUrl() {
  const configuredBase = process.env.NEXT_PUBLIC_REALCHAT_BASE_URL?.trim();

  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, "")}/feedback`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/feedback`;
  }

  return "/feedback";
}

function buildQrImageUrl(value: string) {
  const encoded = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=148x148&margin=10&data=${encoded}`;
}

export function GlobalKioskOverlay() {
  const pathname = usePathname();
  const feedbackUrl = buildFeedbackUrl();
  const showFeedback = pathname !== "/chat/transfer";
  const showRestart = pathname === "/" || pathname === "/chat";
  const feedbackButtonClass =
    pathname === "/chat"
      ? "mt-2 flex h-8 items-center justify-center rounded-full border-[2px] border-[#2b2b2b] bg-[#e7e5df] text-[10px] font-black uppercase tracking-[0.12em] text-[#20151b] transition hover:bg-white"
      : "mt-2 flex h-8 items-center justify-center rounded-full border-[2px] border-[#2b2b2b] bg-[#ff8bc8] text-[10px] font-black uppercase tracking-[0.12em] text-[#20151b] transition hover:bg-white";

  function restartExperience() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem("chat.messages");
    window.localStorage.removeItem("chat.generatedChatCache");
    window.localStorage.removeItem("chat.surveyPayload");
    window.location.href = "/";
  }

  return (
    <>
      {showFeedback ? (
        <aside className="fixed left-4 top-4 z-[100] hidden w-[118px] rounded-[1rem] border-[2px] border-[#2b2b2b] bg-[#ffe1f2]/92 p-2 shadow-[4px_4px_0_rgba(0,0,0,0.16)] backdrop-blur sm:block">
          <img
            src={buildQrImageUrl(feedbackUrl)}
            alt="Feedback QR code"
            className="h-[98px] w-[98px] rounded-[0.65rem] bg-white object-contain"
          />
          <Link href="/feedback" className={feedbackButtonClass}>
            Feedback
          </Link>
        </aside>
      ) : null}

      {showRestart ? (
        <button
          type="button"
          onClick={restartExperience}
          className="fixed right-4 top-4 z-[100] rounded-full border-[2px] border-[#2b2b2b] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#181818] shadow-[3px_3px_0_rgba(0,0,0,0.16)] transition hover:bg-[#ffb8df]"
        >
          Restart
        </button>
      ) : null}
    </>
  );
}
