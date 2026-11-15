"use client";

/**
 * Browser-side app plumbing: the service worker registration and the browser's install prompt.
 * Chromium fires `beforeinstallprompt` once, early in the page load, so it is caught here (on every page)
 * and kept for whichever button wants to offer the install later.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

let started = false;

/** Registers the service worker and starts listening for the install prompt. Safe to call more than once. */
export function startPwa(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we offer the install from our own button instead of the mini-infobar
    deferred = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error: Error) => {
      console.error("Service worker registration failed:", error.message);
    });
  }
}

export interface InstallState {
  /** Running as the installed app. */
  standalone: boolean;
  /** The browser offered an install we can trigger from a button. */
  canPrompt: boolean;
  /** iPhone/iPad Safari: installing is manual, via Share > Add to Home Screen. */
  ios: boolean;
}

const SERVER_STATE: InstallState = { standalone: false, canPrompt: false, ios: false };
let snapshot: InstallState = SERVER_STATE;

function readState(): InstallState {
  const standalone =
    installed || window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const next = { standalone, canPrompt: deferred !== null, ios };
  // useSyncExternalStore needs a stable object while nothing changed.
  if (next.standalone !== snapshot.standalone || next.canPrompt !== snapshot.canPrompt || next.ios !== snapshot.ios) snapshot = next;
  return snapshot;
}

export const installStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: readState,
  getServerSnapshot: (): InstallState => SERVER_STATE,
};

/** Shows the browser's install dialog. Returns whether the person installed the app. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}

/** Converts the VAPID public key to the byte form `pushManager.subscribe` wants. */
export function vapidKeyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
