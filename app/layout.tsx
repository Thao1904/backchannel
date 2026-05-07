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
        <BackchannelProvider>{children}</BackchannelProvider>
      </body>
    </html>
  );
}
