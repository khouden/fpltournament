"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Global top progress bar and loading feedback for Next.js navigation.
 * Fires immediately upon clicking any internal link or button, providing instant visual feedback
 * before the Next.js Server Component finishes streaming.
 */
export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const completionTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startProgress = React.useCallback(() => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVisible(true);
    setIsLoading(true);
    setProgress(15);

    // Increment progress in realistic stages
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + 15;
        if (prev < 70) return prev + 8;
        if (prev < 88) return prev + 2;
        return prev;
      });
    }, 150);
  }, []);

  const finishProgress = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setProgress(100);
    setIsLoading(false);

    // Fade out smoothly
    completionTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 250);
  }, []);

  // When pathname or searchParams change, mark transition as complete
  React.useEffect(() => {
    finishProgress();
  }, [pathname, searchParams, finishProgress]);

  // Intercept internal link clicks to immediately trigger the loading indicator
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;

      // Ignore special clicks (new tab, download, external, hash)
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Only handle internal navigation to different pages/queries
        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
        ) {
          startProgress();
        }
      } catch {
        // Ignore invalid URL
      }
    };

    // Custom window event for programmatic navigation (e.g. router.push)
    const handleStartEvent = () => startProgress();
    const handleEndEvent = () => finishProgress();

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("fpl-nav-start", handleStartEvent);
    window.addEventListener("fpl-nav-end", handleEndEvent);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("fpl-nav-start", handleStartEvent);
      window.removeEventListener("fpl-nav-end", handleEndEvent);
      if (timerRef.current) clearInterval(timerRef.current);
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, [startProgress, finishProgress]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isLoading ? 1 : 0 }}
    >
      {/* Top glowing gradient progress bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-[#00FFA3] via-[#00D9FF] to-[#E9007F] shadow-[0_0_12px_rgba(0,255,163,0.85)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "250ms",
        }}
      />

      {/* Floating subtle corner badge for mobile & desktop */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-5 z-[99999] flex items-center gap-2 rounded-full bg-[#0B081E]/90 border border-white/20 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md animate-fpl-fade-in">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00FFA3]" />
        <span className="text-[11px] font-black uppercase tracking-wider text-[#00FFA3]">
          Loading...
        </span>
      </div>
    </div>
  );
}

/**
 * Utility helper to trigger the navigation progress bar programmatically
 */
export function triggerNavigationStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fpl-nav-start"));
  }
}

export function triggerNavigationEnd() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fpl-nav-end"));
  }
}
