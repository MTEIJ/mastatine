"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { disablePush, enablePush, sendTestPush } from "@/app/(pages)/account/push-actions";
import { installStore, promptInstall, vapidKeyBytes } from "@/lib/pwa-client";

type PushStatus = "loading" | "unsupported" | "needs-install" | "blocked" | "off" | "on";

/** Install the site as an app. Not shown in the installed app itself. */
export function InstallCard() {
  const { standalone, canPrompt, ios } = useSyncExternalStore(installStore.subscribe, installStore.getSnapshot, installStore.getServerSnapshot);
  if (standalone) return null;

  return (
    <section aria-labelledby="install-title" className="card setting-row mt-4">
      <div className="setting-row__body">
        <h2 id="install-title" className="setting-row__title">Install the app</h2>
        <p className="setting-row__text">
          {ios
            ? "Tap Share in Safari, then “Add to Home Screen”."
            : canPrompt
              ? "Put Mastatine on your home screen: one tap to your activities and the MastApps."
              : "Use your browser menu (“Install app” or “Add to Home screen”)."}
        </p>
      </div>
      {canPrompt && (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void promptInstall()}>
          Install
        </button>
      )}
    </section>
  );
}

const noSubscription = () => () => {};

const SUBSCRIBE_TIMEOUT_MS = 20_000;

/** Browsers without a reachable push service can leave `subscribe` pending forever; give up with a clear message. */
function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), SUBSCRIBE_TIMEOUT_MS);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function initialStatus(ios: boolean, standalone: boolean): PushStatus {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return ios && !standalone ? "needs-install" : "unsupported";
  return Notification.permission === "denied" ? "blocked" : "loading";
}

const STATUS_TEXT: Record<PushStatus, string> = {
  loading: "Checking this device…",
  unsupported: "This browser cannot show notifications.",
  "needs-install": "On iPhone and iPad, install the app first, then turn this on from the app.",
  blocked: "Blocked for this site. Allow notifications in your browser settings.",
  off: "New activities, reminders and changes to activities you joined.",
  on: "On for this device.",
};

/** The notifications setting for this device: a switch, with a way to send a test once it is on. */
export function NotificationsRow({ publicKey }: { publicKey: string }) {
  const { standalone, ios } = useSyncExternalStore(installStore.subscribe, installStore.getSnapshot, installStore.getServerSnapshot);
  // What the browser itself allows, read during render ("loading" means: supported, ask the service worker).
  const capability = useSyncExternalStore(noSubscription, () => initialStatus(ios, standalone), () => "loading" as PushStatus);
  const [device, setStatus] = useState<PushStatus>("loading");
  const status = capability === "loading" ? device : capability;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (capability !== "loading") return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        // Re-link a device that is already subscribed, in case it was last used by another account.
        if (existing) await enablePush(existing.toJSON());
        if (!cancelled) setStatus(existing ? "on" : "off");
      })
      .catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, [capability]);

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await withTimeout(
        registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKeyBytes(publicKey) }),
        "your browser's notification service did not answer. Try again later",
      );
      const result = await enablePush(subscription.toJSON());
      if (!result.ok) {
        await subscription.unsubscribe();
        setMessage(result.error ?? "Could not turn on notifications.");
        return;
      }
      setStatus("on");
    } catch (error) {
      setMessage(`Could not turn on notifications: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await disablePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch (error) {
      setMessage(`Could not turn off notifications: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const result = await sendTestPush();
    setMessage(result.ok ? "Sent. It should pop up in a moment." : (result.error ?? "Could not send a test."));
    setBusy(false);
  }

  const canToggle = status === "on" || status === "off" || status === "loading";

  return (
    <div className="setting-row">
      <div className="setting-row__body">
        <h2 id="push-title" className="setting-row__title">Notifications</h2>
        <p className="setting-row__text">{STATUS_TEXT[status]}</p>
        {status === "on" && (
          <button type="button" className="setting-row__link" disabled={busy} onClick={test}>Send a test</button>
        )}
        {message && <p role="status" className="setting-row__text">{message}</p>}
      </div>
      {canToggle && (
        <button
          type="button"
          role="switch"
          aria-checked={status === "on"}
          aria-labelledby="push-title"
          className="switch"
          disabled={busy || status === "loading"}
          onClick={status === "on" ? turnOff : turnOn}
        />
      )}
    </div>
  );
}
