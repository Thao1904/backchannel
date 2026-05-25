import type { Metadata } from "next";
import { BackchannelProvider } from "@/components/backchannel/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backchannel",
  description: "Minimal placeholder scaffold for the Backchannel flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BackchannelProvider>
          {children}
          <p className="pointer-events-none fixed bottom-3 left-4 z-[100] max-w-[52vw] text-[10px] font-semibold leading-4 text-[#4a4a4a] sm:max-w-lg sm:text-[11px]">
            By participating in this experience, you agree that the interaction,
            provided responses, and generated conversation may be recorded and
            used as part of the Backchannel installation.
          </p>
          <p className="pointer-events-none fixed bottom-3 right-4 z-[100] text-[10px] font-black uppercase tracking-[0.14em] text-[#e879b9] sm:text-[11px]">
            create by @mee.ltt
          </p>
        </BackchannelProvider>
      </body>
    </html>
  );
}
