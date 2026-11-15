"use client";

import Link from "next/link";
import { useAccountState } from "@/components/AccountState";

const icon = { viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const UserIcon = () => (
  <svg {...icon}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

/** Sign-in state comes from the root layout (see AccountState), so no auth client is loaded for it. */
export default function SidebarAccount() {
  const { signedIn } = useAccountState();

  if (!signedIn) {
    return (
      <Link href="/login" aria-label="Sign in" className="keep-label">
        <UserIcon />
        <span>Sign in</span>
      </Link>
    );
  }

  return (
    <Link href="/account" aria-label="Account">
      <UserIcon />
      <span>Account</span>
    </Link>
  );
}
