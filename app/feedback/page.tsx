"use client";

import Link from "next/link";
import { useState } from "react";

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function submitFeedback() {
    setStatus("sending");
    setError("");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating,
        message,
        contact,
        pagePath: typeof window !== "undefined" ? window.location.pathname : "/feedback",
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setError(data.error ?? "Could not save feedback.");
      return;
    }

    setStatus("sent");
    setMessage("");
    setContact("");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe8f5_0%,#ffc4e5_42%,#f5a4d4_100%)] px-4 py-8 text-[#20151b]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border-[3px] border-[#2b2b2b] bg-[#fff7fb]/90 p-6 shadow-[8px_8px_0_rgba(43,43,43,0.16)] sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#20151b]/42">
            Backchannel feedback
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Tell us what stuck.
          </h1>
          <p className="mt-4 text-sm font-bold leading-7 text-[#4a3b43] sm:text-base">
            Your feedback is saved to the admin database for this installation.
          </p>

          <div className="mt-7">
            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[#20151b]/48">
              Rating
            </label>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`h-11 w-11 rounded-full border-[2px] border-[#2b2b2b] text-sm font-black transition ${
                    rating === value
                      ? "bg-[#ff58b5] text-[#20151b]"
                      : "bg-white text-[#20151b]/58 hover:bg-[#ffd4ec]"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-6 block">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#20151b]/48">
              Feedback
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              placeholder="What felt funny, strange, confusing, or worth keeping?"
              className="mt-3 w-full resize-none rounded-[1.2rem] border-[2px] border-[#2b2b2b] bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none placeholder:text-[#20151b]/32"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#20151b]/48">
              Contact optional
            </span>
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="@handle or email"
              className="mt-3 w-full rounded-[1rem] border-[2px] border-[#2b2b2b] bg-white px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#20151b]/32"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-[1rem] border border-red-400 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          {status === "sent" ? (
            <p className="mt-4 rounded-[1rem] border border-[#2b2b2b]/18 bg-[#ffdaf0] px-4 py-3 text-sm font-black text-[#20151b]">
              Saved. Thank you for feeding the room.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="rounded-full border-[2px] border-[#2b2b2b] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition hover:bg-[#ffd4ec]"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={submitFeedback}
              disabled={status === "sending"}
              className="rounded-full border-[2px] border-[#2b2b2b] bg-[#ff58b5] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "sending" ? "Saving..." : "Send feedback"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
