"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useAccountState } from "@/components/AccountState";
import { installStore, promptInstall } from "@/lib/pwa-client";

const STORAGE_KEY = "mastatine_dismissed_install";
const CHANGE_EVENT = "mastatine:install-dismissed";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false; // storage blocked: the banner simply comes back on every visit
  }
}

function dismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // storage blocked: the banner returns on the next visit
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Tells signed-in visitors they can install the site as an app. Shown only when installing is possible (the browser
 * offered a prompt, or iPhone/iPad where it is manual), never inside the installed app, and not on the account page,
 * which has its own install card. Closing it is remembered on this device.
 */
export default function InstallBanner() {
  const { signedIn } = useAccountState();
  const pathname = usePathname();
  const { standalone, canPrompt, ios } = useSyncExternalStore(installStore.subscribe, installStore.getSnapshot, installStore.getServerSnapshot);
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);

  if (!signedIn || dismissed || standalone || !(canPrompt || ios)) return null;
  if (pathname.startsWith("/account")) return null;

  return (
    <aside role="status" aria-label="Install the app" className="install-snack">
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 48px app icon */}
      <img src="/icons/icon-192.png" alt="" width={48} height={48} className="install-snack__icon" />
      <div className="install-snack__body">
        <p className="install-snack__title">Install the Mastatine app</p>
        <p className="install-snack__text">
          {canPrompt ? "One tap to your activities and the MastApps." : "Tap Share, then “Add to Home Screen”."}
        </p>
      </div>
      <div className="install-snack__actions">
        <button type="button" className="install-snack__btn" onClick={dismiss}>
          Not now
        </button>
        {canPrompt && (
          <button type="button" className="install-snack__btn install-snack__btn--primary" onClick={() => void promptInstall()}>
            Install
          </button>
        )}
      </div>
    </aside>
  );
}
