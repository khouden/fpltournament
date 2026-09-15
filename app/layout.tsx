import type { Metadata } from "next";
import "./globals.css";
import { ExtensionCleaner } from "@/components/extension-cleaner";
import { NavigationProgressBar } from "@/components/navigation/navigation-progress-bar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "FPL Tournaments — Custom Fantasy Premier League Knockout Tournaments",
  description: "Automated Gameweek score calculations, strict Admin points exclusion, and live knockout progression tracking.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <ExtensionCleaner />
        {children}
      </body>
    </html>
  );
}
