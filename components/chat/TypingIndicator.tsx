"use client";

export function TypingIndicator({
  speaker = "Vault",
  className = "",
}: {
  speaker?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex max-w-[240px] items-center gap-2 rounded-[1.2rem] border-[2px] border-[#2c2c2c] bg-[#fafaf7] px-3 py-2.5 text-[13px] text-[#161616]/70 sm:max-w-[220px] sm:gap-3 sm:rounded-[1.6rem] sm:px-4 sm:py-3 sm:text-sm ${className}`}
    >
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#161616] [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#161616] [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#161616]" />
      </div>
      <span>{speaker} is typing...</span>
    </div>
  );
}
