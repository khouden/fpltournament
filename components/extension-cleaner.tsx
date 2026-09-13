"use client";

import { useEffect } from "react";

/**
 * Strips browser extension injected attributes (e.g. bis_skin_checked)
 * dynamically on the client without rendering raw <script> tags.
 */
export function ExtensionCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === "attributes" && m.target instanceof Element) {
          if (m.attributeName === "bis_skin_checked") {
            m.target.removeAttribute("bis_skin_checked");
          } else if (m.attributeName && m.attributeName.startsWith("__processed_")) {
            m.target.removeAttribute(m.attributeName);
          } else if (m.attributeName === "bis_register") {
            m.target.removeAttribute("bis_register");
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
