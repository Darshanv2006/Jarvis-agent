import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JARVIS | Personal AI Agent",
  description: "Autonomous Mission Control Agent for Gmail and Google Calendar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#080312]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#080312] text-[#f3e8ff] antialiased overflow-x-hidden selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
