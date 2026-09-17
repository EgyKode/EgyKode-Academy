"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Reading progress, stored in the browser.
 *
 * Three components need the same set of completed chapter ids — the roadmap
 * canvas, the "continue learning" card, and the mark-complete button on a
 * chapter — and they can be on screen at the same time. `storage` events only
 * fire in *other* tabs, so a custom event carries the change to listeners in
 * this one; without it, marking a chapter complete leaves the progress bar at
 * the top of the same page showing a stale number.
 *
 * Signed-in sync lands with accounts (§13.4); until then this is deliberately
 * device-local, and the UI says so rather than implying an account exists.
 */
export const PROGRESS_KEY = "egykode_progress";
const PROGRESS_EVENT = "egykode:progress";

export function readProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    // Corrupt or unavailable storage (private mode, quota) is not an error
    // worth showing anyone — it just means no progress yet.
    return new Set();
  }
}

export function writeProgress(next: Set<string>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
  } catch {
    /* storage unavailable — progress simply does not persist */
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

const MIGRATION_FLAG = "egykode_apex_migrated_v1";

export function migrateApexProgress(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG) || window.location.hostname === "egykode.com") {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = "https://egykode.com/bridge.html";
  iframe.style.display = "none";
  iframe.setAttribute("aria-hidden", "true");

  const cleanup = () => {
    window.removeEventListener("message", onMessage);
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== "https://egykode.com") return;
    try {
      if (event.data && event.data.type === "EGYKODE_SYNC_RESPONSE" && event.data.data) {
        const { progress, stepMarks, labCriteria, theme } = event.data.data;

        if (Array.isArray(progress) && progress.length > 0) {
          const current = readProgress();
          progress.forEach((id: string) => current.add(id));
          writeProgress(current);
        }

        if (stepMarks && !localStorage.getItem("egykode_step_marks")) {
          localStorage.setItem("egykode_step_marks", JSON.stringify(stepMarks));
        }

        if (labCriteria && !localStorage.getItem("egykode_lab_criteria")) {
          localStorage.setItem("egykode_lab_criteria", JSON.stringify(labCriteria));
        }

        if (theme && !localStorage.getItem("egykode_theme")) {
          localStorage.setItem("egykode_theme", theme);
        }

        localStorage.setItem(MIGRATION_FLAG, "true");
        cleanup();
      }
    } catch {
      // Storage unavailable or parsing issue
    }
  };

  window.addEventListener("message", onMessage);

  iframe.onload = () => {
    iframe.contentWindow?.postMessage({ type: "EGYKODE_SYNC_REQUEST" }, "https://egykode.com");
  };

  // 5-second fallback cleanup
  setTimeout(() => {
    cleanup();
    localStorage.setItem(MIGRATION_FLAG, "true");
  }, 5000);

  document.body.appendChild(iframe);
}

/**
 * `null` until the store has been read, so a first render can show nothing
 * rather than flashing "0% complete" at someone who is mid-way through.
 */
export function useProgress(): {
  done: Set<string> | null;
  toggle: (contentId: string) => void;
  isDone: (contentId: string) => boolean;
} {
  const [done, setDone] = useState<Set<string> | null>(null);

  useEffect(() => {
    const sync = () => setDone(readProgress());
    sync();
    migrateApexProgress();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync); // another tab changed it
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((contentId: string) => {
    const next = readProgress();
    if (next.has(contentId)) next.delete(contentId);
    else next.add(contentId);
    writeProgress(next);
    setDone(next);
  }, []);

  return {
    done,
    toggle,
    isDone: (contentId: string) => done?.has(contentId) ?? false,
  };
}
