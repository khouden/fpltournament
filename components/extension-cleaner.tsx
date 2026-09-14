"use client";

import { useEffect } from "react";

/**
 * Strips browser extension injected attributes (e.g. bis_skin_checked)
 * dynamically on the client without rendering raw <script> tags.
 */
export function ExtensionCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const attributesToClean = ["bis_skin_checked", "bis_register"];

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === "attributes" && m.target instanceof Element && m.attributeName) {
          if (attributesToClean.includes(m.attributeName)) {
            if (m.target.hasAttribute(m.attributeName)) {
              m.target.removeAttribute(m.attributeName);
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: attributesToClean,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
