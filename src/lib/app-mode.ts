"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * "App mode": whether the site should feel like an app (bottom navigation bar) rather than a plain website.
 * That is the case for people who are signed in, who signed in on this device before, or who opened the installed app.
 * First-time visitors get the website.
 */

const KEY = "mastatine:app-user";
const STANDALONE = "(display-mode: standalone)";

function remembered(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false; // storage blocked (private mode, settings): just the website
  }
}

function read(): boolean {
  return window.matchMedia(STANDALONE).matches || remembered();
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(STANDALONE);
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** True when the app chrome should show. Signing in remembers this device, so it stays an app after signing out. */
export function useAppMode(signedIn: boolean): boolean {
  const returning = useSyncExternalStore(subscribe, read, () => false);
  useEffect(() => {
    if (!signedIn) return;
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // storage blocked: nothing to remember, the signed-in state already shows the app
    }
  }, [signedIn]);
  return signedIn || returning;
}
