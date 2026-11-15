"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { disablePush, enablePush, sendTestPush } from "@/app/(pages)/account/push-actions";
import { installStore, promptInstall, vapidKeyBytes } from "@/lib/pwa-client";

type PushStatus = "loading" | "unsupported" | "needs-install" | "blocked" | "off" | "on";

function InstallCard() {
  const { standalone, canPrompt, ios } = useSyncExternalStore(installStore.subscribe, installStore.getSnapshot, installStore.getServerSnapshot);
  if (standalone) return null;

  return (
    <section aria-labelledby="install-title" className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1 basis-64">
        <h2 id="install-title" className="font-extrabold">Install the app</h2>
        <p className="mt-1 text-sm text-muted">
          {ios
            ? "Tap the Share button in Safari, then “Add to Home Screen”. Mastatine then opens like an app, with notifications."
            : canPrompt
              ? "Put Mastatine on your home screen or desktop: one tap to the activities and the MastApps."
              : "Use your browser menu (“Install app” or “Add to Home screen”) to put Mastatine on your home screen."}
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
  "needs-install": "On iPhone and iPad, install the app first (see above), then turn notifications on from the app.",
  blocked: "Notifications are blocked for this site. Allow them in your browser settings, then come back.",
  off: "Get a nudge on this device when a new activity is announced, the day before an activity you joined, and when one you joined changes.",
  on: "On for this device. You hear about new activities, reminders, and changes to activities you joined.",
};

function NotificationsCard({ publicKey }: { publicKey: string }) {
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

  return (
    <section aria-labelledby="push-title" className="card mt-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h2 id="push-title" className="font-extrabold">Notifications</h2>
          <p className="mt-1 text-sm text-muted">{STATUS_TEXT[status]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "off" && <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={turnOn}>{busy ? "Turning on…" : "Turn on"}</button>}
          {status === "on" && (
            <>
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={test}>Send a test</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={turnOff}>Turn off</button>
            </>
          )}
        </div>
      </div>
      {message && <p role="status" className="mt-2 text-sm text-muted">{message}</p>}
    </section>
  );
}

/** Account page: install the site as an app and manage push notifications for this device. */
export default function AppSettings({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  return (
    <>
      <InstallCard />
      {vapidPublicKey && <NotificationsCard publicKey={vapidPublicKey} />}
    </>
  );
}
