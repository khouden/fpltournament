import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Tournaments — Custom Fantasy Premier League Knockout Tournaments",
  description: "Automated Gameweek score calculations, strict Admin points exclusion, and live knockout progression tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Strip browser extension injected attributes (e.g. bis_skin_checked) before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var observer = new MutationObserver(function(mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'attributes') {
                      if (m.attributeName === 'bis_skin_checked') {
                        m.target.removeAttribute('bis_skin_checked');
                      } else if (m.attributeName && m.attributeName.indexOf('__processed_') === 0) {
                        m.target.removeAttribute(m.attributeName);
                      } else if (m.attributeName === 'bis_register') {
                        m.target.removeAttribute('bis_register');
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, { attributes: true, subtree: true });
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
